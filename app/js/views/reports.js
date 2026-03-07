/* ============================================================
   views/reports.js — Reports View
   ============================================================ */

Views.Reports = {
  _dateFrom: null,
  _dateTo: null,

  mount() {
    // Default range: current month
    if (!this._dateFrom) {
      const now = new Date();
      this._dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }

    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderAll();
    this._bindEvents();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-subtitle">Service performance & analytics</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="window.print()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Report
          </button>
        </div>
      </div>

      <!-- Date range filter -->
      <div class="card" style="margin-bottom:24px;padding:16px 20px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span class="text-sm font-semibold" style="color:var(--gray-700)">Date Range:</span>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">From</label>
            <input type="date" id="repDateFrom" class="form-input" style="width:auto" value="${this._dateFrom}">
          </div>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">To</label>
            <input type="date" id="repDateTo" class="form-input" style="width:auto" value="${this._dateTo}">
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Views.Reports._setThisMonth()">This Month</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.Reports._setLast3Months()">Last 3 Months</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.Reports._setAllTime()">All Time</button>
        </div>
      </div>

      <div id="reportContent"></div>
    `;
  },

  _getFiltered() {
    return appState.interventions.filter(i => {
      const created = new Date(i.createdAt);
      const from = this._dateFrom ? new Date(this._dateFrom) : null;
      const to   = this._dateTo   ? new Date(this._dateTo + 'T23:59:59') : null;
      if (from && created < from) return false;
      if (to   && created > to)   return false;
      return true;
    });
  },

  _renderAll() {
    const interventions = this._getFiltered();
    const container = document.getElementById('reportContent');
    if (!container) return;

    container.innerHTML = `
      ${this._summarySection(interventions)}
      ${this._slaSection(interventions)}
      ${this._techPerformanceSection(interventions)}
      ${this._typeBreakdownSection(interventions)}
      ${this._machineHistorySection(interventions)}
    `;

    // Render trend chart
    Charts.renderMonthlyTrend('trendChart', appState.interventions);
  },

  _summarySection(interventions) {
    const total     = interventions.length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const cancelled = interventions.filter(i => i.status === 'cancelled').length;
    const open      = interventions.filter(i => CONFIG.OPEN_STATUSES.includes(i.status)).length;
    const rate      = Utils.percent(completed, total);

    return `
      <div class="report-section">
        <div class="report-section-title">Summary</div>
        <div class="stat-row" style="margin-bottom:20px">
          <div class="stat-box">
            <div class="stat-box-value">${total}</div>
            <div class="stat-box-label">Total</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--green)">${completed}</div>
            <div class="stat-box-label">Completed</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--orange)">${open}</div>
            <div class="stat-box-label">Open</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--gray-400)">${cancelled}</div>
            <div class="stat-box-label">Cancelled</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--blue)">${rate}%</div>
            <div class="stat-box-label">Completion Rate</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="card-title">By Status</span></div>
            <div class="card-body">
              <table class="data-table">
                <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
                <tbody>
                  ${Object.entries(CONFIG.STATUSES).map(([k, v]) => {
                    const count = interventions.filter(i => i.status === k).length;
                    return `<tr>
                      <td>${Utils.getStatusBadge(k)}</td>
                      <td class="td-primary">${count}</td>
                      <td>${Utils.percent(count, total)}%</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">6-Month Trend</span></div>
            <div class="card-body" style="height:220px">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _slaSection(interventions) {
    const urgent = interventions.filter(i => i.priority === 'urgent');
    const urgentCompleted = urgent.filter(i => i.status === 'completed');

    // SLA: urgent = resolved within 24h
    const withinSla = urgentCompleted.filter(i => {
      const created   = new Date(i.createdAt);
      const completed = new Date(i.updatedAt || i.createdAt);
      const diffHours = (completed - created) / (1000 * 60 * 60);
      return diffHours <= 24;
    });

    const slaRate = Utils.percent(withinSla.length, urgentCompleted.length || 1);

    const highPriority = interventions.filter(i => ['urgent', 'high'].includes(i.priority));
    const highCompleted = highPriority.filter(i => i.status === 'completed');
    const breachedHighPriority = highPriority.filter(i =>
      CONFIG.OPEN_STATUSES.includes(i.status) && Utils.daysAgo(i.createdAt) > 3
    );

    return `
      <div class="report-section">
        <div class="report-section-title">SLA Compliance</div>
        <div class="stat-row" style="margin-bottom:16px">
          <div class="stat-box">
            <div class="stat-box-value">${urgent.length}</div>
            <div class="stat-box-label">Urgent Total</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--green)">${urgentCompleted.length}</div>
            <div class="stat-box-label">Urgent Resolved</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:${slaRate >= 80 ? 'var(--green)' : slaRate >= 50 ? 'var(--yellow)' : 'var(--red)'}">${slaRate}%</div>
            <div class="stat-box-label">Within 24h SLA</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color:var(--red)">${breachedHighPriority.length}</div>
            <div class="stat-box-label">SLA Breaches (>3 days)</div>
          </div>
        </div>

        ${breachedHighPriority.length > 0 ? `
          <div class="alert alert-danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>${breachedHighPriority.length} high/urgent intervention${breachedHighPriority.length > 1 ? 's' : ''} open for more than 3 days without resolution.</span>
          </div>
        ` : ''}
      </div>
    `;
  },

  _techPerformanceSection(interventions) {
    const technicians = appState.users.filter(u => u.role === 'technician');

    const rows = technicians.map(tech => {
      const assigned  = interventions.filter(i => i.technicianId === tech.id);
      const completed = assigned.filter(i => i.status === 'completed');
      const active    = assigned.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));

      // Avg resolution time (days)
      const resolvedTimes = completed.map(i => {
        const start = new Date(i.createdAt);
        const end   = new Date(i.updatedAt || i.createdAt);
        return (end - start) / (1000 * 60 * 60 * 24);
      });
      const avgDays = resolvedTimes.length > 0
        ? (resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length).toFixed(1)
        : '—';

      const rate = Utils.percent(completed.length, assigned.length);

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="tech-avatar" style="width:32px;height:32px;font-size:0.786rem;border-radius:50%;background:var(--blue);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${Utils.getInitials(tech.name)}</div>
              <div>
                <div class="font-semibold">${Utils.escapeHtml(tech.name)}</div>
                <div class="text-xs text-muted">${Utils.escapeHtml(tech.email)}</div>
              </div>
            </div>
          </td>
          <td class="td-primary">${assigned.length}</td>
          <td style="color:var(--green)">${completed.length}</td>
          <td style="color:var(--orange)">${active.length}</td>
          <td>${avgDays === '—' ? '—' : avgDays + ' days'}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;height:6px;background:var(--gray-200);border-radius:3px;overflow:hidden">
                <div style="height:100%;background:${rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--orange)'};width:${rate}%;border-radius:3px"></div>
              </div>
              <span class="text-sm">${rate}%</span>
            </div>
          </td>
        </tr>
      `;
    });

    return `
      <div class="report-section">
        <div class="report-section-title">Technician Performance</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Active</th>
                <th>Avg Resolution</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('') || '<tr><td colspan="6"><div class="table-empty"><p class="table-empty-text">No technicians found</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _typeBreakdownSection(interventions) {
    const rows = Object.entries(CONFIG.INTERVENTION_TYPES).map(([type, label]) => {
      const items     = interventions.filter(i => i.type === type);
      const completed = items.filter(i => i.status === 'completed').length;
      const rate      = Utils.percent(completed, items.length);
      return `
        <tr>
          <td class="td-primary">${label}</td>
          <td>${items.length}</td>
          <td style="color:var(--green)">${completed}</td>
          <td>${rate}%</td>
          <td>
            ${Object.entries(CONFIG.PRIORITIES).map(([p]) => {
              const cnt = items.filter(i => i.priority === p).length;
              return cnt > 0 ? `${Utils.getPriorityBadge(p)} <span class="text-xs">${cnt}</span>` : '';
            }).filter(Boolean).join(' ')}
          </td>
        </tr>
      `;
    });

    return `
      <div class="report-section">
        <div class="report-section-title">Breakdown by Type</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Total</th><th>Completed</th><th>Rate</th><th>Priority Split</th>
              </tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  _machineHistorySection(interventions) {
    const grouped = Utils.groupBy(interventions, 'clientId');

    const sections = appState.clients
      .filter(c => grouped[c.id])
      .map(client => {
        const clientInterventions = grouped[client.id] || [];
        const machineGroups = Utils.groupBy(clientInterventions, 'machineId');

        const machineRows = Object.entries(machineGroups).map(([machineId, items]) => {
          const machine = appState.machines.find(m => m.id === machineId);
          const sorted  = Utils.sortBy(items, 'createdAt', 'desc');
          return `
            <tr>
              <td style="padding-left:24px">${Utils.escapeHtml(machine?.model || 'Unknown')}</td>
              <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(machine?.serialNumber || '—')}</td>
              <td>${items.length}</td>
              <td>${Utils.getContractBadge(machine?.contractType || 'none')}</td>
              <td>${Utils.formatDate(sorted[0]?.createdAt)}</td>
              <td>${Utils.getStatusBadge(sorted[0]?.status)}</td>
            </tr>
          `;
        }).join('');

        return `
          <tr style="background:var(--gray-50)">
            <td colspan="6" class="td-primary" style="padding-top:12px">${Utils.escapeHtml(client.name)}</td>
          </tr>
          ${machineRows}
        `;
      }).join('');

    return `
      <div class="report-section">
        <div class="report-section-title">Machine History by Client</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Machine</th><th>Serial</th><th>Interventions</th><th>Contract</th><th>Last Service</th><th>Last Status</th>
              </tr>
            </thead>
            <tbody>
              ${sections || '<tr><td colspan="6"><div class="table-empty"><p class="table-empty-text">No data for selected period</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    const from = document.getElementById('repDateFrom');
    const to   = document.getElementById('repDateTo');
    if (from) from.addEventListener('change', () => this._applyDateRange());
    if (to)   to.addEventListener('change',   () => this._applyDateRange());
  },

  _applyDateRange() {
    this._dateFrom = document.getElementById('repDateFrom')?.value || null;
    this._dateTo   = document.getElementById('repDateTo')?.value || null;
    this._renderAll();
  },

  _setThisMonth() {
    const now = new Date();
    this._dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const f = document.getElementById('repDateFrom');
    const t = document.getElementById('repDateTo');
    if (f) f.value = this._dateFrom;
    if (t) t.value = this._dateTo;
    this._renderAll();
  },

  _setLast3Months() {
    const now = new Date();
    this._dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
    this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const f = document.getElementById('repDateFrom');
    const t = document.getElementById('repDateTo');
    if (f) f.value = this._dateFrom;
    if (t) t.value = this._dateTo;
    this._renderAll();
  },

  _setAllTime() {
    this._dateFrom = null;
    this._dateTo   = null;
    const f = document.getElementById('repDateFrom');
    const t = document.getElementById('repDateTo');
    if (f) f.value = '';
    if (t) t.value = '';
    this._renderAll();
  }
};
