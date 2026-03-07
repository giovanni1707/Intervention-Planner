/* ============================================================
   views/deleted-jobs.js — Deleted Jobs Audit Log
   ============================================================ */

Views.DeletedJobs = {

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
  },

  _template() {
    const records = Storage.getDeletedJobs();
    const isSuperAdmin = Auth.isSuperAdmin();

    const rows = records.map(r => `
      <tr>
        <td style="font-family:monospace;font-size:0.857rem">${Utils.escapeHtml(r.jobNumber || '—')}</td>
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
        <td style="max-width:220px;white-space:normal;font-size:0.857rem;color:var(--gray-600)">${Utils.escapeHtml(r.reason || '—')}</td>
        ${isSuperAdmin ? `
        <td>
          <button class="btn btn-ghost btn-sm btn-icon" title="Permanently Purge" style="color:var(--red)"
            data-jobnumber="${Utils.escapeHtml(r.jobNumber || '')}"
            data-clientname="${Utils.escapeHtml(r.clientName || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        </td>` : ''}
      </tr>
    `).join('');

    const colSpan = isSuperAdmin ? 10 : 9;

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
              ${isSuperAdmin
                ? 'This log is <strong>read-only</strong> for standard users. As <strong>Head Administrator</strong>, you may permanently purge individual records using the delete icon.'
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
                  <th>Client</th>
                  <th>Machine</th>
                  <th>Type</th>
                  <th>Last Status</th>
                  <th>Created</th>
                  <th>Deleted At</th>
                  <th>Deleted By</th>
                  <th>Reason</th>
                  ${isSuperAdmin ? '<th></th>' : ''}
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
    if (!Auth.isSuperAdmin()) return;
    document.querySelectorAll('[data-jobnumber]').forEach(btn => {
      btn.addEventListener('click', () => {
        const jobNumber  = btn.dataset.jobnumber;
        const clientName = btn.dataset.clientname;
        this._openPurgeModal(jobNumber, clientName);
      });
    });
  },

  _openPurgeModal(jobNumber, clientName) {
    const body = `
      <div style="margin-bottom:16px;padding:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:0.857rem;color:#991B1B">
        <strong>Permanent Purge:</strong> This will completely remove job <strong>${Utils.escapeHtml(jobNumber)}</strong>
        (${Utils.escapeHtml(clientName)}) from the deleted jobs archive. This action is <strong>irreversible</strong>.
      </div>
      <div class="form-group">
        <label class="form-label">Your Password <span style="color:var(--red)">*</span></label>
        <input type="password" id="purgePassword" class="form-input" placeholder="Your current password" required>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Purge <span style="color:var(--red)">*</span></label>
        <textarea id="purgeReason" class="form-input" rows="2" placeholder="State the reason for permanent removal..."></textarea>
      </div>
      <div id="purgeError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-danger" onclick="Views.DeletedJobs._confirmPurge('${Utils.escapeHtml(jobNumber)}')">Permanently Purge</button>
    `;

    Modals.open(`Purge Job — ${Utils.escapeHtml(jobNumber)}`, body, footer);
  },

  _confirmPurge(jobNumber) {
    const password = document.getElementById('purgePassword')?.value;
    const reason   = document.getElementById('purgeReason')?.value.trim();
    const errEl    = document.getElementById('purgeError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!password || !reason) return showErr('Password and reason are required.');

    const sa = appState.currentUser;
    if (password !== sa.password) return showErr('Your password is incorrect.');

    Storage.purgeDeletedJob(jobNumber);
    Storage.logAction({
      actor: sa.name,
      actorId: sa.id,
      action: 'PURGE_JOB',
      target: `Job #${jobNumber}`,
      details: `Reason: ${reason}`
    });

    Modals.close();
    Toast.success(`Job #${jobNumber} permanently purged from archive.`);
    this.mount();
  }
};
