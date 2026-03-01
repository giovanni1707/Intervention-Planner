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
        ${Auth.isAdmin() ? `<div class="page-actions">
          <button class="btn btn-primary" onclick="Views.Technicians._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Technician
          </button>
        </div>` : ''}
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
        i.technicianId === u.id && CONFIG.OPEN_STATUSES.includes(i.status)
      ).length
    }));

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

    grid.innerHTML = techData.map(tech => this._techCardHTML(tech)).join('');
  },

  _techCardHTML(tech) {
    const activeJobs = appState.interventions.filter(i =>
      i.technicianId === tech.id && CONFIG.OPEN_STATUSES.includes(i.status)
    );
    const completedJobs = appState.interventions.filter(i =>
      i.technicianId === tech.id && i.status === 'completed'
    );

    const workloadPct = Math.min(100, Math.round((activeJobs.length / CONFIG.MAX_WORKLOAD) * 100));
    const workloadClass = activeJobs.length >= 6 ? 'workload-high' : activeJobs.length >= 3 ? 'workload-medium' : 'workload-low';

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

    return `
      <div class="tech-card">
        <div class="tech-card-header">
          <div class="tech-avatar">${Utils.getInitials(tech.name)}</div>
          <div class="tech-info">
            <div class="tech-name">${Utils.escapeHtml(tech.name)}</div>
            <div class="tech-email">${Utils.escapeHtml(tech.email)}</div>
            <div style="margin-top:4px">${Utils.getRoleBadge(tech.role)}</div>
          </div>
          ${Auth.isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="Views.Technicians._openEditModal('${tech.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>` : ''}
        </div>

        <div class="workload-bar-container ${workloadClass}">
          <div class="workload-bar-label">
            <span>Active workload</span>
            <span><strong>${activeJobs.length}</strong> / ${CONFIG.MAX_WORKLOAD} jobs</span>
          </div>
          <div class="workload-bar-track">
            <div class="workload-bar-fill" style="width:${workloadPct}%"></div>
          </div>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:12px">
          <div class="stat-box" style="flex:1;padding:8px 12px">
            <div class="stat-box-value" style="font-size:1.3rem">${activeJobs.length}</div>
            <div class="stat-box-label">Active</div>
          </div>
          <div class="stat-box" style="flex:1;padding:8px 12px">
            <div class="stat-box-value" style="font-size:1.3rem">${completedJobs.length}</div>
            <div class="stat-box-label">Completed</div>
          </div>
          <div class="stat-box" style="flex:1;padding:8px 12px">
            <div class="stat-box-value" style="font-size:1.3rem">${appState.interventions.filter(i => i.technicianId === tech.id).length}</div>
            <div class="stat-box-label">Total</div>
          </div>
        </div>

        <div class="detail-section-label">Active Assignments</div>
        <div class="tech-jobs-list">${jobsHTML}</div>
      </div>
    `;
  },

  _techFormHTML(user = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" id="fTechName" class="form-input" value="${Utils.escapeHtml(user.name || '')}" placeholder="e.g. Jean-Marc Dupont">
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
    Modals.open('Add Technician', this._techFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Technicians._submitCreate()">Add Technician</button>
    `);
  },

  _submitCreate() {
    const name  = document.getElementById('fTechName')?.value.trim();
    const email = document.getElementById('fTechEmail')?.value.trim();
    const pass  = document.getElementById('fTechPass')?.value;
    const role  = document.getElementById('fTechRole')?.value || 'technician';

    if (!name)  { Toast.error('Name is required'); return; }
    if (!email) { Toast.error('Email is required'); return; }
    if (!pass)  { Toast.error('Password is required'); return; }

    // Check duplicate email
    if (Storage.getUserByEmail(email)) {
      Toast.error('A user with this email already exists');
      return;
    }

    Storage.createUser({ name, email, password: pass, role });
    refreshUsers();
    Modals.close();
    Toast.success(`Technician "${name}" added`);
    this.mount();
  },

  _openEditModal(userId) {
    const user = Storage.getUserById(userId);
    if (!user) return;

    Modals.open(`Edit — ${user.name}`, this._techFormHTML(user), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Technicians._submitEdit('${userId}')">Save Changes</button>
    `);
  },

  _submitEdit(userId) {
    const name  = document.getElementById('fTechName')?.value.trim();
    const email = document.getElementById('fTechEmail')?.value.trim();
    const pass  = document.getElementById('fTechPass')?.value;
    const role  = document.getElementById('fTechRole')?.value || 'technician';

    if (!name)  { Toast.error('Name is required'); return; }
    if (!email) { Toast.error('Email is required'); return; }

    const existing = Storage.getUserByEmail(email);
    if (existing && existing.id !== userId) {
      Toast.error('Another user with this email already exists');
      return;
    }

    const updates = { name, email, role };
    if (pass) updates.password = pass;

    Storage.updateUser(userId, updates);
    refreshUsers();
    Modals.close();
    Toast.success('Technician updated');
    this.mount();
  }
};
