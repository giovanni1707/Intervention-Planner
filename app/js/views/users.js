/* ============================================================
   views/users.js — User Management (Super Admin Only)
   ============================================================ */

window.Views = window.Views || {};

Views.Users = {

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    if (Auth.isSuperAdmin()) this._bindEvents();
  },

  _template() {
    const users = appState.users;
    const currentUser = appState.currentUser;
    const isSuperAdmin = Auth.isSuperAdmin();

    const rows = users.map(u => {
      const isSelf = u.id === currentUser.id;
      const roleLabel = CONFIG.ROLES[u.role] || u.role;
      const roleBadgeColor = u.role === 'superadmin' ? 'var(--purple)' :
                             u.role === 'admin'       ? 'var(--blue)'   : 'var(--green)';
      const shortId = u.id.slice(-8).toUpperCase();
      return `
        <tr>
          <td style="font-family:monospace;font-size:0.8rem;color:var(--gray-600);white-space:nowrap">${shortId}</td>
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
          ${isSuperAdmin ? `
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
          </td>` : '<td></td>'}
        </tr>
      `;
    }).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">System users and role assignments</p>
        </div>
        ${isSuperAdmin ? `
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" id="addUserBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>` : ''}
      </div>

      <div class="card" style="margin-bottom:16px;padding:12px 20px;background:#F0F9FF;border:1px solid #BAE6FD">
        <div style="display:flex;align-items:center;gap:10px;font-size:0.857rem;color:#0369A1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${isSuperAdmin
            ? 'Only the <strong>Head Administrator</strong> can register, modify, or delete users and assign roles. All changes are logged.'
            : 'This section is <strong>read-only</strong>. Only the Head Administrator can add, edit, or delete users.'}</span>
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
                  <th>User ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th style="text-align:right">${isSuperAdmin ? 'Actions' : ''}</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="5"><div class="table-empty"><p class="table-empty-text">No users found</p></div></td></tr>`}
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

  async _submitCreate() {
    const name     = document.getElementById('uName')?.value.trim();
    const email    = document.getElementById('uEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('uPassword')?.value;
    const role     = document.getElementById('uRole')?.value;
    const errEl    = document.getElementById('uError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!name || !email || !password || !role) return showErr('All fields are required.');
    if (password.length < 6) return showErr('Password must be at least 6 characters.');

    // Check email uniqueness in appState
    if (appState.users.find(u => u.email.toLowerCase() === email)) return showErr('A user with this email already exists.');

    const sa = appState.currentUser;

    await Utils.withButtonLock(async () => {
      try {
        const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
        const uid  = cred.user.uid;
        const newUser = await Storage.createUser({ id: uid, name, email, role });
        await Storage.logAction({
          actor: sa.name,
          actorId: sa.id,
          action: 'CREATE_USER',
          target: `${newUser.name} (${newUser.email})`,
          targetId: newUser.id,
          details: `Role: ${CONFIG.ROLES[role] || role}`
        });

        // Send email verification to the new user
        try {
          await cred.user.sendEmailVerification();
        } catch (_) { /* non-critical — account is still usable */ }

        // Re-authenticate as the superadmin who performed the creation
        await fbAuth.signInWithEmailAndPassword(sa.email, document.getElementById('uConfirmPassword')?.value || '');
        Modals.close();
        Toast.success(`User "${name}" created. A verification email has been sent to ${email}.`);
        this.mount();
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') return showErr('A Firebase Auth account with this email already exists.');
        if (err.code === 'auth/wrong-password') return showErr('Your password is incorrect — could not re-authenticate.');
        showErr(err.message || 'Failed to create user.');
      }
    });
  },

  _openEditModal(userId) {
    const u = appState.users.find(x => x.id === userId);
    if (!u) return;

    const roleOptions = Object.entries(CONFIG.ROLES).map(([k, v]) =>
      `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`
    ).join('');

    const body = `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--blue-light);border:1px solid var(--blue);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--blue);margin-bottom:16px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="flex-shrink:0"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        The user will receive an in-app chat notification listing all changes.
      </div>
      <div class="form-group">
        <label class="form-label">Full Name <span style="color:var(--red)">*</span></label>
        <input type="text" id="ueName" class="form-input" value="${Utils.escapeHtml(u.name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" value="${Utils.escapeHtml(u.email)}" disabled style="opacity:0.7;cursor:not-allowed">
        <div style="font-size:0.78rem;color:var(--gray-500);margin-top:4px">Email address cannot be changed.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Role <span style="color:var(--red)">*</span></label>
        <select id="ueRole" class="form-select">${roleOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Details / Reason for changes <span style="color:var(--red)">*</span></label>
        <textarea id="ueDetails" class="form-input" rows="3" placeholder="Describe the reason for this update…" style="resize:vertical"></textarea>
      </div>
      <div id="ueError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Users._submitEdit('${userId}')">Save Changes</button>
    `;

    Modals.open(`Edit User — ${Utils.escapeHtml(u.name)}`, body, footer);
  },

  async _submitEdit(userId) {
    const name    = document.getElementById('ueName')?.value.trim();
    const role    = document.getElementById('ueRole')?.value;
    const details = document.getElementById('ueDetails')?.value.trim();
    const errEl   = document.getElementById('ueError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!name || !role)    return showErr('Full Name and Role are required.');
    if (!details)          return showErr('Please provide a reason for the changes.');

    const sa = appState.currentUser;
    const u  = appState.users.find(x => x.id === userId);
    if (!u) return showErr('User not found.');

    const changes = [];
    if (u.name !== name) changes.push({ field: 'Full Name', from: u.name,                          to: name });
    if (u.role !== role) changes.push({ field: 'Role',      from: CONFIG.ROLES[u.role] || u.role,  to: CONFIG.ROLES[role] || role });

    await Utils.withButtonLock(async () => {
      try {
        await Storage.updateUser(userId, { name, role });

        const changesSummary = changes.length
          ? changes.map(c => `${c.field}: "${c.from}" → "${c.to}"`).join(' | ')
          : 'No field changes';

        await Storage.logAction({
          actor: sa.name, actorId: sa.id,
          action: 'EDIT_USER',
          target: `${name} (${u.email})`,
          targetId: userId,
          details: `${changesSummary} | Reason: ${details}`
        });

        // Send in-app chat notification to the user (DM from superadmin)
        if (changes.length > 0) {
          try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const lines = [
              `Your profile has been updated by a Head Administrator.`
            ];
            changes.forEach(c => lines.push(`• ${c.field} changed to: ${c.to}`));
            lines.push(`Date: ${dateStr}, ${timeStr}`);

            // DM conversation ID = sorted user IDs joined by '_'
            const convId = [sa.id, userId].sort().join('_');
            await db.collection('chatMessages').add({
              conversationId: convId,
              senderId:       sa.id,
              senderName:     sa.name,
              text:           lines.join('\n'),
              createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
              readBy:         [sa.id],
              isSystemNotice: true
            });
          } catch (chatErr) {
            console.warn('[Users] Failed to send chat notification:', chatErr);
          }
        }

        if (userId === sa.id) appState.currentUser = { ...sa, name, role };
        Modals.close();
        Toast.success(`User "${name}" updated.${changes.length ? ' Chat notification sent.' : ''}`);
        this.mount();
      } catch (err) {
        showErr(err.message || 'Failed to update user.');
      }
    });
  },

  _openDeleteModal(userId) {
    const u = appState.users.find(x => x.id === userId);
    if (!u) return;

    const body = `
      <div style="margin-bottom:16px;padding:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:0.857rem;color:#991B1B">
        <strong>Warning:</strong> Deleting a user is permanent and cannot be undone.
        If this user has assigned interventions, those assignments will remain but the user account will be removed.
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

  async _submitDelete(userId) {
    const reason = document.getElementById('udReason')?.value.trim();
    const errEl  = document.getElementById('udError');

    const showErr = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!reason) return showErr('Reason is required.');

    const sa = appState.currentUser;
    const u  = appState.users.find(x => x.id === userId);
    if (!u) return showErr('User not found.');

    await Utils.withButtonLock(async () => {
      try {
        await Storage.logAction({
          actor: sa.name, actorId: sa.id,
          action: 'DELETE_USER',
          target: `${u.name} (${u.email})`,
          targetId: u.id,
          details: `Reason: ${reason}`
        });
        await Storage.deleteUser(userId);
        Modals.close();
        Toast.success(`User "${u.name}" deleted.`);
        this.mount();
      } catch (err) {
        showErr(err.message || 'Failed to delete user.');
      }
    });
  }
};
