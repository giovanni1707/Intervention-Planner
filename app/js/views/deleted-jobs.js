/* ============================================================
   views/deleted-jobs.js — Deleted Jobs Audit Log
   ============================================================ */

Views.DeletedJobs = {

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
  },

  _template() {
    const records = Storage.getDeletedJobs();

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
        <td style="max-width:260px;white-space:normal;font-size:0.857rem;color:var(--gray-600)">${Utils.escapeHtml(r.reason || '—')}</td>
      </tr>
    `).join('');

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
            <span>This log is <strong>read-only</strong>. Deleted jobs cannot be restored from this view.</span>
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
                </tr>
              </thead>
              <tbody>
                ${rows || `
                  <tr><td colspan="9">
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
  }
};
