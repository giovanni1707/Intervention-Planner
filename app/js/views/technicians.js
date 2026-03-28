/* ============================================================
   views/technicians.js — Technician Management View
   ============================================================ */

Views.Technicians = {
  mount() {
    const content = document.getElementById('mainContent');
    const technicians = appState.users.filter(u => u.role === 'technician');
    content.innerHTML = this._template(technicians);
    this._renderCards(technicians);
  },

  _template(technicians) {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Technicians</h1>
          <p class="page-subtitle">${technicians.length} technician${technicians.length !== 1 ? 's' : ''} · Workload overview</p>
        </div>
      </div>

      <!-- Workload summary chart -->
      <div class="card" style="margin-bottom:24px;padding:20px">
        <div class="card-header" style="border:none;padding:0 0 16px 0">
          <span class="card-title">Team Workload Overview</span>
        </div>
        <div style="height:160px">
          <canvas id="workloadChart"></canvas>
        </div>
      </div>

      <div class="tech-grid" id="techGrid"></div>
    `;
  },

  _renderCards(technicians) {
    const grid = document.getElementById('techGrid');
    if (!grid) return;

    const techData = technicians.map(u => ({
      ...u,
      activeJobs: appState.interventions.filter(i =>
        Utils.getTechIds(i).includes(u.id) && CONFIG.OPEN_STATUSES.includes(i.status)
      ).length
    }));
    const maxWorkload = Math.max(10, ...techData.map(t => t.activeJobs));

    // Render workload chart
    Charts.renderTechnicianWorkload('workloadChart', techData.map(t => ({
      name: t.name,
      activeJobs: t.activeJobs
    })));

    if (technicians.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gray-400)">
          <p>No technicians registered yet.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = techData.map(tech => this._techCardHTML(tech, maxWorkload)).join('');
  },

  _techCardHTML(tech, maxWorkload = 10) {
    const activeJobs = appState.interventions.filter(i =>
      Utils.getTechIds(i).includes(tech.id) && CONFIG.OPEN_STATUSES.includes(i.status)
    );
    const completedJobs = appState.interventions.filter(i =>
      Utils.getTechIds(i).includes(tech.id) && i.status === 'completed'
    );

    const workloadPct = Math.round((activeJobs.length / maxWorkload) * 100);
    const workloadClass = workloadPct >= 80 ? 'workload-high' : workloadPct >= 40 ? 'workload-medium' : 'workload-low';

    const jobsHTML = activeJobs.length === 0
      ? '<p class="text-sm text-muted">No active jobs</p>'
      : activeJobs.slice(0, 5).map(i => `
          <div class="tech-job-item" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <div>
              ${Utils.getPriorityBadge(i.priority)}
            </div>
            <div class="tech-job-client">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
            <div class="tech-job-date">${Utils.formatDate(i.scheduledDate)}</div>
          </div>
        `).join('') +
        (activeJobs.length > 5 ? `<p class="text-xs text-muted" style="margin-top:6px">+${activeJobs.length - 5} more…</p>` : '');

    const totalJobs = appState.interventions.filter(i => Utils.getTechIds(i).includes(tech.id)).length;

    return `
      <div class="tech-card">

        <div class="tech-card-header">
          <div class="tech-avatar">${Utils.getInitials(tech.name)}</div>
          <div class="tech-info">
            <div class="tech-name">${Utils.escapeHtml(tech.name)}</div>
            <div class="tech-email">${Utils.escapeHtml(tech.email)}</div>
            <div class="tech-role-row">${Utils.getRoleBadge(tech.role)}</div>
          </div>
          <div class="tech-card-actions">
            <button class="btn btn-ghost btn-sm btn-icon" title="Planning Board"
                    onclick="Views.Technicians.openPlanningBoard('${tech.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" title="View All Interventions"
                    onclick="Views.Technicians.openInterventionsModal('${tech.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            ${Auth.isSuperAdmin() ? `
            <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Users._openEditModal('${tech.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>` : ''}
          </div>
        </div>

        <div class="tech-card-stats">
          <div class="tech-stat">
            <div class="tech-stat-value">${activeJobs.length}</div>
            <div class="tech-stat-label">Active</div>
          </div>
          <div class="tech-stat-divider"></div>
          <div class="tech-stat">
            <div class="tech-stat-value">${completedJobs.length}</div>
            <div class="tech-stat-label">Completed</div>
          </div>
          <div class="tech-stat-divider"></div>
          <div class="tech-stat">
            <div class="tech-stat-value">${totalJobs}</div>
            <div class="tech-stat-label">Total</div>
          </div>
        </div>

        <div class="workload-bar-container ${workloadClass}">
          <div class="workload-bar-label">
            <span>Active workload</span>
            <span><strong>${activeJobs.length}</strong> active job${activeJobs.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="workload-bar-track">
            <div class="workload-bar-fill" style="width:${workloadPct}%"></div>
          </div>
        </div>

        <div class="tech-assignments-header">Active Assignments</div>
        <div class="tech-jobs-list">${jobsHTML}</div>

      </div>
    `;
  },

  openPlanningBoard(techId) {
    const tech = appState.users.find(u => u.id === techId);
    if (!tech) return;

    // Scoped state for this board instance
    let currentMonth = new Date();

    const techInterventions = () => appState.interventions.filter(i => Utils.getTechIds(i).includes(techId));

    const CALENDAR_STATUSES = ['tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts', 'completed'];

    const renderCalendar = () => {
      const grid  = document.getElementById('pbCalendarGrid');
      const label = document.getElementById('pbMonthLabel');
      if (!grid || !label) return;

      label.textContent = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

      const year     = currentMonth.getFullYear();
      const monthIdx = currentMonth.getMonth();
      const firstDay = new Date(year, monthIdx, 1);
      const lastDay  = new Date(year, monthIdx + 1, 0);
      const today    = new Date();

      let startPad = firstDay.getDay() - 1;
      if (startPad < 0) startPad = 6;

      const cells = [];
      for (let i = startPad - 1; i >= 0; i--) cells.push({ date: new Date(year, monthIdx, -i), isCurrentMonth: false });
      for (let d = 1; d <= lastDay.getDate(); d++) cells.push({ date: new Date(year, monthIdx, d), isCurrentMonth: true });
      while (cells.length % 7 !== 0) {
        cells.push({ date: new Date(year, monthIdx + 1, cells.length - lastDay.getDate() - startPad + 1), isCurrentMonth: false });
      }

      const byDay = {};
      techInterventions().forEach(i => {
        if (!i.scheduledDate) return;
        if (i.type === 'pmc') {
          if (!Utils.getTechIds(i).length || !['tentative', 'assigned'].includes(i.status)) return;
        } else {
          if (!CALENDAR_STATUSES.includes(i.status)) return;
        }
        const key = new Date(i.scheduledDate).toDateString();
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(i);
      });

      grid.innerHTML = cells.map(({ date, isCurrentMonth }) => {
        const isToday  = date.toDateString() === today.toDateString();
        const key      = date.toDateString();
        const dayItems = byDay[key] || [];
        const dateStr  = date.toISOString();

        let dotsHTML = '';
        if (dayItems.length > 0) {
          const maxDots = Math.min(dayItems.length, 5);
          dotsHTML = dayItems.slice(0, maxDots).map(i =>
            `<span class="calendar-dot ${i.priority}"></span>`
          ).join('');
          if (dayItems.length > maxDots) dotsHTML += `<span class="calendar-event-count">+${dayItems.length - maxDots}</span>`;
        }

        const classes = ['calendar-cell', !isCurrentMonth ? 'other-month' : '', isToday ? 'today' : ''].filter(Boolean).join(' ');

        return `
          <div class="${classes}" onclick="Views.Technicians._openPbDayModal('${techId}','${dateStr}')">
            <div class="calendar-cell-date">${date.getDate()}</div>
            <div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center">${dotsHTML}</div>
          </div>`;
      }).join('');
    };

    // Summary stats
    const all       = techInterventions();
    const active    = all.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const completed = all.filter(i => i.status === 'completed');
    const upcoming  = all.filter(i => {
      if (!i.scheduledDate) return false;
      const d = new Date(i.scheduledDate);
      const now = new Date();
      return d >= now && CALENDAR_STATUSES.includes(i.status);
    });

    // Upcoming list (next 5)
    const sortedUpcoming = upcoming
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 5);

    const upcomingHTML = sortedUpcoming.length === 0
      ? `<div style="padding:14px;text-align:center;color:var(--gray-400);font-size:0.786rem">No upcoming scheduled jobs</div>`
      : sortedUpcoming.map(i => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--gray-100);cursor:pointer"
               onclick="Modals.close(); setTimeout(() => Views.Interventions.openDetailModal('${i.id}'), 120)">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
              <div style="font-size:0.72rem;color:var(--gray-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</div>
              <div style="font-size:0.72rem;color:var(--gray-400);margin-top:2px">${Utils.formatDate(i.scheduledDate)}</div>
            </div>
            <div style="flex-shrink:0">${Utils.getPriorityBadge(i.priority)}</div>
          </div>`).join('');

    const body = `
      <!-- KPI strip -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:10px 12px;display:flex;align-items:center;gap:10px">
          <div style="font-size:1.4rem;font-weight:700;color:var(--primary);min-width:32px;text-align:center">${active.length}</div>
          <div style="font-size:0.786rem;color:var(--gray-500)">Active Jobs</div>
        </div>
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:10px 12px;display:flex;align-items:center;gap:10px">
          <div style="font-size:1.4rem;font-weight:700;color:#059669;min-width:32px;text-align:center">${completed.length}</div>
          <div style="font-size:0.786rem;color:var(--gray-500)">Completed</div>
        </div>
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:10px 12px;display:flex;align-items:center;gap:10px">
          <div style="font-size:1.4rem;font-weight:700;color:#D97706;min-width:32px;text-align:center">${upcoming.length}</div>
          <div style="font-size:0.786rem;color:var(--gray-500)">Upcoming</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 220px;gap:12px;align-items:start">

        <!-- Calendar -->
        <div class="card" style="padding:14px">
          <div class="calendar-nav" style="margin-bottom:8px">
            <button class="btn btn-ghost btn-sm btn-icon" id="pbPrevMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="calendar-month-label" id="pbMonthLabel"></span>
            <button class="btn btn-ghost btn-sm btn-icon" id="pbNextMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="calendar-grid-header">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="calendar-day-label">${d}</div>`).join('')}
          </div>
          <div class="calendar-grid" id="pbCalendarGrid"></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:0.72rem;color:var(--gray-500)">
            <span><span class="calendar-dot urgent" style="display:inline-block"></span> Urgent</span>
            <span><span class="calendar-dot high" style="display:inline-block"></span> High</span>
            <span><span class="calendar-dot medium" style="display:inline-block"></span> Medium</span>
            <span><span class="calendar-dot low" style="display:inline-block"></span> Low</span>
          </div>
        </div>

        <!-- Upcoming sidebar -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid var(--gray-200)">
            <div style="font-weight:600;font-size:0.857rem">Upcoming Jobs</div>
            <div style="font-size:0.72rem;color:var(--gray-400);margin-top:1px">Next ${sortedUpcoming.length} scheduled</div>
          </div>
          ${upcomingHTML}
        </div>

      </div>
    `;

    Modals.open(
      `Planning Board — ${Utils.escapeHtml(tech.name)}`,
      body,
      `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`,
      { size: 'xl', onOpen: () => {
        renderCalendar();
        const prev = document.getElementById('pbPrevMonth');
        const next = document.getElementById('pbNextMonth');
        if (prev) prev.addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1); renderCalendar(); });
        if (next) next.addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1); renderCalendar(); });
      }}
    );
  },

  _openPbDayModal(techId, dateStr) {
    const date = new Date(dateStr);
    const CALENDAR_STATUSES = ['tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts', 'completed'];

    const dayInterventions = appState.interventions.filter(i => {
      if (!Utils.getTechIds(i).includes(techId)) return false;
      if (!i.scheduledDate) return false;
      if (i.type === 'pmc' && !['tentative', 'assigned'].includes(i.status)) return false;
      if (i.type !== 'pmc' && !CALENDAR_STATUSES.includes(i.status)) return false;
      return new Date(i.scheduledDate).toDateString() === date.toDateString();
    });

    const title = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (dayInterventions.length === 0) {
      Modals.open(title, `<p class="text-sm text-muted">No interventions scheduled for this day.</p>`,
        `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`);
      return;
    }

    const rows = dayInterventions.map(i => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--gray-50);border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer"
           onclick="Modals.close(); setTimeout(() => Views.Interventions.openDetailModal('${i.id}'), 100)">
        <div style="flex:1">
          <div class="font-semibold text-sm">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
          <div class="text-xs text-muted">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))} · ${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${Utils.getPriorityBadge(i.priority)}
          ${Utils.getStatusBadge(i.status, i)}
        </div>
      </div>`).join('');

    Modals.open(
      `${title} (${dayInterventions.length} intervention${dayInterventions.length > 1 ? 's' : ''})`,
      rows,
      `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`
    );
  },

  openInterventionsModal(techId) {
    const tech = appState.users.find(u => u.id === techId);
    if (!tech) return;

    const allIntv = appState.interventions
      .filter(i => Utils.getTechIds(i).includes(techId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const rowsHTML = allIntv.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">No interventions assigned to this technician.</td></tr>`
      : allIntv.map(i => `
          <tr>
            <td>${Utils.getStatusBadge(i.status, i)}</td>
            <td>${Utils.getPriorityBadge(i.priority)}</td>
            <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
            <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</td>
            <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
            <td style="font-size:0.786rem">${i.location === 'workshop' ? 'Workshop' : 'Client Premises'}</td>
            <td style="font-size:0.786rem;white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
            <td>
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details"
                onclick="Modals.close(); setTimeout(() => Views.Interventions.openDetailModal('${i.id}'), 100)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </td>
          </tr>
        `).join('');

    const body = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Priority</th>
            <th>Client</th>
            <th>Machine</th>
            <th>Type</th>
            <th>Location</th>
            <th>Scheduled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `;

    Modals.open(
      `${Utils.escapeHtml(tech.name)} — ${allIntv.length} Intervention${allIntv.length !== 1 ? 's' : ''}`,
      body,
      `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`,
      { size: 'lg' }
    );
  },

  _techFormHTML(user = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" id="fTechName" class="form-input" value="${Utils.escapeHtml(user.name || '')}" placeholder="e.g. Jonathan Chellen">
        </div>
        <div class="form-group">
          <label class="form-label">Email <span class="required">*</span></label>
          <input type="email" id="fTechEmail" class="form-input" value="${Utils.escapeHtml(user.email || '')}" placeholder="technician@bavarian.mu">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Password ${user.id ? '(leave blank to keep current)' : ''} ${!user.id ? '<span class="required">*</span>' : ''}</label>
          <input type="password" id="fTechPass" class="form-input" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="fTechRole" class="form-select">
            <option value="technician" ${(!user.role || user.role === 'technician') ? 'selected' : ''}>Technician</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
      </div>
    `;
  },

  _openCreateModal() {
    Modals.open('Add User', this._techFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Technicians._submitCreate()">Add User</button>
    `);
  },

  async _submitCreate() {
    const name  = document.getElementById('fTechName')?.value.trim();
    const email = document.getElementById('fTechEmail')?.value.trim().toLowerCase();
    const pass  = document.getElementById('fTechPass')?.value;
    const role  = document.getElementById('fTechRole')?.value || 'technician';

    if (!name)  { Toast.error('Name is required'); return; }
    if (!email) { Toast.error('Email is required'); return; }
    if (!pass)  { Toast.error('Password is required'); return; }
    if (pass.length < 6) { Toast.error('Password must be at least 6 characters'); return; }

    if (appState.users.find(u => u.email.toLowerCase() === email)) {
      Toast.error('A user with this email already exists');
      return;
    }

    try {
      const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
      const uid  = cred.user.uid;
      await Storage.createUser({ id: uid, name, email, role });
      // Re-sign in as the current admin
      const sa = appState.currentUser;
      if (sa && sa.email) {
        const saPass = document.getElementById('fTechSaPass')?.value;
        if (saPass) await fbAuth.signInWithEmailAndPassword(sa.email, saPass);
      }
      Modals.close();
      Toast.success(`User "${name}" added`);
    } catch (err) {
      Toast.error(err.message || 'Failed to create user');
    }
  },

  _openEditModal(userId) {
    const user = appState.users.find(u => u.id === userId);
    if (!user) return;

    Modals.open(`Edit — ${user.name}`, this._techFormHTML(user), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Technicians._submitEdit('${userId}')">Save Changes</button>
    `);
  },

  async _submitEdit(userId) {
    const name  = document.getElementById('fTechName')?.value.trim();
    const email = document.getElementById('fTechEmail')?.value.trim().toLowerCase();
    const role  = document.getElementById('fTechRole')?.value || 'technician';

    if (!name)  { Toast.error('Name is required'); return; }
    if (!email) { Toast.error('Email is required'); return; }

    const existing = appState.users.find(u => u.email.toLowerCase() === email && u.id !== userId);
    if (existing) {
      Toast.error('Another user with this email already exists');
      return;
    }

    try {
      await Storage.updateUser(userId, { name, email, role });
      Modals.close();
      Toast.success('User updated');
    } catch (err) {
      Toast.error(err.message || 'Failed to update user');
    }
  }
};

/* ============================================================
   views/users.js — User Management View
   ============================================================ */

Views.Users = {
  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderTable();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-subtitle">${appState.users.length} registered user${appState.users.length !== 1 ? 's' : ''}</p>
        </div>
        ${Auth.isSuperAdmin() ? `
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Router.go('users')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Manage Users
          </button>
        </div>` : ''}
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active Jobs</th>
              <th>Completed Jobs</th>
              <th style="width:80px"></th>
            </tr>
          </thead>
          <tbody id="usersTableBody"></tbody>
        </table>
      </div>
    `;
  },

  _renderTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = [...appState.users].sort((a, b) => a.name.localeCompare(b.name));

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="table-empty">
            <p class="table-empty-text">No users registered yet.</p>
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const activeJobs = u.role === 'technician'
        ? appState.interventions.filter(i => Utils.getTechIds(i).includes(u.id) && CONFIG.OPEN_STATUSES.includes(i.status)).length
        : '—';
      const completedJobs = u.role === 'technician'
        ? appState.interventions.filter(i => Utils.getTechIds(i).includes(u.id) && i.status === 'completed').length
        : '—';
      return `
        <tr>
          <td class="td-primary">${Utils.escapeHtml(u.name)}</td>
          <td style="font-size:0.857rem;color:var(--gray-500)">${Utils.escapeHtml(u.email)}</td>
          <td>${Utils.getRoleBadge(u.role)}</td>
          <td>${activeJobs}</td>
          <td>${completedJobs}</td>
          ${Auth.isSuperAdmin() ? `
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Users._openEditModal('${u.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          </td>` : '<td></td>'}
        </tr>
      `;
    }).join('');
  }
};
