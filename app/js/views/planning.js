/* ============================================================
   views/planning.js — Planning Board (Queue + Calendar)
   ============================================================ */

Views.Planning = {
  _currentMonth: null,

  mount() {
    if (!this._currentMonth) this._currentMonth = new Date();
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderQueue(appState.interventions);
    this._renderCalendar(appState.interventions, this._currentMonth);
    this._bindMonthNav();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Planning Board</h1>
          <p class="page-subtitle">Schedule unplanned requests and track the calendar</p>
        </div>
      </div>

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
          </div>
          <div class="calendar-grid-header">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="calendar-day-label">${d}</div>`).join('')}
          </div>
          <div class="calendar-grid" id="calendarGrid"></div>
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
    const byDay = {};
    interventions.forEach(i => {
      if (!i.scheduledDate) return;
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

  _bindMonthNav() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) prevBtn.addEventListener('click', () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() - 1, 1);
      this._renderCalendar(appState.interventions, this._currentMonth);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() + 1, 1);
      this._renderCalendar(appState.interventions, this._currentMonth);
    });
  },

  _openDayModal(dateStr) {
    const date = new Date(dateStr);
    const dayInterventions = appState.interventions.filter(i => {
      if (!i.scheduledDate) return false;
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
          <div class="text-xs text-muted">${Utils.escapeHtml(Utils.getTechnicianName(i.technicianId))}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${Utils.getPriorityBadge(i.priority)}
          ${Utils.getStatusBadge(i.status)}
        </div>
      </div>
    `).join('');

    Modals.open(`${title} (${dayInterventions.length} intervention${dayInterventions.length > 1 ? 's' : ''})`, rows, `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
    `);
  },

  _openScheduleModal(interventionId) {
    const intervention = Storage.getInterventionById(interventionId);
    if (!intervention) return;

    const client  = Utils.getClientName(intervention.clientId);
    const machine = Utils.getMachineModel(intervention.machineId);

    const techOptions = [
      '<option value="">Unassigned</option>',
      ...appState.users.filter(u => u.role === 'technician').map(u =>
        `<option value="${u.id}" ${intervention.technicianId === u.id ? 'selected' : ''}>${Utils.escapeHtml(u.name)}</option>`)
    ].join('');

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
        <label class="form-label">Assign Technician</label>
        <select id="fSchedTech" class="form-select">${techOptions}</select>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Planning._submitSchedule('${interventionId}')">Confirm Schedule</button>
    `);
  },

  _submitSchedule(interventionId) {
    const dateVal = document.getElementById('fSchedDate')?.value;
    if (!dateVal) { Toast.error('Please select a date'); return; }

    const timeVal = document.getElementById('fSchedTime')?.value || '08:00';
    const scheduledDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    const techId = document.getElementById('fSchedTech')?.value || null;

    const user = appState.currentUser;
    const tech = appState.users.find(u => u.id === techId);

    Storage.updateIntervention(interventionId, {
      scheduledDate,
      technicianId: techId,
      status: techId ? 'assigned' : 'planned'
    }, {
      action: 'Scheduled',
      user: user?.name || 'Admin',
      details: `Date: ${Utils.formatDateTime(scheduledDate)}${tech ? `, Assigned to ${tech.name}` : ''}`
    });

    refreshInterventions();
    Modals.close();
    Toast.success('Intervention scheduled successfully');
    this.mount();
  }
};
