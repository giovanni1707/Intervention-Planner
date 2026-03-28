/* ============================================================
   views/action-log.js — Head Administrator Action Log
   ============================================================ */

window.Views = window.Views || {};

Views.ActionLog = {

  _records: [],

  ACTION_LABELS: {
    CREATE_USER:           { label: 'User Created',           color: '#10B981' },
    EDIT_USER:             { label: 'User Edited',            color: '#3B82F6' },
    DELETE_USER:           { label: 'User Deleted',           color: '#EF4444' },
    PURGE_JOB:             { label: 'Job Purged',             color: '#7C3AED' },
    CHANGE_PASSWORD:       { label: 'Password Changed',       color: '#F59E0B' },
    VIEW_FORECAST_DETAILS: { label: 'Forecast Details Viewed', color: '#0EA5E9' },
    ADD_CONTRACT_PART:     { label: 'Part Added to Contract', color: '#059669' },
    EDIT_CONTRACT_PART:    { label: 'Contract Part Edited',   color: '#2563EB' },
    DELETE_CONTRACT_PART:  { label: 'Contract Part Removed',  color: '#DC2626' }
  },

  async mount() {
    const content = document.getElementById('mainContent');
    this._records = await Storage.getActionLog();
    content.innerHTML = this._shell();
    this._bindFilters();
    this._renderTable();
  },

  _shell() {
    // Build unique actor and action option lists from all records
    const actors  = [...new Set(this._records.map(r => r.actor).filter(Boolean))].sort();
    const actions = [...new Set(this._records.map(r => r.action).filter(Boolean))].sort();

    const actorOptions  = actors.map(a =>
      `<option value="${Utils.escapeHtml(a)}">${Utils.escapeHtml(a)}</option>`).join('');
    const actionOptions = actions.map(a => {
      const label = this.ACTION_LABELS[a]?.label || a;
      return `<option value="${Utils.escapeHtml(a)}">${Utils.escapeHtml(label)}</option>`;
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
        <div class="card-header" style="flex-wrap:wrap;gap:8px">
          <span class="card-title">Activity Records</span>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto">
            <input type="date" id="alDateFrom" class="toolbar-select" title="From date" style="min-width:130px">
            <input type="date" id="alDateTo"   class="toolbar-select" title="To date"   style="min-width:130px">
            <select id="alActor" class="toolbar-select">
              <option value="">All Users</option>
              ${actorOptions}
            </select>
            <select id="alAction" class="toolbar-select">
              <option value="">All Actions</option>
              ${actionOptions}
            </select>
            <button id="alClearBtn" class="btn btn-ghost btn-sm" style="display:none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear
            </button>
            <span id="alCount"></span>
          </div>
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
              <tbody id="alTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _bindFilters() {
    const render = () => this._renderTable();
    document.getElementById('alDateFrom')?.addEventListener('change', render);
    document.getElementById('alDateTo')?.addEventListener('change', render);
    document.getElementById('alActor')?.addEventListener('change', render);
    document.getElementById('alAction')?.addEventListener('change', render);
    document.getElementById('alClearBtn')?.addEventListener('click', () => {
      document.getElementById('alDateFrom').value  = '';
      document.getElementById('alDateTo').value    = '';
      document.getElementById('alActor').value     = '';
      document.getElementById('alAction').value    = '';
      render();
    });
  },

  _filtered() {
    const dateFrom = document.getElementById('alDateFrom')?.value || '';
    const dateTo   = document.getElementById('alDateTo')?.value   || '';
    const actor    = document.getElementById('alActor')?.value    || '';
    const action   = document.getElementById('alAction')?.value   || '';

    return this._records.filter(r => {
      if (actor  && r.actor  !== actor)  return false;
      if (action && r.action !== action) return false;
      if (dateFrom) {
        const d = (r.timestamp || '').slice(0, 10);
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = (r.timestamp || '').slice(0, 10);
        if (d > dateTo) return false;
      }
      return true;
    });
  },

  _renderTable() {
    const tbody    = document.getElementById('alTableBody');
    const countEl  = document.getElementById('alCount');
    const clearBtn = document.getElementById('alClearBtn');
    if (!tbody) return;

    const filtered = this._filtered();

    // Show / hide clear button
    const dateFrom = document.getElementById('alDateFrom')?.value;
    const dateTo   = document.getElementById('alDateTo')?.value;
    const actor    = document.getElementById('alActor')?.value;
    const action   = document.getElementById('alAction')?.value;
    const hasFilter = dateFrom || dateTo || actor || action;
    if (clearBtn) clearBtn.style.display = hasFilter ? '' : 'none';

    if (countEl) countEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-50,#EFF6FF);color:var(--primary-700,#1D4ED8);border:1px solid var(--primary-200,#BFDBFE);border-radius:999px;padding:2px 10px;font-size:0.78rem;font-weight:600">${filtered.length} <span style="font-weight:400;opacity:.75">record${filtered.length !== 1 ? 's' : ''}</span></span>`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><p class="table-empty-text">${hasFilter ? 'No records match your filters' : 'No actions logged yet'}</p></div></td></tr>`;
      return;
    }

    const users = appState.users;
    tbody.innerHTML = filtered.map(r => {
      const meta = this.ACTION_LABELS[r.action] || { label: r.action, color: 'var(--gray-600)' };

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
  }
};
