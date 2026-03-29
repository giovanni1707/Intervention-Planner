/* ============================================================
   views/my-jobs.js — My Jobs (Technician-facing view)
   ============================================================ */

window.Views = window.Views || {};

Views.MyJobs = {
  _effectCleanup: null,
  _statusFilter:  'open',
  _sortKey:       'scheduledDate',
  _sortDir:       'asc',

  mount() {
    // Redirect non-technicians
    const user = appState.currentUser;
    if (!user || (user.role !== 'technician' && user.role !== 'admin' && user.role !== 'superadmin')) {
      Router.go('dashboard');
      return;
    }

    this._statusFilter = 'open';
    this._sortKey      = 'scheduledDate';
    this._sortDir      = 'asc';

    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();

    if (this._effectCleanup) this._effectCleanup();
    this._effectCleanup = ReactiveUtils.effect(() => {
      this._render();
    });
  },

  unmount() {
    if (this._effectCleanup) {
      this._effectCleanup();
      this._effectCleanup = null;
    }
  },

  _myJobs() {
    const user = appState.currentUser;
    if (!user) return [];
    // Admin/superadmin can browse all; technicians see only their own
    const list = (user.role === 'technician')
      ? appState.interventions.filter(i => Utils.getTechIds(i).includes(user.id))
      : appState.interventions;
    return list;
  },

  _applyFilter(list) {
    if (this._statusFilter === 'open') {
      return list.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    }
    if (this._statusFilter === 'today') {
      return list.filter(i => Utils.isToday(i.scheduledDate));
    }
    if (this._statusFilter === 'overdue') {
      return list.filter(i =>
        CONFIG.OPEN_STATUSES.includes(i.status) &&
        i.scheduledDate && Utils.isPast(i.scheduledDate) && !Utils.isToday(i.scheduledDate)
      );
    }
    if (this._statusFilter === 'completed') {
      return list.filter(i => i.status === 'completed' || i.status === 'cancelled');
    }
    return list;
  },

  _sort(list) {
    return Utils.sortBy(list, i => {
      if (this._sortKey === 'scheduledDate') return i.scheduledDate || '9999';
      if (this._sortKey === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[i.priority] ?? 4;
      }
      if (this._sortKey === 'client') return Utils.getClientName(i.clientId);
      return i[this._sortKey] || '';
    }, this._sortDir);
  },

  _template() {
    const user    = appState.currentUser;
    const isTech  = user && user.role === 'technician';
    const title   = isTech ? 'My Jobs' : 'All Jobs';
    const subtitle = isTech
      ? 'Your assigned interventions — sorted by scheduled date'
      : 'All interventions overview';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${subtitle}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" onclick="GlobalSearch.open()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </div>
      </div>

      <!-- KPI mini row -->
      <div id="myJobsKpi" class="mj-kpi-row"></div>

      <!-- Filter tabs -->
      <div class="mj-tabs">
        <button class="mj-tab active" data-filter="open" id="mjTabOpen">Open</button>
        <button class="mj-tab" data-filter="today" id="mjTabToday">Today</button>
        <button class="mj-tab" data-filter="overdue" id="mjTabOverdue">Overdue</button>
        <button class="mj-tab" data-filter="completed" id="mjTabCompleted">Completed</button>
        <button class="mj-tab" data-filter="all" id="mjTabAll">All</button>
        <div class="mj-tabs-sort">
          <label class="text-xs text-muted">Sort by</label>
          <select id="mjSortKey" class="toolbar-select" style="min-width:130px">
            <option value="scheduledDate">Scheduled Date</option>
            <option value="priority">Priority</option>
            <option value="client">Client</option>
            <option value="createdAt">Created Date</option>
          </select>
          <button class="btn btn-ghost btn-sm btn-icon" id="mjSortDir" title="Toggle order">
            <svg id="mjSortDirIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </button>
        </div>
      </div>

      <div id="myJobsList"></div>
    `;
  },

  _bindEvents() {
    document.querySelectorAll('.mj-tab[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mj-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._statusFilter = btn.dataset.filter;
        this._render();
      });
    });

    const sortKey = document.getElementById('mjSortKey');
    if (sortKey) sortKey.addEventListener('change', () => {
      this._sortKey = sortKey.value;
      this._render();
    });

    const sortDir = document.getElementById('mjSortDir');
    if (sortDir) sortDir.addEventListener('click', () => {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
      const icon = document.getElementById('mjSortDirIcon');
      if (icon) {
        icon.innerHTML = this._sortDir === 'asc'
          ? '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'
          : '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>';
      }
      this._render();
    });
  },

  _render() {
    const all      = this._myJobs();
    const filtered = this._applyFilter(all);
    const sorted   = this._sort(filtered);
    this._renderKpi(all);
    this._renderList(sorted);
    this._updateTabCounts(all);
  },

  _renderKpi(all) {
    const kpi = document.getElementById('myJobsKpi');
    if (!kpi) return;
    const today    = all.filter(i => Utils.isToday(i.scheduledDate));
    const open     = all.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const urgent   = all.filter(i => i.priority === 'urgent' && CONFIG.OPEN_STATUSES.includes(i.status));
    const overdue  = all.filter(i =>
      CONFIG.OPEN_STATUSES.includes(i.status) && i.scheduledDate &&
      Utils.isPast(i.scheduledDate) && !Utils.isToday(i.scheduledDate)
    );
    kpi.innerHTML = `
      <div class="mj-kpi-card mj-kpi-blue"><div class="mj-kpi-val">${today.length}</div><div class="mj-kpi-label">Today</div></div>
      <div class="mj-kpi-card mj-kpi-orange"><div class="mj-kpi-val">${open.length}</div><div class="mj-kpi-label">Open</div></div>
      <div class="mj-kpi-card mj-kpi-red"><div class="mj-kpi-val">${urgent.length}</div><div class="mj-kpi-label">Urgent</div></div>
      <div class="mj-kpi-card mj-kpi-yellow"><div class="mj-kpi-val">${overdue.length}</div><div class="mj-kpi-label">Overdue</div></div>
    `;
  },

  _updateTabCounts(all) {
    const counts = {
      open:      all.filter(i => CONFIG.OPEN_STATUSES.includes(i.status)).length,
      today:     all.filter(i => Utils.isToday(i.scheduledDate)).length,
      overdue:   all.filter(i => CONFIG.OPEN_STATUSES.includes(i.status) && i.scheduledDate && Utils.isPast(i.scheduledDate) && !Utils.isToday(i.scheduledDate)).length,
      completed: all.filter(i => i.status === 'completed' || i.status === 'cancelled').length,
      all:       all.length
    };
    Object.entries(counts).forEach(([k, v]) => {
      const el = document.getElementById(`mjTab${k.charAt(0).toUpperCase() + k.slice(1)}`);
      if (el) el.textContent = `${k.charAt(0).toUpperCase() + k.slice(1)} (${v})`;
    });
    // Restore active class after text update
    document.querySelectorAll('.mj-tab[data-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this._statusFilter);
    });
  },

  _renderList(items) {
    const container = document.getElementById('myJobsList');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="mj-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>No jobs in this category</p>
        </div>`;
      return;
    }

    const cards = items.map(i => {
      const machine  = appState.machines.find(m => m.id === i.machineId) || {};
      const client   = appState.clients.find(c => c.id === i.clientId)  || {};
      const isToday  = Utils.isToday(i.scheduledDate);
      const isOverdue = CONFIG.OPEN_STATUSES.includes(i.status) && i.scheduledDate && Utils.isPast(i.scheduledDate) && !isToday;
      const isUrgent = i.priority === 'urgent';

      let dateLabel = Utils.formatDate(i.scheduledDate);
      let dateClass = '';
      if (isToday)   { dateLabel = 'Today'; dateClass = 'mj-date-today'; }
      if (isOverdue) { dateClass = 'mj-date-overdue'; }

      return `
        <div class="mj-card${isUrgent ? ' mj-card-urgent' : ''}${isOverdue ? ' mj-card-overdue' : ''}${isToday ? ' mj-card-today' : ''}">
          <div class="mj-card-top">
            <div class="mj-card-left">
              <div class="mj-card-job">${Utils.escapeHtml(machine.jobNumber || '—')}</div>
              <div class="mj-card-client">${Utils.escapeHtml(client.name || '—')}</div>
              <div class="mj-card-machine">${Utils.escapeHtml(machine.model || '—')} ${machine.serialNumber ? '· ' + Utils.escapeHtml(machine.serialNumber) : ''}</div>
            </div>
            <div class="mj-card-right">
              <div class="mj-card-date ${dateClass}">${dateLabel}</div>
              ${Utils.getPriorityBadge(i.priority)}
            </div>
          </div>

          <div class="mj-card-meta">
            <span>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</span>
            ${machine.district ? `<span>· ${Utils.escapeHtml(machine.district)}</span>` : ''}
            ${machine.location ? `<span>· ${Utils.escapeHtml(machine.location)}</span>` : ''}
          </div>

          ${i.description ? `<div class="mj-card-desc">${Utils.escapeHtml(Utils.truncate(i.description, 120))}</div>` : ''}

          <div class="mj-card-footer">
            <div class="mj-card-status-wrap">
              ${Utils.getStatusBadge(i.status, i)}
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Views.Interventions.openDetailModal('${i.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </button>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="mj-list">${cards}</div>`;
  }
};
