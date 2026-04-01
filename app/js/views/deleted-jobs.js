/* ============================================================
   views/deleted-jobs.js — Deleted Jobs Audit Log
   ============================================================ */

Views.DeletedJobs = {

  _countdownTimer: null,
  _records: [],

  async mount() {
    const content = document.getElementById('mainContent');
    this._records = await Storage.getDeletedJobs();
    content.innerHTML = this._template(this._records);
    this._bindEvents();
    this._startCountdowns();
  },

  _template(records) {
    const isSuperAdmin = Auth.isSuperAdmin();

    const rows = records.map(r => {
      const isQueued = !!r.purgeQueued;
      return `
      <tr${isQueued ? ' class="row-queued-purge"' : ''}>
        <td style="font-family:monospace;font-size:0.857rem">${Utils.escapeHtml(r.jobNumber || '—')}</td>
        <td style="font-family:monospace;font-size:0.857rem;color:var(--gray-500)">${Utils.escapeHtml(r.serialNumber || '—')}</td>
        <td class="td-primary">${Utils.escapeHtml(r.clientName || '—')}</td>
        <td>${Utils.escapeHtml(r.machineModel || '—')}</td>
        <td>${CONFIG.INTERVENTION_TYPES[r.type] || Utils.escapeHtml(r.type || '—')}</td>
        <td>${Utils.getStatusBadge(r.status)}</td>
        <td>${Utils.formatDate(r.createdAt)}</td>
        <td style="white-space:nowrap">${Utils.formatDateTime(r.deletedAt)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--red);color:white;display:flex;align-items:center;justify-content:center;font-size:0.714rem;font-weight:600;flex-shrink:0">
              ${Utils.getInitials(r.deletedBy || '?')}
            </div>
            <span>${Utils.escapeHtml(r.deletedBy || '—')}</span>
          </div>
        </td>
        <td style="max-width:200px;white-space:normal;font-size:0.857rem;color:var(--gray-600)">${Utils.escapeHtml(r.reason || '—')}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <button class="btn btn-ghost btn-sm btn-icon" title="View Job Details"
              data-viewdocid="${Utils.escapeHtml(r.id || '')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            ${isSuperAdmin ? `
              ${isQueued ? `
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span class="badge-queued-purge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span class="purge-countdown" data-queuedat="${Utils.escapeHtml(r.purgeQueuedAt || '')}"></span>
                  </span>
                  <button class="btn btn-ghost btn-sm" style="color:var(--green-600,#16a34a);border-color:var(--green-600,#16a34a);font-size:0.75rem;padding:2px 8px"
                    data-undodocid="${Utils.escapeHtml(r.id || '')}"
                    data-jobnumber="${Utils.escapeHtml(r.jobNumber || '')}">
                    Undo
                  </button>
                </div>
              ` : `
                <button class="btn btn-ghost btn-sm btn-icon" title="Queue for Deletion" style="color:var(--red)"
                  data-jobnumber="${Utils.escapeHtml(r.jobNumber || '')}"
                  data-clientname="${Utils.escapeHtml(r.clientName || '')}"
                  data-docid="${Utils.escapeHtml(r.id || '')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              `}
            ` : ''}
          </div>
        </td>
      </tr>
    `}).join('');

    const colSpan = 11;
    const queuedCount = records.filter(r => r.purgeQueued).length;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Deleted Jobs</h1>
          <p class="page-subtitle">Audit log of permanently deleted job entries</p>
        </div>
      </div>

      ${records.length > 0 ? `
        <div class="card" style="margin-bottom:16px;padding:12px 20px;background:#FEF2F2;border:1px solid #FECACA">
          <div style="display:flex;align-items:center;gap:10px;font-size:0.857rem;color:#991B1B">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              ${Auth.isSuperAdmin()
                ? `This log is <strong>read-only</strong> for standard users. As <strong>Head Administrator</strong>, you may queue records for deletion. Queued records are permanently purged after <strong>24 hours</strong> unless undone.${queuedCount > 0 ? ` <strong>${queuedCount} record${queuedCount !== 1 ? 's' : ''} currently queued.</strong>` : ''}`
                : 'This log is <strong>read-only</strong>. Deleted jobs cannot be restored from this view.'}
            </span>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header">
          <span class="card-title">Deletion Records</span>
          <span class="text-sm text-muted">${records.length} record${records.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Serial #</th>
                  <th>Client</th>
                  <th>Machine</th>
                  <th>Type</th>
                  <th>Last Status</th>
                  <th>Created</th>
                  <th>Deleted At</th>
                  <th>Deleted By</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${rows || `
                  <tr><td colspan="${colSpan}">
                    <div class="table-empty">
                      <p class="table-empty-text">No deleted jobs on record</p>
                    </div>
                  </td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    // View detail buttons — available to all roles
    document.querySelectorAll('[data-viewdocid]').forEach(btn => {
      btn.addEventListener('click', () => this._openDetailModal(btn.dataset.viewdocid));
    });

    if (!Auth.isSuperAdmin()) return;

    // Queue for deletion buttons
    document.querySelectorAll('[data-docid]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._openQueueModal(btn.dataset.jobnumber, btn.dataset.clientname, btn.dataset.docid);
      });
    });

    // Undo buttons
    document.querySelectorAll('[data-undodocid]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._confirmUndo(btn.dataset.undodocid, btn.dataset.jobnumber);
      });
    });
  },

  _startCountdowns() {
    if (this._countdownTimer) clearInterval(this._countdownTimer);
    this._updateCountdowns();
    this._countdownTimer = setInterval(() => this._updateCountdowns(), 1000);
  },

  _updateCountdowns() {
    document.querySelectorAll('.purge-countdown').forEach(el => {
      const queuedAt = el.dataset.queuedat;
      if (!queuedAt) { el.textContent = ''; return; }
      const remaining = new Date(queuedAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
      if (remaining <= 0) {
        el.textContent = 'expiring…';
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = `${h}h ${m}m ${s}s`;
    });
  },

  // ── DETAIL MODAL ──────────────────────────────────────────────

  _openDetailModal(docId) {
    const rec = this._records.find(r => r.id === docId);
    if (!rec) return;

    const snap = rec._snapshot;

    // Pull live appState references for display (machine/client may still be in system)
    const machine = snap
      ? appState.machines.find(m => m.id === snap.machineId)
      : appState.machines.find(m => m.jobNumber === rec.jobNumber);
    const client = snap
      ? appState.clients.find(c => c.id === snap.clientId)
      : appState.clients.find(c => c.name === rec.clientName);

    // Use archived summary as fallback for display values
    const jobNumber    = machine?.jobNumber    || rec.jobNumber    || '—';
    const serialNumber = machine?.serialNumber || rec.serialNumber || '—';
    const clientName   = client?.name          || rec.clientName   || '—';
    const machineModel = machine?.model        || rec.machineModel || '—';
    const type         = snap?.type            || rec.type         || '—';
    const status       = snap?.status          || rec.status       || '—';
    const priority     = snap?.priority        || null;
    const description  = snap?.description     || null;
    const location     = snap?.location        || null;
    const locationAddress = snap?.locationAddress || null;
    const scheduledDate   = snap?.scheduledDate   || null;
    const createdAt    = snap?.createdAt || rec.createdAt;
    const createdBy    = snap?.createdBy || '—';

    // Status history tabs
    const statusChain = [...(snap?.statusHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const allNotes    = [...(snap?.notes  || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const allParts    = [...(snap?.parts  || [])].sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
    const schedHistAll = [...(snap?.scheduledHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const statusTabs = statusChain.map((s, idx) => {
      const windowStart = new Date(s.timestamp);
      const windowEnd   = statusChain[idx + 1] ? new Date(statusChain[idx + 1].timestamp) : new Date(9999999999999);
      return {
        s,
        isLatest: idx === statusChain.length - 1,
        tabId:    `dj-stab-${docId}-${idx}`,
        panelId:  `dj-spanel-${docId}-${idx}`,
        windowStart,
        windowEnd,
        cardNotes: allNotes.filter(n => { const t = new Date(n.createdAt); return t >= windowStart && t < windowEnd; }),
        cardParts: allParts.filter(p => { const t = new Date(p.addedAt || 0); return t >= windowStart && t < windowEnd; }),
        cardScheds: schedHistAll.filter(sc => { const t = new Date(sc.timestamp); return t >= windowStart && t < windowEnd; })
      };
    });

    const tabBarHTML = statusTabs.length === 0 ? '' : `
      <div class="stab-bar" role="tablist">
        ${statusTabs.map(({ s, isLatest, tabId, panelId }) => `
          <button class="stab-btn${isLatest ? ' stab-btn-active' : ''}"
            id="${tabId}" role="tab"
            aria-selected="${isLatest}"
            aria-controls="${panelId}"
            onclick="Views.DeletedJobs._switchStatusTab(this)">
            ${Utils.getStatusBadge(s.status)}
            ${isLatest ? '<span class="stab-current-dot" title="Current"></span>' : ''}
          </button>
        `).join('')}
      </div>`;

    const tabPanelsHTML = statusTabs.length === 0
      ? '<p class="text-sm text-muted">No status history available.</p>'
      : statusTabs.map(({ s, isLatest, tabId, panelId, windowStart, windowEnd, cardNotes, cardParts, cardScheds }) => {

          const schedBlock = cardScheds.length === 0 ? '' : `
            <div class="stab-block">
              <div class="stab-block-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Schedule History
              </div>
              <div class="sched-history-timeline sched-history-inline">
                ${cardScheds.map(sc => {
                  const techIds = sc.technicianIds?.length ? sc.technicianIds : (sc.technicianId ? [sc.technicianId] : []);
                  const techName = techIds.length
                    ? techIds.map(id => appState.users.find(u => u.id === id)?.name).filter(Boolean).join(', ')
                    : null;
                  const cfg = CONFIG.STATUSES[sc.status];
                  return `
                    <div class="sched-history-item">
                      <div class="sched-history-dot"></div>
                      <div class="sched-history-content">
                        <div class="sched-history-date">${Utils.formatDateTime(sc.scheduledDate)}</div>
                        <div class="sched-history-row"><span class="badge ${cfg ? cfg.color : 'badge-gray'}">${CONFIG.STATUSES[sc.status]?.label || sc.status}</span></div>
                        <div class="sched-history-row sched-history-row-meta">Set by <strong>${Utils.escapeHtml(sc.changedBy)}</strong></div>
                        ${techName ? `<div class="sched-history-row sched-history-row-meta">Assigned to <strong>${Utils.escapeHtml(techName)}</strong></div>` : ''}
                        <div class="sched-history-row sched-history-row-time">${Utils.formatDateTime(sc.timestamp)}</div>
                      </div>
                    </div>`;
                }).join('')}
              </div>
            </div>`;

          const notesBlock = cardNotes.length === 0
            ? '<p class="stab-empty">No notes during this status.</p>'
            : cardNotes.map(n => `
                <div class="stab-note-item">
                  <p class="stab-note-text">${Utils.escapeHtml(n.text)}</p>
                  <p class="stab-note-meta">${Utils.escapeHtml(n.author)} · ${Utils.formatDateTime(n.createdAt)}</p>
                </div>`).join('');

          const partsBlock = cardParts.length === 0
            ? '<p class="stab-empty">No parts used during this status.</p>'
            : `<table class="parts-table">
                <thead><tr><th>Reference</th><th>Description</th><th>Qty</th><th>Unit</th><th>Added</th></tr></thead>
                <tbody>${cardParts.map(p => `
                  <tr>
                    <td style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
                    <td>${Utils.escapeHtml(p.description)}</td>
                    <td style="text-align:center">${p.quantity}</td>
                    <td><span class="part-unit-tag">${Utils.escapeHtml(p.unit || 'pcs')}</span></td>
                    <td>${Utils.formatDate(p.addedAt)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>`;

          return `
            <div class="stab-panel${isLatest ? ' stab-panel-active' : ''}"
              id="${panelId}" role="tabpanel" aria-labelledby="${tabId}">
              <div class="stab-panel-header">
                <div class="stab-panel-meta">
                  ${Utils.getStatusBadge(s.status)}
                  ${isLatest ? '<span class="al-current-tag">Current</span>' : ''}
                  <span class="stab-panel-by">by ${Utils.escapeHtml(s.changedBy)}</span>
                  <span class="stab-panel-time">${Utils.formatDateTime(s.timestamp)}</span>
                </div>
                ${s.note ? `<div class="stab-panel-note">${Utils.escapeHtml(s.note)}</div>` : ''}
              </div>
              ${schedBlock}
              <div class="stab-block">
                <div class="stab-block-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Notes
                </div>
                ${notesBlock}
              </div>
              <div class="stab-block">
                <div class="stab-block-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Parts Used
                </div>
                ${partsBlock}
              </div>
            </div>`;
        }).join('');

    // Deletion info banner
    const deletionBanner = `
      <div style="margin-bottom:16px;padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:0.857rem;color:#991B1B;display:flex;align-items:flex-start;gap:10px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0;margin-top:1px">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        <div>
          <strong>Deleted ${Utils.formatDateTime(rec.deletedAt)}</strong> by ${Utils.escapeHtml(rec.deletedBy || '—')}
          ${rec.reason ? `<div style="margin-top:3px;color:#B91C1C">Reason: ${Utils.escapeHtml(rec.reason)}</div>` : ''}
        </div>
      </div>`;

    const body = `
      ${deletionBanner}
      <div class="detail-section">
        <div class="detail-section-label">Intervention Details</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-field-label">Job Number</div><div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(jobNumber)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Serial Number</div><div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(serialNumber)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Client</div><div class="detail-field-value">${Utils.escapeHtml(clientName)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Machine</div><div class="detail-field-value">${Utils.escapeHtml(machineModel)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Type</div><div class="detail-field-value">${Utils.escapeHtml(Utils.getInterventionTypeLabel ? Utils.getInterventionTypeLabel(type) : (CONFIG.INTERVENTION_TYPES[type] || type))}</div></div>
          ${location ? `<div class="detail-field"><div class="detail-field-label">Location</div><div class="detail-field-value">${location === 'workshop' ? 'Workshop' : 'Client Premises'}</div></div>` : ''}
          ${locationAddress ? `<div class="detail-field detail-field-full"><div class="detail-field-label">Location Address</div><div class="detail-field-value">${Utils.escapeHtml(locationAddress)}</div></div>` : ''}
          <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value">${Utils.getStatusBadge(status)}</div></div>
          ${priority ? `<div class="detail-field"><div class="detail-field-label">Priority</div><div class="detail-field-value">${Utils.getPriorityBadge(priority)}</div></div>` : ''}
          ${scheduledDate ? `<div class="detail-field"><div class="detail-field-label">Scheduled</div><div class="detail-field-value">${Utils.formatDateTime(scheduledDate)}</div></div>` : ''}
          <div class="detail-field"><div class="detail-field-label">Created</div><div class="detail-field-value">${Utils.formatDateTime(createdAt)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Created By</div><div class="detail-field-value">${Utils.escapeHtml(createdBy)}</div></div>
        </div>
        ${description ? `
        <div class="detail-field detail-field-full" style="margin-top:10px">
          <div class="detail-field-label">Issue Description</div>
          <div class="detail-field-value" style="white-space:pre-wrap;line-height:1.6">${Utils.escapeHtml(description)}</div>
        </div>` : ''}
      </div>

      ${snap ? `
      <div class="detail-section">
        <div class="detail-section-label">Status History</div>
        ${tabBarHTML}
        <div class="stab-panels">${tabPanelsHTML}</div>
      </div>` : `
      <div class="detail-section">
        <p class="text-sm text-muted" style="padding:8px 0">Full history not available for records archived before snapshot support was added.</p>
      </div>`}
    `;

    Modals.open(`Deleted Job — ${Utils.escapeHtml(jobNumber)}`, body, '', { size: 'lg' });
  },

  _switchStatusTab(btn) {
    const bar     = btn.closest('.stab-bar');
    const panels  = btn.closest('.detail-section')?.querySelector('.stab-panels');
    if (!bar || !panels) return;
    bar.querySelectorAll('.stab-btn').forEach(b => {
      b.classList.remove('stab-btn-active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('stab-btn-active');
    btn.setAttribute('aria-selected', 'true');
    panels.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('stab-panel-active'));
    const panelId = btn.getAttribute('aria-controls');
    document.getElementById(panelId)?.classList.add('stab-panel-active');
  },

  // ── QUEUE FOR DELETION ────────────────────────────────────────

  _openQueueModal(jobNumber, clientName, docId) {
    const body = `
      <div style="margin-bottom:16px;padding:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:0.857rem;color:#991B1B">
        <strong>Queue for Deletion:</strong> Job <strong>${Utils.escapeHtml(jobNumber)}</strong>
        (${Utils.escapeHtml(clientName)}) will be marked for permanent removal.
        You will have <strong>24 hours</strong> to undo this action. After that, the record will be
        <strong>permanently deleted</strong> and cannot be recovered.
      </div>
      <div class="form-group">
        <label class="form-label">Your Password <span style="color:var(--red)">*</span></label>
        <input type="password" id="purgePassword" class="form-input" placeholder="Your current password" required>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Deletion <span style="color:var(--red)">*</span></label>
        <textarea id="purgeReason" class="form-input" rows="2" placeholder="State the reason for permanent removal..."></textarea>
      </div>
      <div id="purgeError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-danger" onclick="Views.DeletedJobs._confirmQueue('${Utils.escapeHtml(jobNumber)}', '${Utils.escapeHtml(docId)}')">Queue for Deletion</button>
    `;

    Modals.open(`Queue Deletion — ${Utils.escapeHtml(jobNumber)}`, body, footer);
  },

  async _confirmQueue(jobNumber, docId) {
    const password = document.getElementById('purgePassword')?.value;
    const reason   = document.getElementById('purgeReason')?.value.trim();
    const errEl    = document.getElementById('purgeError');
    const showErr  = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!password || !reason) return showErr('Password and reason are required.');

    const sa = appState.currentUser;

    await Utils.withButtonLock(async () => {
      try {
        const credential = firebase.auth.EmailAuthProvider.credential(sa.email, password);
        await fbAuth.currentUser.reauthenticateWithCredential(credential);
      } catch (authErr) {
        showErr('Incorrect password.'); throw authErr;
      }

      await Storage.queueDeletedJobPurge(docId, this._buildSnapshot(docId));
      await Storage.logAction({
        actor: sa.name,
        actorId: sa.id,
        action: 'QUEUE_PURGE_JOB',
        target: `Job #${jobNumber}`,
        details: `Reason: ${reason}. Queued for deletion — will be permanently removed after 24 hours.`
      });
      Modals.close();
      Toast.info(`Job #${jobNumber} queued for deletion. You have 24 hours to undo.`);
      await this.mount();
    });
  },

  _buildSnapshot(docId) {
    const rec = this._records.find(r => r.id === docId);
    if (!rec) return null;
    if (rec._snapshot) return rec._snapshot;
    // Fallback for old records: reconstruct minimal snapshot from summary fields
    const machine = appState.machines.find(m => m.jobNumber === rec.jobNumber);
    const client  = appState.clients.find(c => c.name === rec.clientName);
    return {
      id:          rec.id,
      type:        rec.type      || 'corrective',
      status:      rec.status    || 'new',
      createdAt:   rec.createdAt || rec.deletedAt,
      updatedAt:   rec.deletedAt || new Date().toISOString(),
      machineId:   machine?.id   || null,
      clientId:    client?.id    || null,
      createdBy:   rec.deletedBy || appState.currentUser?.name || '',
      notes:       [],
      parts:       [],
      scheduledHistory: [],
      statusHistory:    [],
      auditTrail:       []
    };
  },

  // ── UNDO — restores record in Delete Log, removes queued flags ─

  async _confirmUndo(docId, jobNumber) {
    const sa = appState.currentUser;
    try {
      await Storage.undoQueuedPurge(docId);
      await Storage.logAction({
        actor: sa.name,
        actorId: sa.id,
        action: 'UNDO_PURGE_JOB',
        target: `Job #${jobNumber}`,
        details: 'Deletion queue cancelled — record restored in Delete Log.'
      });
      Toast.success(`Job #${jobNumber} restored in Delete Log.`);
      await this.mount();
    } catch (e) {
      Toast.error(e.message || 'Failed to undo. Please try again.');
    }
  }
};
