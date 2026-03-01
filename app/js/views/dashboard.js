/* ============================================================
   views/dashboard.js — Dashboard View
   ============================================================ */

const Views = window.Views || {};

Views.Dashboard = {
  _effectCleanup: null,

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    Charts.destroyAll();
    this._render(appState.interventions);

    // Reactive: re-render when interventions change
    if (this._effectCleanup) this._effectCleanup();
    this._effectCleanup = ReactiveUtils.effect(() => {
      const interventions = appState.interventions;
      this._render(interventions);
    });
  },

  unmount() {
    if (this._effectCleanup) {
      this._effectCleanup();
      this._effectCleanup = null;
    }
    Charts.destroyAll();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Service overview — BAVARIAN PACKAGING SOLUTION LTD</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Views.Interventions._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Intervention
          </button>
        </div>
      </div>

      <div id="urgentAlertBanner"></div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-label">Today's Interventions</div>
          <div class="kpi-value" id="kpiToday">—</div>
          <div class="kpi-meta">Scheduled for today</div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-label">Open Tickets</div>
          <div class="kpi-value" id="kpiOpen">—</div>
          <div class="kpi-meta">Awaiting resolution</div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-label">Urgent Cases</div>
          <div class="kpi-value" id="kpiUrgent">—</div>
          <div class="kpi-meta">Requiring immediate action</div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-label">Completion Rate</div>
          <div class="kpi-value" id="kpiRate">—</div>
          <div class="kpi-meta">This month</div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Interventions by Status</span>
          </div>
          <div class="card-body" style="height:260px">
            <div class="chart-container" style="height:100%">
              <canvas id="statusChart"></canvas>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Last 7 Days Activity</span>
          </div>
          <div class="card-body" style="height:260px">
            <div class="chart-container" style="height:100%">
              <canvas id="weeklyChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- RECENT INTERVENTIONS -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Interventions</span>
          <button class="btn btn-ghost btn-sm" onclick="Router.go('interventions')">View All →</button>
        </div>
        <div id="recentInterventionsTable"></div>
      </div>
    `;
  },

  _render(interventions) {
    this._renderKPIs(interventions);
    this._renderAlertBanner(interventions);
    this._renderRecentTable(interventions);
    Charts.renderStatusDoughnut('statusChart', interventions);
    Charts.renderWeeklyBar('weeklyChart', interventions);
  },

  _renderKPIs(interventions) {
    const today     = interventions.filter(i => Utils.isToday(i.scheduledDate));
    const open      = interventions.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const urgent    = interventions.filter(i => i.priority === 'urgent' && i.status !== 'completed' && i.status !== 'cancelled');

    // Completion rate for current month
    const now = new Date();
    const thisMonth = interventions.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const completedThisMonth = thisMonth.filter(i => i.status === 'completed').length;
    const rate = Utils.percent(completedThisMonth, thisMonth.length);

    const kpiToday  = document.getElementById('kpiToday');
    const kpiOpen   = document.getElementById('kpiOpen');
    const kpiUrgent = document.getElementById('kpiUrgent');
    const kpiRate   = document.getElementById('kpiRate');

    if (kpiToday)  kpiToday.textContent  = today.length;
    if (kpiOpen)   kpiOpen.textContent   = open.length;
    if (kpiUrgent) kpiUrgent.textContent = urgent.length;
    if (kpiRate)   kpiRate.textContent   = rate + '%';
  },

  _renderAlertBanner(interventions) {
    const banner = document.getElementById('urgentAlertBanner');
    if (!banner) return;

    const unplanned = interventions.filter(i =>
      i.status === 'new' && !i.scheduledDate
    );
    const urgentOpen = interventions.filter(i =>
      i.priority === 'urgent' && CONFIG.OPEN_STATUSES.includes(i.status)
    );

    let html = '';
    if (urgentOpen.length > 0) {
      html += `
        <div class="alert alert-danger" style="margin-bottom:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>${urgentOpen.length} urgent intervention${urgentOpen.length > 1 ? 's' : ''}</strong> require immediate attention.</span>
          <button class="btn btn-sm btn-danger" style="margin-left:auto" onclick="Router.go('interventions')">View →</button>
        </div>
      `;
    }
    if (unplanned.length > 0) {
      html += `
        <div class="alert alert-warning" style="margin-bottom:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>${unplanned.length} unplanned request${unplanned.length > 1 ? 's' : ''}</strong> awaiting scheduling.</span>
          <button class="btn btn-sm btn-warning" style="margin-left:auto" onclick="Router.go('planning')">Plan Now →</button>
        </div>
      `;
    }
    banner.innerHTML = html;
  },

  _renderRecentTable(interventions) {
    const container = document.getElementById('recentInterventionsTable');
    if (!container) return;

    const recent = Utils.sortBy(interventions, 'createdAt', 'desc').slice(0, 8);

    if (recent.length === 0) {
      container.innerHTML = `<div class="table-empty"><p class="table-empty-text">No interventions yet</p></div>`;
      return;
    }

    const rows = recent.map(i => `
      <tr>
        <td class="td-primary" style="font-family:monospace;font-size:0.786rem">#${i.id.slice(-6)}</td>
        <td>${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
        <td>${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</td>
        <td>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
        <td>${Utils.getPriorityBadge(i.priority)}</td>
        <td>${Utils.getStatusBadge(i.status)}</td>
        <td>${Utils.escapeHtml(Utils.getTechnicianName(i.technicianId))}</td>
        <td style="white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-icon" title="View" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Client</th><th>Machine</th><th>Type</th>
            <th>Priority</th><th>Status</th><th>Technician</th>
            <th>Scheduled</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
};
