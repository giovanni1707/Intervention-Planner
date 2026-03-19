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

  _bindMonthNav() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const districtSelect = document.getElementById('calDistrictFilter');

    if (prevBtn) prevBtn.addEventListener('click', () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() - 1, 1);
      this._renderCalendar(appState.interventions, this._currentMonth);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      this._currentMonth = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() + 1, 1);
      this._renderCalendar(appState.interventions, this._currentMonth);
    });

    if (districtSelect) districtSelect.addEventListener('change', () => {
      this._renderCalendar(appState.interventions, this._currentMonth);
    });
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
    const intervention = Storage.getInterventionById(interventionId);
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

  _submitSchedule(interventionId) {
    const dateVal = document.getElementById('fSchedDate')?.value;
    if (!dateVal) { Toast.error('Please select a date'); return; }

    const timeVal = document.getElementById('fSchedTime')?.value || '08:00';
    const scheduledDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    const techIds = Array.from(document.querySelectorAll('.fSchedTechCheck:checked')).map(cb => cb.value);
    const techId  = techIds[0] || null;

    const user      = appState.currentUser;
    const techNames = techIds.map(id => appState.users.find(u => u.id === id)?.name).filter(Boolean).join(', ');

    Storage.updateIntervention(interventionId, {
      scheduledDate,
      technicianIds: techIds,
      technicianId:  techId,
      status: techIds.length > 0 ? 'assigned' : 'planned'
    }, {
      action: 'Scheduled',
      user: user?.name || 'Admin',
      details: `Date: ${Utils.formatDateTime(scheduledDate)}${techNames ? `, Assigned to ${techNames}` : ''}`
    });

    refreshInterventions();
    Modals.close();
    Toast.success('Intervention scheduled successfully');
    this.mount();
  }
};
