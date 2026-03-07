/* ============================================================
   views/action-log.js — Head Administrator Action Log
   ============================================================ */

window.Views = window.Views || {};

Views.ActionLog = {

  mount() {
    if (!Auth.isSuperAdmin()) {
      document.getElementById('mainContent').innerHTML = `
        <div style="padding:60px;text-align:center;color:var(--gray-400)">
          <p style="font-size:1.1rem">Access Restricted</p>
          <p style="font-size:0.857rem;margin-top:8px">Only the Head Administrator can view the action log.</p>
        </div>`;
      return;
    }
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
  },

  _template() {
    const records = Storage.getActionLog();

    const ACTION_LABELS = {
      CREATE_USER: { label: 'User Created',  color: '#10B981' },
      EDIT_USER:   { label: 'User Edited',   color: '#3B82F6' },
      DELETE_USER: { label: 'User Deleted',  color: '#EF4444' },
      PURGE_JOB:   { label: 'Job Purged',    color: '#7C3AED' }
    };

    const rows = records.map(r => {
      const meta = ACTION_LABELS[r.action] || { label: r.action, color: 'var(--gray-600)' };
      return `
        <tr>
          <td style="white-space:nowrap;font-size:0.857rem">${Utils.formatDateTime(r.timestamp)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--purple);color:white;display:flex;align-items:center;justify-content:center;font-size:0.714rem;font-weight:600;flex-shrink:0">
                ${Utils.getInitials(r.actor || '?')}
              </div>
              <span>${Utils.escapeHtml(r.actor || '—')}</span>
            </div>
          </td>
          <td>
            <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;background:${meta.color}22;color:${meta.color}">
              ${meta.label}
            </span>
          </td>
          <td style="font-weight:500">${Utils.escapeHtml(r.target || '—')}</td>
          <td style="font-size:0.857rem;color:var(--gray-600);max-width:300px;white-space:normal">${Utils.escapeHtml(r.details || '—')}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Action Log</h1>
          <p class="page-subtitle">Head Administrator activity audit trail</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;padding:12px 20px;background:#F5F3FF;border:1px solid #DDD6FE">
        <div style="display:flex;align-items:center;gap:10px;font-size:0.857rem;color:#6D28D9">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>This log is <strong>read-only</strong>. All Head Administrator actions are automatically recorded here.</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Activity Records</span>
          <span class="text-sm text-muted">${records.length} record${records.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Performed By</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `
                  <tr><td colspan="5">
                    <div class="table-empty">
                      <p class="table-empty-text">No actions logged yet</p>
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
