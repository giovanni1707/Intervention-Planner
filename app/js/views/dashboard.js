/* ============================================================
   views/dashboard.js — Dashboard View (Enhanced)
   ============================================================ */

const Views = window.Views || {};

Views.Dashboard = {
  _effectCleanup: null,

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    Charts.destroyAll();
    this._render(appState.interventions);

    if (this._effectCleanup) this._effectCleanup();
    this._effectCleanup = ReactiveUtils.effect(() => {
      this._render(appState.interventions);
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
    const user = appState.currentUser;
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    const isTech  = user && user.role === 'technician';
    const hour    = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user ? user.name.split(' ')[0] : '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">${Utils.escapeHtml(greeting)}, ${Utils.escapeHtml(firstName)} — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div class="page-actions">
          ${isAdmin ? `
          <button class="btn btn-ghost btn-sm" onclick="GlobalSearch.open()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search  <kbd class="kbd-hint">Ctrl K</kbd>
          </button>
          <button class="btn btn-primary" onclick="Views.Interventions._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Intervention
          </button>` : ''}
          ${isTech ? `
          <button class="btn btn-ghost btn-sm" onclick="GlobalSearch.open()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search  <kbd class="kbd-hint">Ctrl K</kbd>
          </button>
          <button class="btn btn-primary" onclick="Router.go('my-jobs')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            My Jobs
          </button>` : ''}
        </div>
      </div>

      <div id="urgentAlertBanner"></div>

      <!-- KPI CARDS -->
      <div class="kpi-grid" id="dashKpiGrid"></div>

      <!-- MAIN CONTENT GRID -->
      <div class="dash-main-grid">

        <!-- LEFT COLUMN -->
        <div class="dash-col-main">
          <!-- Today's Schedule -->
          <div class="card" style="margin-bottom:20px">
            <div class="card-header">
              <span class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
                Today's Schedule
              </span>
              <button class="btn btn-ghost btn-sm" onclick="Router.go('planning')">View Planning →</button>
            </div>
            <div id="dashTodayList"></div>
          </div>

          <!-- Charts row -->
          <div class="grid-2" style="margin-bottom:20px">
            <div class="card">
              <div class="card-header"><span class="card-title">Status Overview</span></div>
              <div class="card-body" style="height:240px">
                <div class="chart-container" style="height:100%"><canvas id="statusChart"></canvas></div>
              </div>
            </div>
            <div class="card">
              <div class="card-header"><span class="card-title">Last 7 Days</span></div>
              <div class="card-body" style="height:240px">
                <div class="chart-container" style="height:100%"><canvas id="weeklyChart"></canvas></div>
              </div>
            </div>
          </div>

          <!-- Recent interventions -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Recent Interventions</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.go('interventions')">View All →</button>
            </div>
            <div id="recentInterventionsTable"></div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="dash-col-side">

          <!-- Quick Actions (admin only) -->
          ${isAdmin ? `
          <div class="card" style="margin-bottom:20px">
            <div class="card-header"><span class="card-title">Quick Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
              <button class="dash-quick-btn" onclick="Views.Interventions._openCreateModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Intervention
              </button>
              <button class="dash-quick-btn" onclick="Router.go('planning')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Open Planning Board
              </button>
              <button class="dash-quick-btn" onclick="Router.go('technicians')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Technician Workload
              </button>
              <button class="dash-quick-btn" onclick="Router.go('maintenance-contracts')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
                Maintenance Contracts
              </button>
              <button class="dash-quick-btn" onclick="Router.go('reports')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Reports
              </button>
            </div>
          </div>` : ''}

          ${isTech ? `
          <div class="card" style="margin-bottom:20px">
            <div class="card-header"><span class="card-title">Quick Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
              <button class="dash-quick-btn" onclick="Router.go('my-jobs')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                My Jobs
              </button>
              <button class="dash-quick-btn" onclick="Router.go('planning')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Planning Board
              </button>
            </div>
          </div>` : ''}

          <!-- Activity Feed -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:6px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Recent Activity
              </span>
            </div>
            <div id="dashActivityFeed" class="dash-activity-feed"></div>
          </div>

        </div>
      </div>
    `;
  },

  // Navigate to interventions with pre-applied filters.
  // 'preset' is an optional special case handled by the interventions view.
  _goFiltered(filters, preset) {
    resetFilters();
    Object.assign(appState.filters, filters);
    // Store preset so interventions view can apply post-render filtering
    if (preset) appState.filters._preset = preset;
    Router.go('interventions');
  },

  _render(interventions) {
    const user    = appState.currentUser;
    const isTech  = user && user.role === 'technician';
    const list    = isTech
      ? interventions.filter(i => Utils.getTechIds(i).includes(user.id))
      : interventions;

    this._renderKPIs(list, isTech);
    this._renderAlertBanner(list);
    this._renderTodaySchedule(list);
    this._renderRecentTable(list);
    this._renderActivityFeed(list);
    Charts.renderStatusDoughnut('statusChart', list);
    Charts.renderWeeklyBar('weeklyChart', list);
  },

  _renderKPIs(interventions, isTech) {
    const grid = document.getElementById('dashKpiGrid');
    if (!grid) return;

    const today     = interventions.filter(i => Utils.isToday(i.scheduledDate));
    const open      = interventions.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const urgent    = interventions.filter(i => i.priority === 'urgent' && CONFIG.OPEN_STATUSES.includes(i.status));
    const overdue   = interventions.filter(i =>
      CONFIG.OPEN_STATUSES.includes(i.status) &&
      i.scheduledDate && Utils.isPast(i.scheduledDate) && !Utils.isToday(i.scheduledDate)
    );

    const now = new Date();
    const thisMonth = interventions.filter(i => {
      if (!i.createdAt) return false;
      const d = new Date(i.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const completedThisMonth = thisMonth.filter(i => i.status === 'completed').length;
    const rate = Utils.percent(completedThisMonth, thisMonth.length);

    if (isTech) {
      grid.innerHTML = `
        <div class="kpi-card kpi-blue">
          <div class="kpi-label">Today's Jobs</div>
          <div class="kpi-value">${today.length}</div>
          <div class="kpi-meta">Scheduled for today</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg></div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-label">Open Jobs</div>
          <div class="kpi-value">${open.length}</div>
          <div class="kpi-meta">In progress</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-label">Urgent</div>
          <div class="kpi-value">${urgent.length}</div>
          <div class="kpi-meta">Needs immediate action</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-label">Completion Rate</div>
          <div class="kpi-value">${rate}%</div>
          <div class="kpi-meta">This month</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>
      `;
    } else {
      // Admin / superadmin view: 5 cards
      const totalClients  = appState.clients.length;
      grid.innerHTML = `
        <div class="kpi-card kpi-blue">
          <div class="kpi-label">Today's Interventions</div>
          <div class="kpi-value">${today.length}</div>
          <div class="kpi-meta">Scheduled for today</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg></div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-label">Open Tickets</div>
          <div class="kpi-value">${open.length}</div>
          <div class="kpi-meta">Awaiting resolution</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-label">Urgent Cases</div>
          <div class="kpi-value">${urgent.length}</div>
          <div class="kpi-meta">Requiring immediate action</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-label">Overdue</div>
          <div class="kpi-value">${overdue.length}</div>
          <div class="kpi-meta">Past scheduled date</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-label">Completion Rate</div>
          <div class="kpi-value">${rate}%</div>
          <div class="kpi-meta">This month (${completedThisMonth}/${thisMonth.length})</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>
      `;
    }
  },

  _renderAlertBanner(interventions) {
    const banner = document.getElementById('urgentAlertBanner');
    if (!banner) return;

    const unplanned = interventions.filter(i => i.status === 'new' && !i.scheduledDate);
    const urgentOpen = interventions.filter(i => i.priority === 'urgent' && CONFIG.OPEN_STATUSES.includes(i.status));
    const overdue = interventions.filter(i =>
      CONFIG.OPEN_STATUSES.includes(i.status) &&
      i.scheduledDate && Utils.isPast(i.scheduledDate) && !Utils.isToday(i.scheduledDate)
    );

    let html = '';
    if (urgentOpen.length > 0) {
      html += `
        <div class="alert alert-danger" style="margin-bottom:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>${urgentOpen.length} urgent intervention${urgentOpen.length > 1 ? 's' : ''}</strong> require immediate attention.</span>
          <button class="btn btn-sm btn-danger" style="margin-left:auto" onclick="Views.Dashboard._goFiltered({priority:'urgent'})">View →</button>
        </div>`;
    }
    if (overdue.length > 0) {
      html += `
        <div class="alert alert-danger" style="margin-bottom:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span><strong>${overdue.length} intervention${overdue.length > 1 ? 's are' : ' is'} overdue</strong> — past scheduled date.</span>
          <button class="btn btn-sm btn-danger" style="margin-left:auto" onclick="Views.Dashboard._goFiltered({}, 'overdue')">View →</button>
        </div>`;
    }
    if (unplanned.length > 0) {
      html += `
        <div class="alert alert-warning" style="margin-bottom:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>${unplanned.length} unplanned request${unplanned.length > 1 ? 's' : ''}</strong> awaiting scheduling.</span>
          <button class="btn btn-sm btn-warning" style="margin-left:auto" onclick="Router.go('planning')">Plan Now →</button>
        </div>`;
    }
    banner.innerHTML = html;
  },

  _renderTodaySchedule(interventions) {
    const container = document.getElementById('dashTodayList');
    if (!container) return;

    const todayItems = interventions
      .filter(i => Utils.isToday(i.scheduledDate))
      .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

    if (todayItems.length === 0) {
      container.innerHTML = `
        <div class="dash-empty-day">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          <span>No interventions scheduled for today</span>
        </div>`;
      return;
    }

    const rows = todayItems.map(i => {
      const machine = appState.machines.find(m => m.id === i.machineId);
      const client  = appState.clients.find(c => c.id === i.clientId);
      const time    = i.scheduledDate ? new Date(i.scheduledDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
      const isUrgent = i.priority === 'urgent';
      return `
        <div class="dash-schedule-row${isUrgent ? ' dash-schedule-urgent' : ''}">
          <div class="dash-schedule-time">${time}</div>
          <div class="dash-schedule-info">
            <div class="dash-schedule-title">${Utils.escapeHtml(client?.name || '—')} — ${Utils.escapeHtml(machine?.model || '—')}</div>
            <div class="dash-schedule-meta">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))} · ${Utils.escapeHtml(Utils.getTechnicianNames(i))} ${machine?.location ? '· ' + Utils.escapeHtml(machine.location) : ''}</div>
          </div>
          <div class="dash-schedule-badges">
            ${Utils.getPriorityBadge(i.priority)}
            ${Utils.getStatusBadge(i.status, i)}
          </div>
          <button class="btn btn-ghost btn-sm btn-icon" title="View" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="dash-schedule-list">${rows}</div>`;
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
        <td class="td-primary" style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(appState.machines.find(m => m.id === i.machineId)?.jobNumber || '—')}</td>
        <td>${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
        <td>${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</td>
        <td>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
        <td>${Utils.getPriorityBadge(i.priority)}</td>
        <td>${Utils.getStatusBadge(i.status, i)}</td>
        <td>${Utils.escapeHtml(Utils.getTechnicianNames(i))}</td>
        <td style="white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-icon" title="View" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </td>
      </tr>`).join('');

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Job No.</th><th>Client</th><th>Machine</th><th>Type</th>
            <th>Priority</th><th>Status</th><th>Technician</th>
            <th>Scheduled</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  _renderActivityFeed(interventions) {
    const container = document.getElementById('dashActivityFeed');
    if (!container) return;

    // Last 12 interventions sorted by createdAt desc
    const recent = Utils.sortBy(interventions, 'createdAt', 'desc').slice(0, 12);

    if (recent.length === 0) {
      container.innerHTML = `<div class="dash-activity-empty">No activity yet</div>`;
      return;
    }

    const items = recent.map(i => {
      const client  = appState.clients.find(c => c.id === i.clientId);
      const machine = appState.machines.find(m => m.id === i.machineId);
      const isCompleted = i.status === 'completed';
      const isCancelled = i.status === 'cancelled';
      const dotClass = isCompleted ? 'dash-act-dot-green' : isCancelled ? 'dash-act-dot-gray' : i.priority === 'urgent' ? 'dash-act-dot-red' : 'dash-act-dot-blue';
      return `
        <div class="dash-act-item">
          <div class="dash-act-dot ${dotClass}"></div>
          <div class="dash-act-body">
            <div class="dash-act-title">${Utils.escapeHtml(client?.name || '—')} — ${Utils.escapeHtml(machine?.model || '—')}</div>
            <div class="dash-act-meta">${Utils.getStatusBadge(i.status, i)} <span style="margin-left:4px">${Utils.formatRelative(i.createdAt)}</span></div>
          </div>
          <button class="btn btn-ghost btn-sm btn-icon dash-act-view" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>`;
    }).join('');

    container.innerHTML = items;
  }
};
