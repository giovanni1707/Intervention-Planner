/* ============================================================
   views/action-log.js — Head Administrator Action Log
   ============================================================ */

window.Views = window.Views || {};

Views.ActionLog = {

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
  },

  _template() {
    const records = Storage.getActionLog();

    const ACTION_LABELS = {
      CREATE_USER:           { label: 'User Created',          color: '#10B981' },
      EDIT_USER:             { label: 'User Edited',            color: '#3B82F6' },
      DELETE_USER:           { label: 'User Deleted',           color: '#EF4444' },
      PURGE_JOB:             { label: 'Job Purged',             color: '#7C3AED' },
      CHANGE_PASSWORD:       { label: 'Password Changed',       color: '#F59E0B' },
      VIEW_FORECAST_DETAILS: { label: 'Forecast Details Viewed', color: '#0EA5E9' }
    };

    const users = Storage.getUsers();

    const rows = records.map(r => {
      const meta = ACTION_LABELS[r.action] || { label: r.action, color: 'var(--gray-600)' };

      // Resolve target user ID: use stored targetId, or fall back to email lookup
      let resolvedTargetId = r.targetId || null;
      if (!resolvedTargetId && r.target) {
        const emailMatch = r.target.match(/\(([^)]+)\)/);
        if (emailMatch) {
          const found = users.find(u => u.email.toLowerCase() === emailMatch[1].toLowerCase());
          if (found) resolvedTargetId = found.id;
        }
      }
      const targetShortId = resolvedTargetId ? resolvedTargetId.slice(-8).toUpperCase() : null;
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
          <td>
            <div style="font-weight:500">${Utils.escapeHtml(r.target || '—')}</div>
            ${targetShortId ? `<div style="font-family:monospace;font-size:0.75rem;color:var(--gray-400)">ID: ${targetShortId}</div>` : ''}
          </td>
          <td style="font-size:0.857rem;color:var(--gray-600);max-width:320px;white-space:normal">
            ${(r.details || '—').split(' | ').map(line => `<div>${Utils.escapeHtml(line)}</div>`).join('')}
          </td>
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
