/* ============================================================
   views/analytics.js — Data Visualisation View
   ============================================================ */

Views.Analytics = {
  _dateFrom: null,
  _dateTo:   null,

  mount() {
    // Default: last 12 months
    if (!this._dateFrom) {
      const now = new Date();
      this._dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10);
      this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    Charts.destroyAll();
    this._renderAll();
    this._bindEvents();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Data visualisation &amp; performance insights</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="window.print()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button class="btn btn-ghost" onclick="Views.Analytics._exportCSV()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Date range filter -->
      <div class="card" style="margin-bottom:24px;padding:16px 20px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span class="text-sm font-semibold" style="color:var(--gray-700)">Date Range:</span>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">From</label>
            <input type="date" id="anlDateFrom" class="form-input" style="width:auto" value="${this._dateFrom}">
          </div>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">To</label>
            <input type="date" id="anlDateTo" class="form-input" style="width:auto" value="${this._dateTo}">
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Views.Analytics._setThisMonth()">This Month</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.Analytics._setLast3Months()">Last 3 Months</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.Analytics._setLastYear()">Last 12 Months</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.Analytics._setAllTime()">All Time</button>
        </div>
      </div>

      <!-- KPI Strip -->
      <div id="anlKpis" class="anl-kpi-strip"></div>

      <!-- Row 1: 3 doughnut/pie charts -->
      <div class="grid-3" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Interventions by Status</span></div>
          <div class="card-body" style="height:260px"><canvas id="anlStatusChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Interventions by Type</span></div>
          <div class="card-body" style="height:260px"><canvas id="anlTypeChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Interventions by Priority</span></div>
          <div class="card-body" style="height:260px"><canvas id="anlPriorityChart"></canvas></div>
        </div>
      </div>

      <!-- Row 2: 12-month trend (full width) -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><span class="card-title">12-Month Trend — Created vs Completed &amp; Completion Rate</span></div>
        <div class="card-body" style="height:280px"><canvas id="anlTrendChart"></canvas></div>
      </div>

      <!-- Row 3: Technician performance + Top clients -->
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Technician Performance</span></div>
          <div class="card-body" style="height:280px"><canvas id="anlTechChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Top Clients by Interventions</span></div>
          <div class="card-body" style="height:280px"><canvas id="anlClientsChart"></canvas></div>
        </div>
      </div>

      <!-- Row 4: District distribution + Contract coverage -->
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Geographic Distribution by District</span></div>
          <div class="card-body" style="height:280px"><canvas id="anlDistrictChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Machine Contract Coverage</span></div>
          <div class="card-body" style="height:280px"><canvas id="anlContractChart"></canvas></div>
        </div>
      </div>

      <!-- Row 5: Machine status + PMC health -->
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Machine Status Breakdown</span></div>
          <div class="card-body" style="height:260px"><canvas id="anlMachineStatusChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">PMC Contract Health — Visit Completion</span></div>
          <div id="anlPmcHealth" class="card-body anl-pmc-health"></div>
        </div>
      </div>

      <!-- Row 6: Avg days per status (full width) -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><span class="card-title">Average Days Spent per Status</span><span style="font-size:0.786rem;color:var(--gray-400);margin-left:8px">Based on filtered interventions — open jobs counted from creation to today</span></div>
        <div class="card-body" style="height:240px"><canvas id="anlAvgTimeChart"></canvas></div>
      </div>
    `;
  },

  _getFiltered() {
    return appState.interventions.filter(i => {
      const d    = new Date(i.createdAt);
      const from = this._dateFrom ? new Date(this._dateFrom) : null;
      const to   = this._dateTo   ? new Date(this._dateTo + 'T23:59:59') : null;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  },

  _renderAll() {
    const iv = this._getFiltered();
    this._renderKPIs(iv);
    this._renderCharts(iv);
  },

  _renderKPIs(iv) {
    const total     = iv.length;
    const completed = iv.filter(i => i.status === 'completed').length;
    const open      = iv.filter(i => CONFIG.OPEN_STATUSES.includes(i.status)).length;
    const rate      = Utils.percent(completed, total);
    const urgent    = iv.filter(i => i.priority === 'urgent' && CONFIG.OPEN_STATUSES.includes(i.status)).length;

    // SLA breach: high or urgent interventions open for more than 3 days
    const slaBreaches = iv.filter(i => {
      if (!CONFIG.OPEN_STATUSES.includes(i.status)) return false;
      if (i.priority !== 'high' && i.priority !== 'urgent') return false;
      return Utils.daysAgo(i.createdAt) > 3;
    }).length;

    const rateColor = rate >= 70 ? 'kpi-green' : rate >= 40 ? 'kpi-orange' : 'kpi-red';

    document.getElementById('anlKpis').innerHTML = `
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Total Interventions</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-meta">in selected period</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Completed</div>
        <div class="kpi-value">${completed}</div>
        <div class="kpi-meta">jobs closed</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-label">Open / Active</div>
        <div class="kpi-value">${open}</div>
        <div class="kpi-meta">in progress</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      </div>
      <div class="kpi-card ${rateColor}">
        <div class="kpi-label">Completion Rate</div>
        <div class="kpi-value">${rate}%</div>
        <div class="kpi-meta">of period total</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-label">Urgent Open</div>
        <div class="kpi-value">${urgent}</div>
        <div class="kpi-meta">urgent priority active</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-label">SLA Breaches</div>
        <div class="kpi-value">${slaBreaches}</div>
        <div class="kpi-meta">high/urgent &gt; 3 days open</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      </div>
    `;
  },

  _renderCharts(iv) {
    // Reuse existing status doughnut on analytics canvas
    Charts.renderStatusDoughnut('anlStatusChart', iv);
    Charts.renderTypePie('anlTypeChart', iv);
    Charts.renderPriorityDoughnut('anlPriorityChart', iv);
    // Trend always uses full all-time dataset for 12-month context
    Charts.renderTwelveMonthTrend('anlTrendChart', appState.interventions);
    Charts.renderTechPerformanceBar('anlTechChart', iv, appState.users);
    Charts.renderTopClientsBar('anlClientsChart', iv, appState.clients);
    Charts.renderDistrictBar('anlDistrictChart', iv, appState.machines);
    // Machine & contract charts use all machines (not date-filtered — machine state is current)
    Charts.renderContractCoverageDoughnut('anlContractChart', appState.machines);
    Charts.renderMachineStatusPie('anlMachineStatusChart', appState.machines);
    Charts.renderAvgTimePerStatusBar('anlAvgTimeChart', iv);
    this._renderPmcHealth();
  },

  _renderPmcHealth() {
    const el = document.getElementById('anlPmcHealth');
    if (!el) return;

    const contracts = appState.maintenanceContracts || [];
    const clients   = appState.clients || [];
    const machines  = appState.machines || [];

    if (!contracts.length) {
      el.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:20px 0;font-size:0.857rem">No maintenance contracts found</p>';
      return;
    }

    const rows = contracts.map(c => {
      const client  = clients.find(cl => cl.id === c.clientId);
      const machine = machines.find(m => m.id === c.machineId);
      const schedule  = Array.isArray(c.schedule) ? c.schedule : [];
      const done      = Array.isArray(c.completedVisits) ? c.completedVisits : [];
      const pct = schedule.length > 0 ? Math.round(done.length / schedule.length * 100) : 0;
      const barColor = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)';
      const label = client ? Utils.escapeHtml(client.name) : '—';
      const sub   = machine ? Utils.escapeHtml(machine.model || machine.name || '') : '';
      return `
        <div class="anl-pmc-row" title="${label}${sub ? ' — ' + sub : ''} (${done.length}/${schedule.length} visits)">
          <div class="anl-pmc-label">${label}</div>
          <div class="anl-pmc-bar-wrap">
            <div class="anl-pmc-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
          <div class="anl-pmc-pct">${pct}%</div>
        </div>
      `;
    }).join('');

    el.innerHTML = rows;
  },

  // ── Date preset helpers ────────────────────────────────────

  _applyDateRange(from, to) {
    this._dateFrom = from;
    this._dateTo   = to;
    const fromEl = document.getElementById('anlDateFrom');
    const toEl   = document.getElementById('anlDateTo');
    if (fromEl) fromEl.value = from;
    if (toEl)   toEl.value   = to;
    Charts.destroyAll();
    this._renderAll();
  },

  _setThisMonth() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    this._applyDateRange(from, to);
  },

  _setLast3Months() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    this._applyDateRange(from, to);
  },

  _setLastYear() {
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    this._applyDateRange(from, to);
  },

  _setAllTime() {
    this._applyDateRange('', '');
  },

  // ── Export CSV ────────────────────────────────────────────

  _exportCSV() {
    const iv = this._getFiltered();
    const rows = [
      ['ID', 'Client', 'Machine', 'Type', 'Priority', 'Status', 'Technician(s)', 'Created', 'Scheduled'],
      ...iv.map(i => [
        i.id,
        Utils.getClientName(i.clientId),
        Utils.getMachineModel(i.machineId),
        Utils.getInterventionTypeLabel(i.type),
        i.priority,
        i.status,
        Utils.getTechnicianNames(i),
        i.createdAt ? i.createdAt.slice(0, 10) : '',
        i.scheduledDate ? i.scheduledDate.slice(0, 10) : ''
      ])
    ];
    const csv  = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bps-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ── Event binding ─────────────────────────────────────────

  _bindEvents() {
    const fromEl = document.getElementById('anlDateFrom');
    const toEl   = document.getElementById('anlDateTo');

    const apply = () => {
      this._dateFrom = fromEl ? fromEl.value : this._dateFrom;
      this._dateTo   = toEl   ? toEl.value   : this._dateTo;
      Charts.destroyAll();
      this._renderAll();
    };

    if (fromEl) fromEl.addEventListener('change', apply);
    if (toEl)   toEl.addEventListener('change', apply);
  }
};
