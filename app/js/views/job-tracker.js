/* ============================================================
   views/job-tracker.js — Job Tracker View
   ============================================================ */

Views.JobTracker = {
  _dateFrom: null,
  _dateTo: null,
  _statusFilter: 'all',
  _sortCol: 'date',
  _sortDir: 'desc',
  _chartInstance: null,

  mount() {
    // Default range: current month
    if (!this._dateFrom) {
      const now = new Date();
      this._dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }

    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._render();
    this._bindEvents();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Job Tracker</h1>
          <p class="page-subtitle">Monitor job creation activity and completion performance</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom:24px;padding:16px 20px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span class="text-sm font-semibold" style="color:var(--gray-700)">Date Range:</span>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">From</label>
            <input type="date" id="jtDateFrom" class="form-input" style="width:auto" value="${this._dateFrom}">
          </div>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
            <label class="form-label" style="margin:0;white-space:nowrap">To</label>
            <input type="date" id="jtDateTo" class="form-input" style="width:auto" value="${this._dateTo}">
          </div>
          <div style="width:1px;height:20px;background:var(--gray-200)"></div>
          <select id="jtStatus" class="toolbar-select">
            <option value="all" ${this._statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            ${Object.entries(CONFIG.STATUSES).map(([k, v]) =>
              `<option value="${k}" ${this._statusFilter === k ? 'selected' : ''}>${v.label}</option>`
            ).join('')}
          </select>
          <div style="width:1px;height:20px;background:var(--gray-200)"></div>
          <button class="btn btn-ghost btn-sm" onclick="Views.JobTracker._setThisMonth()">This Month</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.JobTracker._setLast3Months()">Last 3 Months</button>
          <button class="btn btn-ghost btn-sm" onclick="Views.JobTracker._setAllTime()">All Time</button>
        </div>
      </div>

      <div id="jtContent"></div>
    `;
  },

  _getFiltered() {
    return appState.interventions.filter(i => {
      const created = new Date(i.createdAt);
      const from = this._dateFrom ? new Date(this._dateFrom) : null;
      const to   = this._dateTo   ? new Date(this._dateTo + 'T23:59:59') : null;
      if (from && created < from) return false;
      if (to   && created > to)   return false;
      if (this._statusFilter !== 'all' && i.status !== this._statusFilter) return false;
      return true;
    });
  },

  _render() {
    const container = document.getElementById('jtContent');
    if (!container) return;

    const jobs      = this._getFiltered();
    const total     = jobs.length;
    const completed = jobs.filter(i => i.status === 'completed').length;
    const open      = jobs.filter(i => CONFIG.OPEN_STATUSES.includes(i.status)).length;
    const cancelled = jobs.filter(i => i.status === 'cancelled').length;
    const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;
    const rateColor = rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : rate > 0 ? 'var(--orange)' : 'var(--gray-400)';

    // Period label
    let periodLabel = 'All Time';
    if (this._dateFrom && this._dateTo) {
      periodLabel = `${Utils.formatDate(this._dateFrom)} — ${Utils.formatDate(this._dateTo)}`;
    } else if (this._dateFrom) {
      periodLabel = `From ${Utils.formatDate(this._dateFrom)}`;
    } else if (this._dateTo) {
      periodLabel = `Up to ${Utils.formatDate(this._dateTo)}`;
    }

    // Group by day for breakdown table
    const byDay = {};
    jobs.forEach(i => {
      const day = i.createdAt.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(i);
    });
    const activeDays = Object.keys(byDay).length;
    const avgPerDay  = activeDays > 0 ? (total / activeDays).toFixed(1) : '—';

    // One row per job, sorted by current column
    const jobRows = this._sortJobs(jobs)
      .map(i => {
        const client  = appState.clients.find(c => c.id === i.clientId);
        const machine = appState.machines.find(m => m.id === i.machineId);
        const tech    = appState.users.find(u => u.id === i.technicianId);
        return `
          <tr>
            <td class="td-primary">${Utils.formatDate(i.createdAt)}</td>
            <td>${Utils.escapeHtml(client?.name || '—')}</td>
            <td>${Utils.escapeHtml(machine?.model || '—')}</td>
            <td>${CONFIG.INTERVENTION_TYPES[i.type] || i.type || '—'}</td>
            <td>${Utils.getPriorityBadge ? Utils.getPriorityBadge(i.priority) : (i.priority || '—')}</td>
            <td>${Utils.escapeHtml(tech?.name || '—')}</td>
            <td>${Utils.getStatusBadge(i.status)}</td>
            <td style="text-align:center;white-space:nowrap">
              ${appState.currentUser?.role === 'admin' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit"
                onclick="Views.Interventions._openEditModal('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete" style="color:var(--red)"
                onclick="Views.JobTracker._deleteJob('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>` : ''}
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details"
                onclick="Views.Interventions.openDetailModal('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');

    container.innerHTML = `
      <!-- KPI cards -->
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--blue)">${total}</div>
          <div class="stat-box-label">Total Jobs Created</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--green)">${completed}</div>
          <div class="stat-box-label">Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--orange)">${open}</div>
          <div class="stat-box-label">Open / In Progress</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--gray-400)">${cancelled}</div>
          <div class="stat-box-label">Cancelled</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:${rateColor}">${rate}%</div>
          <div class="stat-box-label">Completion Rate</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid-2" style="margin-bottom:24px">
        <!-- Doughnut chart -->
        <div class="card">
          <div class="card-header"><span class="card-title">Completed vs Remaining</span></div>
          <div class="card-body" style="height:240px;display:flex;align-items:center;justify-content:center">
            ${total > 0
              ? `<canvas id="jtDonut"></canvas>`
              : `<p class="table-empty-text">No data for selected period</p>`}
          </div>
        </div>

        <!-- Summary details -->
        <div class="card">
          <div class="card-header"><span class="card-title">Period Summary</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-100)">
                <span style="font-size:0.857rem;color:var(--gray-600)">Period</span>
                <span style="font-weight:600;font-size:0.857rem;color:var(--gray-700)">${periodLabel}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-100)">
                <span style="font-size:0.857rem;color:var(--gray-600)">Active Days</span>
                <span style="font-weight:600;color:var(--gray-700)">${activeDays}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-100)">
                <span style="font-size:0.857rem;color:var(--gray-600)">Avg Jobs / Day</span>
                <span style="font-weight:600;color:var(--gray-700)">${avgPerDay}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-100)">
                <span style="font-size:0.857rem;color:var(--gray-600)">Completion Rate</span>
                <span style="font-weight:700;font-size:1.1rem;color:${rateColor}">${rate}%</span>
              </div>
              <!-- Completion rate progress bar -->
              <div>
                <div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${rate}%;background:${rateColor};border-radius:4px;transition:width 0.4s ease"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px">
                  <span style="font-size:0.714rem;color:var(--gray-400)">0%</span>
                  <span style="font-size:0.714rem;color:var(--gray-400)">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Job entries table -->
      <div class="card">
        <div class="card-header"><span class="card-title">Job Entries</span></div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  ${[
                    ['date',  'Date Created'],
                    ['client','Client'],
                    ['machine','Machine'],
                    ['type',  'Type'],
                    ['priority','Priority'],
                    ['tech',  'Technician'],
                    ['status','Status']
                  ].map(([col, label]) => {
                    const active = this._sortCol === col;
                    const arrow  = active ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : '';
                    return `<th style="cursor:pointer;user-select:none;white-space:nowrap"
                      onclick="Views.JobTracker._sortBy('${col}')">${label}${arrow}</th>`;
                  }).join('')}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${jobRows || `
                  <tr><td colspan="8">
                    <div class="table-empty">
                      <p class="table-empty-text">No jobs created in the selected period</p>
                    </div>
                  </td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render doughnut chart after DOM is updated
    if (total > 0) {
      this._renderDonut(completed, open, cancelled);
    }
  },

  _renderDonut(completed, open, cancelled) {
    if (this._chartInstance) {
      this._chartInstance.destroy();
      this._chartInstance = null;
    }
    const canvas = document.getElementById('jtDonut');
    if (!canvas) return;

    this._chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Open / In Progress', 'Cancelled'],
        datasets: [{
          data: [completed, open, cancelled],
          backgroundColor: ['#10B981', '#F97316', '#94A3B8'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}`
            }
          }
        }
      }
    });
  },

  async _deleteJob(interventionId) {
    const confirmed = await Modals.confirm('Delete this job? This cannot be undone.', 'Delete Job');
    if (!confirmed) return;
    Storage.deleteIntervention(interventionId);
    refreshInterventions();
    Toast.success('Job deleted');
    this._render();
  },

  _sortBy(col) {
    if (this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = col === 'date' ? 'desc' : 'asc';
    }
    this._render();
  },

  _sortJobs(jobs) {
    const dir = this._sortDir === 'asc' ? 1 : -1;
    return jobs.slice().sort((a, b) => {
      let va, vb;
      switch (this._sortCol) {
        case 'date':
          return dir * (new Date(a.createdAt) - new Date(b.createdAt));
        case 'client':
          va = (appState.clients.find(c => c.id === a.clientId)?.name || '').toLowerCase();
          vb = (appState.clients.find(c => c.id === b.clientId)?.name || '').toLowerCase();
          break;
        case 'machine':
          va = (appState.machines.find(m => m.id === a.machineId)?.model || '').toLowerCase();
          vb = (appState.machines.find(m => m.id === b.machineId)?.model || '').toLowerCase();
          break;
        case 'type':
          va = (CONFIG.INTERVENTION_TYPES[a.type] || a.type || '').toLowerCase();
          vb = (CONFIG.INTERVENTION_TYPES[b.type] || b.type || '').toLowerCase();
          break;
        case 'priority': {
          const order = ['urgent','high','medium','low'];
          return dir * (order.indexOf(a.priority) - order.indexOf(b.priority));
        }
        case 'tech':
          va = (appState.users.find(u => u.id === a.technicianId)?.name || '').toLowerCase();
          vb = (appState.users.find(u => u.id === b.technicianId)?.name || '').toLowerCase();
          break;
        case 'status':
          va = a.status || '';
          vb = b.status || '';
          break;
        default:
          return 0;
      }
      return dir * va.localeCompare(vb);
    });
  },

  _bindEvents() {
    const from   = document.getElementById('jtDateFrom');
    const to     = document.getElementById('jtDateTo');
    const status = document.getElementById('jtStatus');
    if (from)   from.addEventListener('change',   () => this._applyDateRange());
    if (to)     to.addEventListener('change',     () => this._applyDateRange());
    if (status) status.addEventListener('change', () => {
      this._statusFilter = status.value;
      this._render();
    });
  },

  _applyDateRange() {
    this._dateFrom = document.getElementById('jtDateFrom')?.value || null;
    this._dateTo   = document.getElementById('jtDateTo')?.value || null;
    this._render();
  },

  _setThisMonth() {
    const now = new Date();
    this._dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const f = document.getElementById('jtDateFrom');
    const t = document.getElementById('jtDateTo');
    if (f) f.value = this._dateFrom;
    if (t) t.value = this._dateTo;
    this._render();
  },

  _setLast3Months() {
    const now = new Date();
    this._dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
    this._dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const f = document.getElementById('jtDateFrom');
    const t = document.getElementById('jtDateTo');
    if (f) f.value = this._dateFrom;
    if (t) t.value = this._dateTo;
    this._render();
  },

  _setAllTime() {
    this._dateFrom = null;
    this._dateTo   = null;
    const f = document.getElementById('jtDateFrom');
    const t = document.getElementById('jtDateTo');
    if (f) f.value = '';
    if (t) t.value = '';
    this._render();
  }
};
