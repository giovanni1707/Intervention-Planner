/* ============================================================
   views/planning.js — Planning Board (Queue + Calendar)
   ============================================================ */

Views.Planning = {
  _currentMonth: null,
  _tableFilters: { client: 'all', type: 'all', priority: 'all', status: 'all', tech: 'all', district: 'all', dateFrom: '', dateTo: '' },

  mount() {
    if (!this._currentMonth) this._currentMonth = new Date();
    this._tableFilters = { client: 'all', type: 'all', priority: 'all', status: 'all', tech: 'all', district: 'all', dateFrom: '', dateTo: '' };
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderQueue(appState.interventions);
    this._renderCalendar(appState.interventions, this._currentMonth);
    this._renderMonthTable(appState.interventions, this._currentMonth);
    this._bindMonthNav();
  },

  _busiestMonthBadge() {
    const CALENDAR_STATUSES = ['tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts', 'completed'];
    const counts = {};
    appState.interventions.forEach(i => {
      if (!i.scheduledDate) return;
      if (i.type === 'pmc') {
        if (!Utils.getTechIds(i).length || !['tentative', 'assigned'].includes(i.status)) return;
      } else {
        if (!CALENDAR_STATUSES.includes(i.status)) return;
      }
      const d = new Date(i.scheduledDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return '';

    const [topKey, topCount] = entries[0];
    const [year, month] = topKey.split('-');
    const label = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:var(--blue-light);border:1px solid var(--blue);border-radius:var(--radius-sm);font-size:0.857rem;color:var(--blue);margin-bottom:16px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="flex-shrink:0"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span>Busiest month: <strong>${label}</strong> — ${topCount} intervention${topCount !== 1 ? 's' : ''}</span>
      </div>`;
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Planning Board</h1>
          <p class="page-subtitle">Schedule unplanned requests and track the calendar</p>
        </div>
      </div>
      ${this._busiestMonthBadge()}

      <div class="planning-layout">
        <!-- LEFT: Unplanned queue -->
        <div class="planning-queue">
          <div class="planning-queue-header">
            <div class="planning-queue-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Unplanned Requests
              <span id="queueCount" class="badge badge-new">0</span>
            </div>
            <p class="text-xs text-muted" style="margin-top:4px">New interventions without a scheduled date</p>
          </div>
          <div class="planning-queue-list" id="planningQueue"></div>
        </div>

        <!-- RIGHT: Calendar -->
        <div class="planning-calendar card" style="padding:20px">
          <div class="calendar-nav">
            <button class="btn btn-ghost btn-sm btn-icon" id="prevMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="calendar-month-label" id="calendarMonthLabel"></span>
            <button class="btn btn-ghost btn-sm btn-icon" id="nextMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" id="goToToday" style="display:none;margin-left:6px;font-size:0.786rem">Today</button>
          </div>
          <div style="margin-bottom:12px">
            <select id="calDistrictFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer;width:100%">
              <option value="">All Districts</option>
              ${CONFIG.DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="calendar-grid-header">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="calendar-day-label">${d}</div>`).join('')}
          </div>
          <div class="calendar-grid" id="calendarGrid"></div>
        </div>
      </div>

      <!-- Monthly schedule table -->
      <div class="card" style="margin-top:20px">
        <div class="card-header">
          <span class="card-title" id="monthTableTitle">Monthly Schedule</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span id="monthTableCount" class="badge badge-new" style="font-size:0.78rem"></span>
            <div style="display:flex;align-items:center;gap:2px;margin-left:8px">
              <button class="btn btn-ghost btn-sm btn-icon" id="prevMonthTable" title="Previous month">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span id="monthTableLabel" style="font-size:0.857rem;font-weight:500;color:var(--text);min-width:120px;text-align:center"></span>
              <button class="btn btn-ghost btn-sm btn-icon" id="nextMonthTable" title="Next month">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;flex-wrap:wrap;gap:8px" id="monthTableFilters">
          <select id="mtClientFilter" class="toolbar-select"><option value="all">All Clients</option></select>
          <select id="mtTypeFilter" class="toolbar-select">
            <option value="all">All Types</option>
            ${Object.entries(CONFIG.INTERVENTION_TYPES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
          <select id="mtPriorityFilter" class="toolbar-select">
            <option value="all">All Priorities</option>
            ${Object.entries(CONFIG.PRIORITIES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
          <select id="mtStatusFilter" class="toolbar-select">
            <option value="all">All Statuses</option>
            ${Object.entries(CONFIG.STATUSES).filter(([k]) => k !== 'new').map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
          <select id="mtTechFilter" class="toolbar-select">
            <option value="all">All Technicians</option>
            ${appState.users.filter(u => u.role === 'technician').map(u => `<option value="${u.id}">${Utils.escapeHtml(u.name)}</option>`).join('')}
          </select>
          <select id="mtDistrictFilter" class="toolbar-select">
            <option value="all">All Districts</option>
            ${CONFIG.DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <div style="display:flex;align-items:center;gap:4px;margin-left:4px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="color:var(--gray-400);flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <input type="date" id="mtDateFrom" class="toolbar-select" style="min-width:130px;padding:5px 8px" title="Date from">
            <span style="color:var(--gray-400);font-size:0.8rem">–</span>
            <input type="date" id="mtDateTo" class="toolbar-select" style="min-width:130px;padding:5px 8px" title="Date to">
          </div>
          <button id="mtFilterClear" class="btn btn-ghost btn-sm" style="display:none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table" id="monthTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Machine / Serial</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>District</th>
                  <th>Location</th>
                  <th style="width:60px"></th>
                </tr>
              </thead>
              <tbody id="monthTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _renderQueue(interventions) {
    const queue = interventions.filter(i =>
      i.status === 'new' && !i.scheduledDate
    );

    const countEl = document.getElementById('queueCount');
    if (countEl) countEl.textContent = queue.length;

    const container = document.getElementById('planningQueue');
    if (!container) return;

    if (queue.length === 0) {
      container.innerHTML = `
        <div style="padding:32px 16px;text-align:center;color:var(--gray-400)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 8px"><polyline points="20 6 9 17 4 12"/></svg>
          <p class="text-sm">All requests are scheduled!</p>
        </div>
      `;
      return;
    }

    const sorted = Utils.sortBy(queue, i => {
      // Sort by priority then age
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return pOrder[i.priority] + (Utils.daysAgo(i.createdAt) || 0) * 0.01;
    });

    container.innerHTML = sorted.map(i => {
      const daysOld = Utils.daysAgo(i.createdAt) || 0;
      const ageColor = daysOld >= 7 ? 'var(--red)' : daysOld >= 3 ? 'var(--yellow)' : 'var(--gray-400)';
      return `
        <div class="queue-item">
          <div class="queue-item-client">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
          <div class="queue-item-machine">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</div>
          <div class="queue-item-footer">
            ${Utils.getPriorityBadge(i.priority)}
            <span class="queue-item-age" style="color:${ageColor}">
              ${daysOld === 0 ? 'Today' : daysOld + 'd ago'}
            </span>
            <button class="btn btn-primary btn-sm" onclick="Views.Planning._openScheduleModal('${i.id}')">
              Schedule
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  _renderCalendar(interventions, month) {
    const label = document.getElementById('calendarMonthLabel');
    if (label) {
      label.textContent = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    // Get district filter value
    const districtFilter = (document.getElementById('calDistrictFilter')?.value || '').toLowerCase();

    // Get all days in the month grid (Mon-Sun aligned)
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay  = new Date(year, monthIdx + 1, 0);
    const today    = new Date();

    // Pad start (Monday = 0)
    let startPad = firstDay.getDay() - 1;
    if (startPad < 0) startPad = 6;

    const cells = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, monthIdx, -i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({ date: new Date(year, monthIdx, d), isCurrentMonth: true });
    }

    // Next month padding to complete the grid (multiple of 7)
    while (cells.length % 7 !== 0) {
      const d = new Date(year, monthIdx + 1, cells.length - lastDay.getDate() - startPad + 1);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Group interventions by day
    // PMC interventions only appear when they have a scheduled date,
    // an assigned technician, and status is tentative or assigned.
    const CALENDAR_STATUSES = ['tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts', 'completed'];
    const byDay = {};
    interventions.forEach(i => {
      if (!i.scheduledDate) return;
      if (i.type === 'pmc') {
        if (!Utils.getTechIds(i).length) return;
        if (!['tentative', 'assigned'].includes(i.status)) return;
      } else {
        if (!CALENDAR_STATUSES.includes(i.status)) return;
      }
      // District filter
      if (districtFilter) {
        const machine = appState.machines.find(m => m.id === i.machineId);
        if (!machine || (machine.district || '').toLowerCase() !== districtFilter) return;
      }
      const key = new Date(i.scheduledDate).toDateString();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(i);
    });

    grid.innerHTML = cells.map(({ date, isCurrentMonth }) => {
      const isToday = date.toDateString() === today.toDateString();
      const key = date.toDateString();
      const dayItems = byDay[key] || [];
      const dateStr = date.toISOString();

      let dotsHTML = '';
      if (dayItems.length > 0) {
        const maxDots = Math.min(dayItems.length, 5);
        dotsHTML = dayItems.slice(0, maxDots).map(i =>
          `<span class="calendar-dot ${i.priority}"></span>`
        ).join('');
        if (dayItems.length > maxDots) {
          dotsHTML += `<span class="calendar-event-count">+${dayItems.length - maxDots}</span>`;
        }
      }

      const classes = [
        'calendar-cell',
        !isCurrentMonth ? 'other-month' : '',
        isToday ? 'today' : ''
      ].filter(Boolean).join(' ');

      return `
        <div class="${classes}" onclick="Views.Planning._openDayModal('${dateStr}')">
          <div class="calendar-cell-date">${date.getDate()}</div>
          <div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center">${dotsHTML}</div>
        </div>
      `;
    }).join('');
  },

  _renderMonthTable(interventions, month) {
    const titleEl    = document.getElementById('monthTableTitle');
    const countEl    = document.getElementById('monthTableCount');
    const navLabelEl = document.getElementById('monthTableLabel');
    const tbody      = document.getElementById('monthTableBody');
    if (!tbody) return;

    const year     = month.getFullYear();
    const monthIdx = month.getMonth();
    const label    = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (navLabelEl) navLabelEl.textContent = label;

    const tf = this._tableFilters;
    const usingDateRange = tf.dateFrom || tf.dateTo;

    // Determine title based on whether a date range is active
    if (usingDateRange) {
      const fromLabel = tf.dateFrom ? Utils.formatDate(tf.dateFrom) : '—';
      const toLabel   = tf.dateTo   ? Utils.formatDate(tf.dateTo)   : '—';
      if (titleEl) titleEl.textContent = `Schedule — ${fromLabel} – ${toLabel}`;
    } else {
      if (titleEl) titleEl.textContent = `Schedule — ${label}`;
    }

    const districtFilter = (document.getElementById('calDistrictFilter')?.value || '').toLowerCase();
    const CALENDAR_STATUSES = ['tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts', 'completed'];

    // Date range boundaries (inclusive, full day)
    const rangeFrom = tf.dateFrom ? new Date(tf.dateFrom + 'T00:00:00') : null;
    const rangeTo   = tf.dateTo   ? new Date(tf.dateTo   + 'T23:59:59') : null;

    const allItems = interventions.filter(i => {
      if (!i.scheduledDate) return false;
      const d = new Date(i.scheduledDate);

      // Date scoping: use date range if set, otherwise restrict to current month
      if (usingDateRange) {
        if (rangeFrom && d < rangeFrom) return false;
        if (rangeTo   && d > rangeTo)   return false;
      } else {
        if (d.getFullYear() !== year || d.getMonth() !== monthIdx) return false;
      }

      if (i.type === 'pmc') {
        if (!Utils.getTechIds(i).length) return false;
        if (!['tentative', 'assigned'].includes(i.status)) return false;
      } else {
        if (!CALENDAR_STATUSES.includes(i.status)) return false;
      }
      if (districtFilter) {
        const machine = appState.machines.find(m => m.id === i.machineId);
        if (!machine || (machine.district || '').toLowerCase() !== districtFilter) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    // Populate client dropdown from items in scope
    const clientSel = document.getElementById('mtClientFilter');
    if (clientSel) {
      const prevClient = clientSel.value;
      const uniqueClients = [...new Map(allItems.map(i => {
        const c = appState.clients.find(c => c.id === i.clientId);
        return c ? [c.id, c] : null;
      }).filter(Boolean)).values()].sort((a, b) => a.name.localeCompare(b.name));
      clientSel.innerHTML = `<option value="all">All Clients</option>` +
        uniqueClients.map(c => `<option value="${c.id}"${prevClient === c.id ? ' selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('');
    }

    // Apply table filters
    const items = allItems.filter(i => {
      if (tf.client   !== 'all' && i.clientId !== tf.client) return false;
      if (tf.type     !== 'all' && i.type !== tf.type) return false;
      if (tf.priority !== 'all' && i.priority !== tf.priority) return false;
      if (tf.status   !== 'all' && i.status !== tf.status) return false;
      if (tf.district !== 'all') {
        const machine = appState.machines.find(m => m.id === i.machineId);
        if (!machine || machine.district !== tf.district) return false;
      }
      if (tf.tech !== 'all' && !Utils.getTechIds(i).includes(tf.tech)) return false;
      return true;
    });

    // Show/hide clear button
    const clearBtn = document.getElementById('mtFilterClear');
    const hasFilter = Object.entries(tf).some(([k, v]) => k === 'dateFrom' || k === 'dateTo' ? v !== '' : v !== 'all');
    if (clearBtn) clearBtn.style.display = hasFilter ? '' : 'none';

    const hasActiveFilter = Object.entries(tf).some(([k, v]) => k === 'dateFrom' || k === 'dateTo' ? v !== '' : v !== 'all');
    if (countEl) countEl.textContent = hasActiveFilter
      ? `${items.length} / ${allItems.length}`
      : `${allItems.length} intervention${allItems.length !== 1 ? 's' : ''}`;

    const emptyMsg = allItems.length === 0
      ? (usingDateRange ? 'No interventions scheduled in this date range' : `No interventions scheduled for ${label}`)
      : 'No interventions match the current filters';

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11"><div class="table-empty"><p class="table-empty-text">${emptyMsg}</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(i => {
      const machine  = appState.machines.find(m => m.id === i.machineId);
      const scheduled = new Date(i.scheduledDate);
      const dateStr  = scheduled.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const timeStr  = scheduled.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const isOverdue = ['tentative','assigned','ongoing','pending','waiting_parts'].includes(i.status) && Utils.isPast(i.scheduledDate);
      return `
        <tr ${isOverdue ? 'style="background:var(--red-light)"' : ''}>
          <td style="white-space:nowrap;font-size:0.857rem;font-weight:500">${dateStr}</td>
          <td style="white-space:nowrap;font-size:0.857rem;color:var(--gray-500)">${timeStr}</td>
          <td class="td-primary">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
          <td>
            <div style="font-weight:500;font-size:0.857rem">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</div>
            <div style="font-size:0.786rem;color:var(--gray-400)">${Utils.escapeHtml(machine?.serialNumber || '—')}</div>
          </td>
          <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
          <td>${Utils.getPriorityBadge(i.priority)}</td>
          <td>${Utils.getStatusBadge(i.status, i)}</td>
          <td style="font-size:0.786rem;color:${Utils.getTechIds(i).length ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(Utils.getTechnicianNames(i))}</td>
          <td style="font-size:0.786rem;color:${machine?.district ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(machine?.district || '—')}</td>
          <td style="font-size:0.786rem;color:${machine?.location ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(machine?.location || '—')}</td>
          <td>
            <button class="btn btn-ghost btn-sm btn-icon" title="View Detail" onclick="Views.Interventions.openDetailModal('${i.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  _updateTodayBtn() {
    const btn = document.getElementById('goToToday');
    if (!btn) return;
    const now = new Date();
    const isCurrentMonth = this._currentMonth.getFullYear() === now.getFullYear() &&
                           this._currentMonth.getMonth()    === now.getMonth();
    btn.style.display = isCurrentMonth ? 'none' : '';
  },

  _bindMonthNav() {
    const prevBtn        = document.getElementById('prevMonth');
    const nextBtn        = document.getElementById('nextMonth');
    const todayBtn       = document.getElementById('goToToday');
    const prevBtnTable   = document.getElementById('prevMonthTable');
    const nextBtnTable   = document.getElementById('nextMonthTable');
    const districtSelect = document.getElementById('calDistrictFilter');

    const rerender = () => {
      this._renderCalendar(appState.interventions, this._currentMonth);
      this._renderMonthTable(appState.interventions, this._currentMonth);
      this._updateTodayBtn();
    };

    const goToPrev = () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() - 1, 1);
      rerender();
    };

    const goToNext = () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() + 1, 1);
      rerender();
    };

    if (prevBtn)      prevBtn.addEventListener('click', goToPrev);
    if (nextBtn)      nextBtn.addEventListener('click', goToNext);
    if (prevBtnTable) prevBtnTable.addEventListener('click', goToPrev);
    if (nextBtnTable) nextBtnTable.addEventListener('click', goToNext);

    if (todayBtn) todayBtn.addEventListener('click', () => {
      this._currentMonth = new Date();
      rerender();
    });

    if (districtSelect) districtSelect.addEventListener('change', () => {
      this._renderCalendar(appState.interventions, this._currentMonth);
      this._renderMonthTable(appState.interventions, this._currentMonth);
    });

    // Table-level filters
    const bindTableFilter = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = this._tableFilters[key];
      el.addEventListener('change', () => {
        this._tableFilters[key] = el.value;
        this._renderMonthTable(appState.interventions, this._currentMonth);
      });
    };
    bindTableFilter('mtClientFilter',   'client');
    bindTableFilter('mtTypeFilter',     'type');
    bindTableFilter('mtPriorityFilter', 'priority');
    bindTableFilter('mtStatusFilter',   'status');
    bindTableFilter('mtTechFilter',     'tech');
    bindTableFilter('mtDistrictFilter', 'district');

    // Date range inputs
    const dateFromEl = document.getElementById('mtDateFrom');
    const dateToEl   = document.getElementById('mtDateTo');
    if (dateFromEl) {
      dateFromEl.value = this._tableFilters.dateFrom;
      dateFromEl.addEventListener('change', () => {
        this._tableFilters.dateFrom = dateFromEl.value;
        // Auto-set dateTo minimum to dateFrom
        if (dateToEl && dateFromEl.value && dateToEl.value && dateToEl.value < dateFromEl.value) {
          dateToEl.value = dateFromEl.value;
          this._tableFilters.dateTo = dateFromEl.value;
        }
        this._renderMonthTable(appState.interventions, this._currentMonth);
      });
    }
    if (dateToEl) {
      dateToEl.value = this._tableFilters.dateTo;
      dateToEl.addEventListener('change', () => {
        this._tableFilters.dateTo = dateToEl.value;
        this._renderMonthTable(appState.interventions, this._currentMonth);
      });
    }

    const clearBtn = document.getElementById('mtFilterClear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      this._tableFilters = { client: 'all', type: 'all', priority: 'all', status: 'all', tech: 'all', district: 'all', dateFrom: '', dateTo: '' };
      ['mtClientFilter','mtTypeFilter','mtPriorityFilter','mtStatusFilter','mtTechFilter','mtDistrictFilter']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = 'all'; });
      const df = document.getElementById('mtDateFrom'); if (df) df.value = '';
      const dt = document.getElementById('mtDateTo');   if (dt) dt.value = '';
      this._renderMonthTable(appState.interventions, this._currentMonth);
    });

    this._updateTodayBtn();
  },

  _openDayModal(dateStr) {
    const date = new Date(dateStr);
    const districtFilter = (document.getElementById('calDistrictFilter')?.value || '').toLowerCase();
    const dayInterventions = appState.interventions.filter(i => {
      if (!i.scheduledDate) return false;
      if (i.type === 'pmc' && (!Utils.getTechIds(i).length || !['tentative', 'assigned'].includes(i.status))) return false;
      if (districtFilter) {
        const machine = appState.machines.find(m => m.id === i.machineId);
        if (!machine || (machine.district || '').toLowerCase() !== districtFilter) return false;
      }
      return new Date(i.scheduledDate).toDateString() === date.toDateString();
    });

    const title = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (dayInterventions.length === 0) {
      Modals.open(title, `
        <p class="text-sm text-muted">No interventions scheduled for this day.</p>
      `, `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`);
      return;
    }

    const rows = dayInterventions.map(i => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--gray-50);border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer"
           onclick="Modals.close(); setTimeout(() => Views.Interventions.openDetailModal('${i.id}'), 100)">
        <div style="flex:1">
          <div class="font-semibold text-sm">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
          <div class="text-xs text-muted">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))} · ${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</div>
          <div class="text-xs text-muted">${Utils.escapeHtml(Utils.getTechnicianNames(i))}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${Utils.getPriorityBadge(i.priority)}
          ${Utils.getStatusBadge(i.status, i)}
        </div>
      </div>
    `).join('');

    Modals.open(`${title} (${dayInterventions.length} intervention${dayInterventions.length > 1 ? 's' : ''})`, rows, `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
    `);
  },

  _openScheduleModal(interventionId) {
    const intervention = appState.interventions.find(i => i.id === interventionId);
    if (!intervention) return;

    const client  = Utils.getClientName(intervention.clientId);
    const machine = Utils.getMachineModel(intervention.machineId);

    const currentTechIds = Utils.getTechIds(intervention);
    const techCheckboxes = appState.users.filter(u => u.role === 'technician').map(u => `
      <label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--gray-200);border-radius:var(--radius-sm);cursor:pointer;font-size:0.857rem;transition:background 0.15s"
             onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
        <input type="checkbox" class="fSchedTechCheck" value="${u.id}" ${currentTechIds.includes(u.id) ? 'checked' : ''}
               style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary)">
        ${Utils.escapeHtml(u.name)}
      </label>`).join('');

    const today = new Date().toISOString().slice(0, 10);

    Modals.open(`Schedule Intervention`, `
      <div class="alert alert-info" style="margin-bottom:0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <div class="font-semibold">${Utils.escapeHtml(client)}</div>
          <div class="text-xs">${Utils.escapeHtml(machine)} · ${Utils.escapeHtml(Utils.getInterventionTypeLabel(intervention.type))}</div>
        </div>
        ${Utils.getPriorityBadge(intervention.priority)}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Scheduled Date <span class="required">*</span></label>
          <input type="date" id="fSchedDate" class="form-input" value="${today}" min="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input type="time" id="fSchedTime" class="form-input" value="08:00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assign Technician(s)</label>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;padding:2px">
          ${techCheckboxes || '<span style="color:var(--gray-400);font-size:0.857rem">No technicians registered</span>'}
        </div>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Planning._submitSchedule('${interventionId}')">Confirm Schedule</button>
    `);
  },

  async _submitSchedule(interventionId) {
    const dateVal = document.getElementById('fSchedDate')?.value;
    if (!dateVal) { Toast.error('Please select a date'); return; }

    await Utils.withButtonLock(async () => {
      const timeVal = document.getElementById('fSchedTime')?.value || '08:00';
      const scheduledDate = new Date(`${dateVal}T${timeVal}`).toISOString();
      const techIds = Array.from(document.querySelectorAll('.fSchedTechCheck:checked')).map(cb => cb.value);
      const techId  = techIds[0] || null;

      const user      = appState.currentUser;
      const techNames = techIds.map(id => appState.users.find(u => u.id === id)?.name).filter(Boolean).join(', ');

      await Storage.updateIntervention(interventionId, {
        scheduledDate,
        technicianIds: techIds,
        technicianId:  techId,
        status: techIds.length > 0 ? 'assigned' : 'planned'
      }, {
        action: 'Scheduled',
        user: user?.name || 'Admin',
        details: `Date: ${Utils.formatDateTime(scheduledDate)}${techNames ? `, Assigned to ${techNames}` : ''}`
      });

      Modals.close();
      Toast.success('Intervention scheduled successfully');
      this.mount();
    });
  }
};
