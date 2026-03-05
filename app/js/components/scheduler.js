/* ============================================================
   components/scheduler.js — Intervention Scheduling Alerts
   ============================================================
   Monitors "tentative" and "assigned" interventions and:
   - Fires a reminder 6 hours before the scheduled date/time
   - Repeats the reminder every 6 hours until status is updated
   - Fires an overdue warning once the scheduled time has passed
     and the status is still tentative or assigned
   - Tracks all schedule revisions via scheduledHistory

   Alerts are displayed as:
   1. A toast notification (auto-dismissing) on first detection
   2. A persistent notification panel (bell icon in sidebar footer)
      that lists all active alerts until manually dismissed.

   Dismissed alert IDs are stored in localStorage so they are
   not shown again across page reloads.
   ============================================================ */

const Scheduler = {
  _intervalId: null,
  _CHECK_INTERVAL_MS: 60 * 1000,           // check every 60 seconds
  _REMINDER_WINDOW_MS: 6 * 60 * 60 * 1000, // 6 hours before scheduled time
  _REMINDER_REPEAT_MS: 6 * 60 * 60 * 1000, // repeat reminder every 6 hours
  _STORAGE_KEY: 'bps_dismissed_alerts',
  _TOAST_KEY: 'bps_toasted_alerts',        // session-only toasts (cleared on login)
  _panelOpen: false,

  // ── LIFECYCLE ──────────────────────────────────────────────

  start() {
    this._clearSessionToasts();
    this._run();
    this._intervalId = setInterval(() => this._run(), this._CHECK_INTERVAL_MS);
    this._renderBell();
  },

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  // ── CORE CHECK ────────────────────────────────────────────

  _run() {
    const now = Date.now();
    const alerts = this._buildAlerts(now);
    const newAlerts = alerts.filter(a => !this._isDismissed(a.id) && !this._wasToasted(a.id));

    // Fire toasts for newly detected alerts
    newAlerts.forEach(a => {
      if (a.type === 'overdue') {
        Toast.warning(a.shortMsg, 8000);
      } else {
        Toast.info(a.shortMsg, 6000);
      }
      this._markToasted(a.id);
    });

    // Always refresh the bell/panel UI
    this._updateBell(alerts.filter(a => !this._isDismissed(a.id)));
  },

  _buildAlerts(now) {
    const alerts = [];
    const watchStatuses = ['assigned', 'tentative'];

    appState.interventions.forEach(i => {
      if (!watchStatuses.includes(i.status)) return;
      if (!i.scheduledDate) return;

      const scheduled = new Date(i.scheduledDate).getTime();
      const diff = scheduled - now;           // negative = overdue
      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const tech    = appState.users.find(u => u.id === i.technicianId);
      const label   = `${client?.name || 'Unknown Client'} — ${machine?.model || 'Unknown Machine'}`;
      const dateStr = Utils.formatDateTime(i.scheduledDate);
      const techName = tech?.name || 'Unassigned';
      const statusLabel = CONFIG.STATUSES[i.status]?.label || i.status;

      // Count schedule revisions for context in messages
      const schedCount = (i.scheduledHistory || []).length;
      const revisionSuffix = schedCount > 1 ? ` (schedule revision #${schedCount})` : '';

      if (diff < 0) {
        // Past scheduled time — overdue
        alerts.push({
          id:       `overdue-${i.id}`,
          type:     'overdue',
          intId:    i.id,
          label,
          dateStr,
          techName,
          shortMsg: `OVERDUE: "${label}" was due at ${dateStr}${revisionSuffix} — status still "${statusLabel}". Technician: ${techName}.`,
          longMsg:  `Intervention is overdue${revisionSuffix}. It was scheduled for <strong>${dateStr}</strong> and the status is still <strong>${statusLabel}</strong>. Assigned technician: <strong>${techName}</strong>. Please update the status immediately.`
        });
      } else if (diff <= this._REMINDER_WINDOW_MS) {
        // Within 6h window — use time-bucketed ID so reminder repeats every 6h
        const bucket    = Math.floor(now / this._REMINDER_REPEAT_MS);
        const hoursLeft = Math.round(diff / (60 * 60 * 1000));
        const timeLeft  = hoursLeft < 1 ? 'less than 1 hour' : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
        alerts.push({
          id:       `remind-${i.id}-${bucket}`,
          type:     'reminder',
          intId:    i.id,
          label,
          dateStr,
          techName,
          shortMsg: `Reminder: "${label}" is scheduled in ${timeLeft}${revisionSuffix} (${dateStr}) — ${statusLabel}. Technician: ${techName}.`,
          longMsg:  `Intervention approaching in <strong>${timeLeft}</strong>${revisionSuffix} (scheduled: <strong>${dateStr}</strong>). Status: <strong>${statusLabel}</strong>. Assigned technician: <strong>${techName}</strong>. Please confirm or update the status before the scheduled time.`
        });
      }
    });

    return alerts;
  },

  // ── BELL ICON IN SIDEBAR ──────────────────────────────────

  _renderBell() {
    // Inject bell button into the sidebar footer, above the user area
    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;

    if (document.getElementById('schedulerBellBtn')) return; // already exists

    const bellWrapper = document.createElement('div');
    bellWrapper.id = 'schedulerBellWrapper';
    bellWrapper.className = 'scheduler-bell-wrapper';
    bellWrapper.innerHTML = `
      <button class="scheduler-bell-btn" id="schedulerBellBtn" title="Intervention Alerts" onclick="Scheduler._togglePanel()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span class="scheduler-bell-label">Alerts</span>
        <span class="scheduler-bell-badge hidden" id="schedulerBellBadge">0</span>
      </button>
    `;

    footer.insertBefore(bellWrapper, footer.firstChild);

    // Inject the panel container into the app shell (outside sidebar, positioned absolutely)
    if (!document.getElementById('schedulerPanel')) {
      const panel = document.createElement('div');
      panel.id = 'schedulerPanel';
      panel.className = 'scheduler-panel hidden';
      document.getElementById('appShell').appendChild(panel);
    }
  },

  _updateBell(activeAlerts) {
    const badge = document.getElementById('schedulerBellBadge');
    const bellBtn = document.getElementById('schedulerBellBtn');

    if (!badge) {
      // Bell not rendered yet — render first
      this._renderBell();
      return;
    }

    const count = activeAlerts.length;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
    if (bellBtn) {
      bellBtn.classList.toggle('scheduler-bell-has-alerts', count > 0);
      // Urgent style when any overdue
      const hasOverdue = activeAlerts.some(a => a.type === 'overdue');
      bellBtn.classList.toggle('scheduler-bell-overdue', hasOverdue);
    }

    // If panel is open, refresh its contents
    if (this._panelOpen) {
      this._renderPanel(activeAlerts);
    }
  },

  _togglePanel() {
    this._panelOpen = !this._panelOpen;
    const panel = document.getElementById('schedulerPanel');
    if (!panel) return;

    if (this._panelOpen) {
      const now = Date.now();
      const alerts = this._buildAlerts(now).filter(a => !this._isDismissed(a.id));
      this._renderPanel(alerts);
      // Position panel just to the right of the sidebar
      const sidebar = document.getElementById('sidebar');
      const sidebarW = sidebar ? sidebar.offsetWidth : 260;
      panel.style.left = (sidebarW + 12) + 'px';
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  },

  _renderPanel(alerts) {
    const panel = document.getElementById('schedulerPanel');
    if (!panel) return;

    const isEmpty = alerts.length === 0;

    panel.innerHTML = `
      <div class="scheduler-panel-header">
        <span class="scheduler-panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          Intervention Alerts
          ${alerts.length > 0 ? `<span class="scheduler-panel-count">${alerts.length}</span>` : ''}
        </span>
        <button class="scheduler-panel-close" onclick="Scheduler._togglePanel()" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="scheduler-panel-body">
        ${isEmpty
          ? `<div class="scheduler-panel-empty">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
               <p>No active alerts</p>
               <p style="font-size:0.75rem;color:var(--gray-400)">All interventions are on track.</p>
             </div>`
          : alerts.map(a => `
              <div class="scheduler-alert-item scheduler-alert-${a.type}">
                <div class="scheduler-alert-icon">
                  ${a.type === 'overdue'
                    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
                  }
                </div>
                <div class="scheduler-alert-content">
                  <div class="scheduler-alert-label">${Utils.escapeHtml(a.label)}</div>
                  <div class="scheduler-alert-msg">${a.longMsg}</div>
                  <div class="scheduler-alert-actions">
                    <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.75rem"
                      onclick="Scheduler._viewIntervention('${a.intId}')">View</button>
                    <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.75rem;color:var(--gray-400)"
                      onclick="Scheduler._dismiss('${a.id}')">Dismiss</button>
                  </div>
                </div>
              </div>
            `).join('')
        }
      </div>
      ${alerts.length > 0 ? `
        <div class="scheduler-panel-footer">
          <button class="btn btn-ghost btn-sm" onclick="Scheduler._dismissAll()" style="font-size:0.75rem;color:var(--gray-400)">
            Dismiss all
          </button>
        </div>` : ''}
    `;
  },

  _viewIntervention(interventionId) {
    this._panelOpen = false;
    document.getElementById('schedulerPanel')?.classList.add('hidden');
    // Navigate to interventions if not already there, then open detail
    if (appState.currentRoute !== 'interventions') {
      Router.go('interventions');
      setTimeout(() => Views.Interventions.openDetailModal(interventionId), 300);
    } else {
      Views.Interventions.openDetailModal(interventionId);
    }
  },

  // ── DISMISS LOGIC ─────────────────────────────────────────

  _dismiss(alertId) {
    const dismissed = this._getDismissed();
    dismissed.add(alertId);
    localStorage.setItem(this._STORAGE_KEY, JSON.stringify([...dismissed]));

    const now = Date.now();
    const alerts = this._buildAlerts(now).filter(a => !this._isDismissed(a.id));
    this._renderPanel(alerts);
    this._updateBell(alerts);
  },

  _dismissAll() {
    const now = Date.now();
    const alerts = this._buildAlerts(now);
    const dismissed = this._getDismissed();
    alerts.forEach(a => dismissed.add(a.id));
    localStorage.setItem(this._STORAGE_KEY, JSON.stringify([...dismissed]));

    this._renderPanel([]);
    this._updateBell([]);
  },

  _getDismissed() {
    try {
      return new Set(JSON.parse(localStorage.getItem(this._STORAGE_KEY) || '[]'));
    } catch { return new Set(); }
  },

  _isDismissed(alertId) {
    return this._getDismissed().has(alertId);
  },

  // ── SESSION TOAST TRACKING ────────────────────────────────
  // Toast each alert only once per login session (stored in sessionStorage)

  _clearSessionToasts() {
    sessionStorage.removeItem(this._TOAST_KEY);
  },

  _markToasted(alertId) {
    try {
      const toasted = new Set(JSON.parse(sessionStorage.getItem(this._TOAST_KEY) || '[]'));
      toasted.add(alertId);
      sessionStorage.setItem(this._TOAST_KEY, JSON.stringify([...toasted]));
    } catch {}
  },

  _wasToasted(alertId) {
    try {
      const toasted = new Set(JSON.parse(sessionStorage.getItem(this._TOAST_KEY) || '[]'));
      return toasted.has(alertId);
    } catch { return false; }
  }
};
