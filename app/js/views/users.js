/* ============================================================
   views/users.js — User Management (Super Admin Only)
   ============================================================ */

window.Views = window.Views || {};

Views.Users = {

  mount() {
    if (!Auth.isSuperAdmin()) {
      document.getElementById('mainContent').innerHTML = `
        <div style="padding:60px;text-align:center;color:var(--gray-400)">
          <p style="font-size:1.1rem">Access Restricted</p>
          <p style="font-size:0.857rem;margin-top:8px">Only the Head Administrator can manage users.</p>
        </div>`;
      return;
    }
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
  },

  _template() {
    const users = Storage.getUsers();
    const currentUser = appState.currentUser;

    const rows = users.map(u => {
      const isSelf = u.id === currentUser.id;
      const roleLabel = CONFIG.ROLES[u.role] || u.role;
      const roleBadgeColor = u.role === 'superadmin' ? 'var(--purple)' :
                             u.role === 'admin'       ? 'var(--blue)'   : 'var(--green)';
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:${roleBadgeColor};color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0">
                ${Utils.getInitials(u.name)}
              </div>
              <div>
                <div style="font-weight:600">${Utils.escapeHtml(u.name)}${isSelf ? ' <span style="font-size:0.75rem;color:var(--gray-600)">(you)</span>' : ''}</div>
                <div style="font-size:0.8rem;color:var(--gray-600)">${Utils.escapeHtml(u.email)}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;background:${roleBadgeColor}22;color:${roleBadgeColor}">
              ${roleLabel}
            </span>
          </td>
          <td style="font-size:0.857rem;color:var(--gray-600)">${Utils.formatDate(u.createdAt)}</td>
          <td>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit User" onclick="Views.Users._openEditModal('${u.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              ${!isSelf ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete User" style="color:var(--red)" onclick="Views.Users._openDeleteModal('${u.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">Manage system users and role assignments</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" id="addUserBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;padding:12px 20px;background:#F0F9FF;border:1px solid #BAE6FD">
        <div style="display:flex;align-items:center;gap:10px;font-size:0.857rem;color:#0369A1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Only the <strong>Head Administrator</strong> can register, modify, or delete users and assign roles. All changes are logged.</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">System Users</span>
          <span class="text-sm text-muted">${users.length} user${users.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="4"><div class="table-empty"><p class="table-empty-text">No users found</p></div></td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) addBtn.addEventListener('click', () => this._openCreateModal());
  },

  _openCreateModal() {
    const body = `
      <div class="form-group">
        <label class="form-label">Full Name <span style="color:var(--red)">*</span></label>
        <input type="text" id="uName" class="form-input" placeholder="e.g. John Smith" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address <span style="color:var(--red)">*</span></label>
        <input type="email" id="uEmail" class="form-input" placeholder="user@bavarian.mu" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password <span style="color:var(--red)">*</span></label>
        <input type="password" id="uPassword" class="form-input" placeholder="••••••••" required minlength="6">
      </div>
      <div class="form-group">
        <label class="form-label">Role <span style="color:var(--red)">*</span></label>
        <select id="uRole" class="form-select">
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Head Administrator</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Your Password (to confirm) <span style="color:var(--red)">*</span></label>
        <input type="password" id="uConfirmPassword" class="form-input" placeholder="Your current password" required>
      </div>
      <div id="uError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Users._submitCreate()">Create User</button>
    `;

    Modals.open('Add New User', body, footer);
  },

  _submitCreate() {
    const name     = document.getElementById('uName')?.value.trim();
    const email    = document.getElementById('uEmail')?.value.trim();
    const password = document.getElementById('uPassword')?.value;
    const role     = document.getElementById('uRole')?.value;
    const confirm  = document.getElementById('uConfirmPassword')?.value;
    const errEl    = document.getElementById('uError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!name || !email || !password || !role || !confirm) return showErr('All fields are required.');
    if (password.length < 6) return showErr('Password must be at least 6 characters.');

    // Verify super admin credentials
    const sa = appState.currentUser;
    if (confirm !== sa.password) return showErr('Your password is incorrect.');

    // Check email uniqueness
    if (Storage.getUserByEmail(email)) return showErr('A user with this email already exists.');

    const newUser = Storage.createUser({ name, email, password, role });
    Storage.logAction({
      actor: sa.name,
      actorId: sa.id,
      action: 'CREATE_USER',
      target: `${newUser.name} (${newUser.email})`,
      details: `Role: ${CONFIG.ROLES[role] || role}`
    });

    appState.users = Storage.getUsers();
    Modals.close();
    Toast.success(`User "${name}" created successfully.`);
    this.mount();
  },

  _openEditModal(userId) {
    const u = Storage.getUserById(userId);
    if (!u) return;

    const roleOptions = Object.entries(CONFIG.ROLES).map(([k, v]) =>
      `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`
    ).join('');

    const body = `
      <div class="form-group">
        <label class="form-label">Full Name <span style="color:var(--red)">*</span></label>
        <input type="text" id="ueName" class="form-input" value="${Utils.escapeHtml(u.name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address <span style="color:var(--red)">*</span></label>
        <input type="email" id="ueEmail" class="form-input" value="${Utils.escapeHtml(u.email)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">New Password <span style="font-size:0.8rem;color:var(--gray-600)">(leave blank to keep current)</span></label>
        <input type="password" id="uePassword" class="form-input" placeholder="••••••••">
      </div>
      <div class="form-group">
        <label class="form-label">Role <span style="color:var(--red)">*</span></label>
        <select id="ueRole" class="form-select">${roleOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Your Password (to confirm) <span style="color:var(--red)">*</span></label>
        <input type="password" id="ueConfirmPassword" class="form-input" placeholder="Your current password" required>
      </div>
      <div id="ueError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Users._submitEdit('${userId}')">Save Changes</button>
    `;

    Modals.open(`Edit User — ${Utils.escapeHtml(u.name)}`, body, footer);
  },

  _submitEdit(userId) {
    const name     = document.getElementById('ueName')?.value.trim();
    const email    = document.getElementById('ueEmail')?.value.trim();
    const password = document.getElementById('uePassword')?.value;
    const role     = document.getElementById('ueRole')?.value;
    const confirm  = document.getElementById('ueConfirmPassword')?.value;
    const errEl    = document.getElementById('ueError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!name || !email || !role || !confirm) return showErr('All required fields must be filled.');

    const sa = appState.currentUser;
    if (confirm !== sa.password) return showErr('Your password is incorrect.');

    const existing = Storage.getUserByEmail(email);
    if (existing && existing.id !== userId) return showErr('Another user already has this email.');

    const updates = { name, email, role };
    if (password) {
      if (password.length < 6) return showErr('New password must be at least 6 characters.');
      updates.password = password;
    }

    const u = Storage.getUserById(userId);
    Storage.updateUser(userId, updates);
    Storage.logAction({
      actor: sa.name,
      actorId: sa.id,
      action: 'EDIT_USER',
      target: `${name} (${email})`,
      details: `Role: ${CONFIG.ROLES[role] || role}${password ? ', Password changed' : ''}`
    });

    // Update session if editing self
    if (userId === sa.id) {
      appState.currentUser = Storage.getUserById(userId);
    }

    appState.users = Storage.getUsers();
    Modals.close();
    Toast.success(`User "${name}" updated successfully.`);
    this.mount();
  },

  _openDeleteModal(userId) {
    const u = Storage.getUserById(userId);
    if (!u) return;

    const body = `
      <div style="margin-bottom:16px;padding:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:0.857rem;color:#991B1B">
        <strong>Warning:</strong> Deleting a user is permanent and cannot be undone.
        If this user has assigned interventions, those assignments will remain but the user account will be removed.
      </div>
      <div class="form-group">
        <label class="form-label">Your Password (to confirm) <span style="color:var(--red)">*</span></label>
        <input type="password" id="udPassword" class="form-input" placeholder="Your current password" required>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Deletion <span style="color:var(--red)">*</span></label>
        <textarea id="udReason" class="form-input" rows="2" placeholder="State the reason..."></textarea>
      </div>
      <div id="udError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-danger" onclick="Views.Users._submitDelete('${userId}')">Delete User</button>
    `;

    Modals.open(`Delete User — ${Utils.escapeHtml(u.name)}`, body, footer);
  },

  _submitDelete(userId) {
    const password = document.getElementById('udPassword')?.value;
    const reason   = document.getElementById('udReason')?.value.trim();
    const errEl    = document.getElementById('udError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!password || !reason) return showErr('Password and reason are required.');

    const sa = appState.currentUser;
    if (password !== sa.password) return showErr('Your password is incorrect.');

    const u = Storage.getUserById(userId);
    if (!u) return showErr('User not found.');

    Storage.logAction({
      actor: sa.name,
      actorId: sa.id,
      action: 'DELETE_USER',
      target: `${u.name} (${u.email})`,
      details: `Reason: ${reason}`
    });

    Storage.deleteUser(userId);
    appState.users = Storage.getUsers();
    Modals.close();
    Toast.success(`User "${u.name}" deleted.`);
    this.mount();
  }
};
