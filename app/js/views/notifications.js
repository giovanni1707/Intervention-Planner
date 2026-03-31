/* ============================================================
   views/notifications.js — Notification Center
   ============================================================
   Aggregates ALL system alerts into one place:
   - Overdue interventions  (status: assigned/tentative, past scheduled date)
   - Upcoming interventions (within 24 h / 6 h window)
   - SLA breaches           (high/urgent interventions open > 3 days)
   - Contracts expiring     (≤ 30 days)
   - PMC visits due         (today / this week)
   - Unplanned requests     (no scheduled date, status: new/tentative/assigned)

   Dismissed notification IDs persist in localStorage.
   ============================================================ */

window.Views = window.Views || {};

Views.Notifications = {

  _STORAGE_KEY: 'bps_dismissed_notifications',
  _MUTE_KEY:    'bps_notifications_muted',
  _activeTab: 'all',

  // ── MOUNT ──────────────────────────────────────────────────

  async mount() {
    const content = document.getElementById('mainContent');
    const notifications = this._buildNotifications();
    content.innerHTML = this._template(notifications);
    this._bindEvents();
    // Update sidebar badge after render
    NotificationCenter.updateBadge();
  },

  // ── BUILD ALL NOTIFICATIONS ────────────────────────────────

  _buildNotifications() {
    if (this._isMuted()) return [];
    const now   = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const notifications = [];

    // ── 1. Overdue interventions ──────────────────────────────
    const watchStatuses = ['assigned', 'tentative'];
    appState.interventions.forEach(i => {
      if (!watchStatuses.includes(i.status)) return;
      if (!i.scheduledDate) return;
      const scheduledTs = new Date(i.scheduledDate).getTime();
      if (scheduledTs >= now) return; // not overdue

      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const label   = `${client?.name || 'Unknown Client'} — ${machine?.model || 'Unknown Machine'}`;
      const hoursOverdue = Math.round((now - scheduledTs) / 3600000);
      const overdueLabel = hoursOverdue < 24
        ? `${hoursOverdue}h overdue`
        : `${Math.round(hoursOverdue / 24)}d overdue`;

      notifications.push({
        id:       `overdue-${i.id}`,
        category: 'interventions',
        severity: 'critical',
        title:    'Overdue Intervention',
        subject:  label,
        detail:   `Scheduled for ${Utils.formatDateTime(i.scheduledDate)} — now ${overdueLabel}. Status: ${CONFIG.STATUSES[i.status]?.label || i.status}. Technician: ${Utils.getTechnicianNames(i)}.`,
        ts:       scheduledTs,
        actionLabel: 'View Intervention',
        actionFn:    `Views.Notifications._goIntervention('${i.id}', 'Overdue Intervention: ${label.replace(/'/g, "\\'")}')`,
        jobNumber:   machine?.jobNumber || null
      });
    });

    // ── 2. Upcoming interventions (≤ 24 h) ───────────────────
    appState.interventions.forEach(i => {
      if (!watchStatuses.includes(i.status)) return;
      if (!i.scheduledDate) return;
      const scheduledTs = new Date(i.scheduledDate).getTime();
      const diff = scheduledTs - now;
      if (diff <= 0 || diff > 24 * 3600000) return;

      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const label   = `${client?.name || 'Unknown Client'} — ${machine?.model || 'Unknown Machine'}`;
      const hoursLeft = Math.round(diff / 3600000);
      const timeLeft  = hoursLeft < 1 ? 'less than 1 hour' : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;

      notifications.push({
        id:       `upcoming-${i.id}`,
        category: 'interventions',
        severity: 'warning',
        title:    'Upcoming Intervention',
        subject:  label,
        detail:   `Scheduled in ${timeLeft} (${Utils.formatDateTime(i.scheduledDate)}). Status: ${CONFIG.STATUSES[i.status]?.label || i.status}. Technician: ${Utils.getTechnicianNames(i)}.`,
        ts:       scheduledTs,
        actionLabel: 'View Intervention',
        actionFn:    `Views.Notifications._goIntervention('${i.id}', 'Upcoming Intervention: ${label.replace(/'/g, "\\'")}')`,
        jobNumber:   machine?.jobNumber || null
      });
    });

    // ── 3. SLA Breaches (high/urgent open > 3 days) ──────────
    const SLA_BREACH_MS = 3 * 24 * 3600000;
    const openStatuses  = ['new', 'tentative', 'assigned', 'in_progress'];
    appState.interventions.forEach(i => {
      if (!openStatuses.includes(i.status)) return;
      if (!['high', 'urgent'].includes(i.priority)) return;
      const createdTs = new Date(i.createdAt).getTime();
      if ((now - createdTs) < SLA_BREACH_MS) return;

      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const label   = `${client?.name || 'Unknown Client'} — ${machine?.model || 'Unknown Machine'}`;
      const daysOpen = Math.floor((now - createdTs) / 86400000);
      const priorityLabel = i.priority.charAt(0).toUpperCase() + i.priority.slice(1);

      notifications.push({
        id:       `sla-${i.id}`,
        category: 'sla',
        severity: i.priority === 'urgent' ? 'critical' : 'high',
        title:    'SLA Breach',
        subject:  label,
        detail:   `${priorityLabel} priority intervention open for ${daysOpen} day${daysOpen !== 1 ? 's' : ''} without resolution. Created: ${Utils.formatDateTime(i.createdAt)}. Status: ${CONFIG.STATUSES[i.status]?.label || i.status}.`,
        ts:       createdTs,
        actionLabel: 'View Intervention',
        actionFn:    `Views.Notifications._goIntervention('${i.id}', 'SLA Breach: ${label.replace(/'/g, "\\'")}')`,
        jobNumber:   machine?.jobNumber || null
      });
    });

    // ── 4. Unplanned requests (no scheduled date) ────────────
    appState.interventions.forEach(i => {
      if (!['new', 'tentative'].includes(i.status)) return;
      if (i.scheduledDate) return;
      if (i.type === 'pmc') return; // PMC handled separately

      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const label   = `${client?.name || 'Unknown Client'} — ${machine?.model || 'Unknown Machine'}`;
      const createdTs = new Date(i.createdAt).getTime();
      const priorityLabel = (CONFIG.STATUSES[i.priority] || {}).label
        || (i.priority ? (i.priority.charAt(0).toUpperCase() + i.priority.slice(1)) : 'Normal');

      notifications.push({
        id:       `unplanned-${i.id}`,
        category: 'interventions',
        severity: ['urgent','high'].includes(i.priority) ? 'high' : 'info',
        title:    'Unplanned Request',
        subject:  label,
        detail:   `New intervention request with no scheduled date. Priority: ${priorityLabel}. Created: ${Utils.formatDateTime(i.createdAt)}.`,
        ts:       createdTs,
        actionLabel: 'Schedule Now',
        actionFn:    `Views.Notifications._goIntervention('${i.id}', 'Unplanned Request: ${label.replace(/'/g, "\\'")}')`,
        jobNumber:   machine?.jobNumber || null
      });
    });

    // ── 5. Contracts expiring (≤ 30 days) ────────────────────
    if (Auth.isAdmin()) {
      appState.maintenanceContracts.forEach(contract => {
        if (!contract.endDate) return;
        const endTs  = new Date(contract.endDate).getTime();
        const diffMs = endTs - todayTs;
        if (diffMs < 0 || diffMs > 30 * 86400000) return;

        const machine = appState.machines.find(m => m.id === contract.machineId);
        const client  = appState.clients.find(c => c.id === contract.clientId);
        const label   = `${client?.name || '?'} — ${machine?.model || '?'}`;
        const daysLeft = Math.ceil(diffMs / 86400000);
        const sev = daysLeft <= 7 ? 'critical' : 'warning';

        notifications.push({
          id:       `contract-expiry-${contract.id}`,
          category: 'contracts',
          severity: sev,
          title:    daysLeft === 0 ? 'Contract Expired Today' : `Contract Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`,
          subject:  label,
          detail:   `Maintenance contract ends on ${Utils.formatDate ? Utils.formatDate(contract.endDate) : contract.endDate}. Renew before expiry to avoid coverage gaps.`,
          ts:       endTs,
          actionLabel: 'View Contract',
          actionFn:    `Views.Notifications._goContract('${contract.id}')`,
          jobNumber:   machine?.jobNumber || null
        });
      });

      // ── 6. PMC visits due (today or within 7 days) ─────────
      appState.maintenanceContracts.forEach(contract => {
        if (!contract.schedule || !contract.schedule.length) return;
        const machine = appState.machines.find(m => m.id === contract.machineId);
        const client  = appState.clients.find(c => c.id === contract.clientId);
        const label   = `${client?.name || '?'} — ${machine?.model || '?'}`;

        contract.schedule.forEach((dateStr, visitIdx) => {
          const visitTs = new Date(dateStr).getTime();
          const diffMs  = visitTs - todayTs;
          if (diffMs < 0 || diffMs > 7 * 86400000) return;

          // Skip if a completed PMC intervention exists for this visit
          const done = appState.interventions.some(i =>
            i.type === 'pmc' &&
            i.maintenanceContractId === contract.id &&
            i.maintenanceVisitIndex === visitIdx &&
            i.status === 'completed'
          );
          if (done) return;

          const daysLeft = Math.ceil(diffMs / 86400000);
          const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
          const visitLabel = ordinals[visitIdx] || `Visit #${visitIdx + 1}`;
          const sev = daysLeft === 0 ? 'critical' : daysLeft <= 1 ? 'warning' : 'info';
          const timeLabel = daysLeft === 0 ? 'due today' : daysLeft === 1 ? 'due tomorrow' : `due in ${daysLeft} days`;

          notifications.push({
            id:       `pmc-visit-${contract.id}-${visitIdx}`,
            category: 'pmc',
            severity: sev,
            title:    `PMC Visit ${timeLabel.charAt(0).toUpperCase() + timeLabel.slice(1)}`,
            subject:  label,
            detail:   `${visitLabel} scheduled maintenance visit ${timeLabel} (${dateStr}). Ensure technician is assigned and ready.`,
            ts:       visitTs,
            actionLabel: 'View Contract',
            actionFn:    `Views.Notifications._goContract('${contract.id}')`,
            jobNumber:   machine?.jobNumber || null
          });
        });
      });
    }

    // Sort: critical first, then by timestamp descending
    const SEV_ORDER = { critical: 0, high: 1, warning: 2, info: 3 };
    notifications.sort((a, b) => {
      const sevDiff = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
      if (sevDiff !== 0) return sevDiff;
      return b.ts - a.ts;
    });

    return notifications;
  },

  // ── TEMPLATE ───────────────────────────────────────────────

  _template(notifications) {
    const dismissed  = this._getDismissed();
    const active     = notifications.filter(n => !dismissed.has(n.id));
    const tab        = this._activeTab;

    const counts = {
      all:           active.length,
      interventions: active.filter(n => n.category === 'interventions').length,
      sla:           active.filter(n => n.category === 'sla').length,
      contracts:     active.filter(n => n.category === 'contracts').length,
      pmc:           active.filter(n => n.category === 'pmc').length,
    };

    const filtered = tab === 'all' ? active : active.filter(n => n.category === tab);

    const tabBar = `
      <div class="nc-tabs">
        ${[
          { key: 'all',           label: 'All' },
          { key: 'interventions', label: 'Interventions' },
          { key: 'sla',           label: 'SLA Breaches' },
          { key: 'contracts',     label: 'Contracts' },
          { key: 'pmc',           label: 'PMC Visits' }
        ].map(t => `
          <button class="nc-tab${tab === t.key ? ' active' : ''}"
            onclick="Views.Notifications._switchTab('${t.key}')">
            ${t.label}
            ${counts[t.key] > 0 ? `<span class="nc-tab-badge nc-tab-badge-${this._tabSeverity(t.key, active)}">${counts[t.key]}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `;

    const cards = filtered.length === 0
      ? `<div class="nc-empty">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
             <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
           </svg>
           <p class="nc-empty-title">All clear</p>
           <p class="nc-empty-sub">No active notifications in this category.</p>
         </div>`
      : filtered.map(n => this._cardHTML(n)).join('');

    const dismissedCount = notifications.length - active.length;
    const showDismissedHint = dismissedCount > 0
      ? `<p class="nc-dismissed-hint">${dismissedCount} dismissed notification${dismissedCount !== 1 ? 's' : ''} hidden.
           <button class="btn-link" onclick="Views.Notifications._clearDismissed()">Clear dismissed</button>
         </p>`
      : '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Notification Center</h1>
          <p class="page-subtitle">All system alerts and action items in one place</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${(() => {
            const muted = this._isMuted();
            return `<button class="btn btn-ghost btn-sm nc-mute-btn${muted ? ' nc-mute-btn-active' : ''}"
              onclick="Views.Notifications._toggleMute()" title="${muted ? 'Unmute notifications' : 'Mute notifications'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                ${muted
                  ? `<line x1="1" y1="1" x2="23" y2="23"/>
                     <path d="M17.73 17.73A10.75 10.75 0 0112 19c-4 0-7.55-2.5-9-6"/>
                     <path d="M6.26 6.26A10.75 10.75 0 0112 5c4 0 7.55 2.5 9 6a10.8 10.8 0 01-2.29 3.37"/>`
                  : `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                     <path d="M13.73 21a2 2 0 01-3.46 0"/>`
                }
              </svg>
              ${muted ? 'Unmute' : 'Mute'}
            </button>`;
          })()}
          ${active.length > 0 ? `
            <button class="btn btn-ghost btn-sm" onclick="Views.Notifications._dismissAll()">
              Dismiss All
            </button>` : ''}
        </div>
      </div>

      ${tabBar}

      <div class="nc-list">
        ${cards}
      </div>

      ${showDismissedHint}
    `;
  },

  _tabSeverity(tabKey, active) {
    const items = tabKey === 'all' ? active : active.filter(n => n.category === tabKey);
    if (items.some(n => n.severity === 'critical')) return 'critical';
    if (items.some(n => n.severity === 'high'))     return 'high';
    if (items.some(n => n.severity === 'warning'))  return 'warning';
    return 'info';
  },

  _cardHTML(n) {
    const SEV_CONFIG = {
      critical: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`, label: 'Critical' },
      high:     { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, label: 'High' },
      warning:  { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, label: 'Warning' },
      info:     { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`, label: 'Info' }
    };
    const sev = SEV_CONFIG[n.severity] || SEV_CONFIG.info;

    const CAT_LABELS = {
      interventions: 'Intervention',
      sla:           'SLA',
      contracts:     'Contract',
      pmc:           'PMC'
    };
    const catLabel = CAT_LABELS[n.category] || n.category;
    const jobBadge = n.jobNumber
      ? `<span class="nc-job-badge">Job #${Utils.escapeHtml(n.jobNumber)}</span>`
      : '';

    return `
      <div class="nc-card nc-card-${n.severity}" data-nc-id="${n.id}">
        <div class="nc-card-icon" style="color:${sev.color};background:${sev.bg}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            ${sev.icon}
          </svg>
        </div>
        <div class="nc-card-body">
          <div class="nc-card-header-row">
            <div class="nc-card-meta">
              <span class="nc-sev-badge" style="background:${sev.bg};color:${sev.color};border:1px solid ${sev.border}">${sev.label}</span>
              <span class="nc-cat-badge">${catLabel}</span>
              ${jobBadge}
            </div>
            <button class="nc-dismiss-btn" onclick="Views.Notifications._dismiss('${n.id}')" title="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="nc-card-title">${Utils.escapeHtml(n.title)}</div>
          <div class="nc-card-subject">${Utils.escapeHtml(n.subject)}</div>
          <div class="nc-card-detail">${Utils.escapeHtml(n.detail)}</div>
          <div class="nc-card-actions">
            <button class="btn btn-primary btn-sm" onclick="${n.actionFn}">
              ${n.actionLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ── BIND EVENTS ────────────────────────────────────────────

  _bindEvents() {
    // No additional event binding needed — all handled inline
  },

  // ── TAB SWITCHING ──────────────────────────────────────────

  _switchTab(tab) {
    this._activeTab = tab;
    this.mount();
  },

  // ── NAVIGATION ACTIONS ─────────────────────────────────────

  _goIntervention(id, label) {
    // Filter table to show only this specific job, then open the detail modal
    const intervention = appState.interventions.find(i => i.id === id);
    const machine = intervention ? appState.machines.find(m => m.id === intervention.machineId) : null;
    resetFilters();
    if (machine?.jobNumber) appState.filters.jobNumber = machine.jobNumber;
    if (label) appState.filters._filterLabel = label;
    Router.go('interventions');
    setTimeout(() => Views.Interventions.openDetailModal(id), 300);
  },

  _goContract(id) {
    Router.go('maintenance-contracts');
    setTimeout(() => {
      const contract = appState.maintenanceContracts.find(c => c.id === id);
      if (contract) Views.MaintenanceContracts.openDetailModal(contract);
    }, 300);
  },

  // ── DISMISS LOGIC ──────────────────────────────────────────

  _dismiss(id) {
    const dismissed = this._getDismissed();
    dismissed.add(id);
    this._saveDismissed(dismissed);
    // Remove the card from DOM without full re-render
    const card = document.querySelector(`[data-nc-id="${id}"]`);
    if (card) {
      card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(8px)';
      setTimeout(() => {
        card.remove();
        this._refreshCounters();
        NotificationCenter.updateBadge();
      }, 220);
    }
  },

  _dismissAll() {
    const dismissed = this._getDismissed();
    const all = this._buildNotifications();
    all.forEach(n => dismissed.add(n.id));
    this._saveDismissed(dismissed);
    this.mount();
    NotificationCenter.updateBadge();
  },

  _clearDismissed() {
    localStorage.removeItem(this._STORAGE_KEY);
    this.mount();
    NotificationCenter.updateBadge();
  },

  _getDismissed() {
    try {
      return new Set(JSON.parse(localStorage.getItem(this._STORAGE_KEY) || '[]'));
    } catch { return new Set(); }
  },

  _saveDismissed(set) {
    localStorage.setItem(this._STORAGE_KEY, JSON.stringify([...set]));
  },

  // ── MUTE ───────────────────────────────────────────────────

  _isMuted() {
    return localStorage.getItem(this._MUTE_KEY) === '1';
  },

  _toggleMute() {
    if (this._isMuted()) {
      localStorage.removeItem(this._MUTE_KEY);
      Toast.info('Notifications unmuted.');
    } else {
      localStorage.setItem(this._MUTE_KEY, '1');
      Toast.info('Notifications muted. Alerts will not appear until unmuted.');
    }
    this.mount();
    NotificationCenter.updateBadge();
  },

  // ── COUNTER REFRESH (after single dismiss) ─────────────────

  _refreshCounters() {
    const notifications = this._buildNotifications();
    const dismissed = this._getDismissed();
    const active = notifications.filter(n => !dismissed.has(n.id));
    const tab = this._activeTab;

    // Update tab badges
    const counts = {
      all:           active.length,
      interventions: active.filter(n => n.category === 'interventions').length,
      sla:           active.filter(n => n.category === 'sla').length,
      contracts:     active.filter(n => n.category === 'contracts').length,
      pmc:           active.filter(n => n.category === 'pmc').length,
    };

    ['all','interventions','sla','contracts','pmc'].forEach(key => {
      const tabEl = document.querySelector(`.nc-tab[onclick*="_switchTab('${key}')"]`);
      if (!tabEl) return;
      let badge = tabEl.querySelector('.nc-tab-badge');
      if (counts[key] > 0) {
        const sev = this._tabSeverity(key, active);
        if (!badge) {
          badge = document.createElement('span');
          tabEl.appendChild(badge);
        }
        badge.className = `nc-tab-badge nc-tab-badge-${sev}`;
        badge.textContent = counts[key];
      } else if (badge) {
        badge.remove();
      }
    });

    // Show/hide empty state for current tab
    const filtered = tab === 'all' ? active : active.filter(n => n.category === tab);
    const list = document.querySelector('.nc-list');
    if (list && filtered.length === 0 && !list.querySelector('.nc-empty')) {
      list.innerHTML = `
        <div class="nc-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p class="nc-empty-title">All clear</p>
          <p class="nc-empty-sub">No active notifications in this category.</p>
        </div>`;
    }

    // Update dismissed hint
    const dismissedCount = notifications.length - active.length;
    let hint = document.querySelector('.nc-dismissed-hint');
    if (dismissedCount > 0) {
      if (!hint) {
        hint = document.createElement('p');
        hint.className = 'nc-dismissed-hint';
        document.getElementById('mainContent').appendChild(hint);
      }
      hint.innerHTML = `${dismissedCount} dismissed notification${dismissedCount !== 1 ? 's' : ''} hidden.
        <button class="btn-link" onclick="Views.Notifications._clearDismissed()">Clear dismissed</button>`;
    } else if (hint) {
      hint.remove();
    }
  }
};

/* ============================================================
   NotificationCenter — global helper used by sidebar badge
   and scheduler to get the cross-category unread count
   ============================================================ */
const NotificationCenter = {

  _STORAGE_KEY: 'bps_dismissed_notifications',

  getCount() {
    try {
      const dismissed = new Set(JSON.parse(localStorage.getItem(this._STORAGE_KEY) || '[]'));
      if (!appState || !appState.interventions) return 0;
      const all = Views.Notifications._buildNotifications();
      return all.filter(n => !dismissed.has(n.id)).length;
    } catch { return 0; }
  },

  updateBadge() {
    const badge = document.getElementById('ncSidebarBadge');
    if (!badge) return;
    const count = this.getCount();
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
};
