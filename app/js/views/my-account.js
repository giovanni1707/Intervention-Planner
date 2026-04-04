/* ============================================================
   views/my-account.js — My Account (Profile & Password)
   ============================================================ */

window.Views = window.Views || {};

Views.MyAccount = {

  mount() {
    const user = appState.currentUser;
    if (!user) { Router.go('dashboard'); return; }

    const content = document.getElementById('mainContent');
    content.innerHTML = this._template(user);
    this._bindEvents();
  },

  _template(user) {
    const roleLabel  = CONFIG.ROLES[user.role] || user.role;
    const roleColor  = user.role === 'superadmin' ? 'var(--purple)' :
                       user.role === 'admin'       ? 'var(--blue)'   : 'var(--green)';
    const initials   = Utils.getInitials(user.name);
    const memberSince = Utils.formatDate(user.createdAt);

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">My Account</h1>
          <p class="page-subtitle">Manage your profile and security settings</p>
        </div>
      </div>

      <div class="acc-layout">

        <!-- LEFT: Avatar + overview -->
        <div class="acc-sidebar">
          <div class="card acc-profile-card">
            <div class="acc-avatar-wrap">
              <div class="acc-avatar" id="accAvatarDisplay" style="background:${user.photoURL ? 'transparent' : roleColor}">
                ${Utils.userAvatarHtml(user)}
              </div>
              <label class="acc-avatar-edit-btn" for="accPhotoInput" title="Change profile picture">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </label>
              <input type="file" id="accPhotoInput" accept="image/*" style="display:none">
            </div>
            <div class="acc-name" id="accNameDisplay">${Utils.escapeHtml(user.name)}</div>
            <div class="acc-role-badge" style="background:${roleColor}22;color:${roleColor}">${Utils.escapeHtml(roleLabel)}</div>
            <div class="acc-email">${Utils.escapeHtml(user.email)}</div>
            <div class="acc-since">Member since ${memberSince}</div>

            <div class="acc-stats">
              <div class="acc-stat">
                <div class="acc-stat-val" id="accStatAssigned">—</div>
                <div class="acc-stat-label">Assigned</div>
              </div>
              <div class="acc-stat">
                <div class="acc-stat-val" id="accStatCompleted">—</div>
                <div class="acc-stat-label">Completed</div>
              </div>
              <div class="acc-stat">
                <div class="acc-stat-val" id="accStatRate">—</div>
                <div class="acc-stat-label">Rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Edit forms -->
        <div class="acc-main">

          <!-- Profile information (read-only) -->
          <div class="card" style="margin-bottom:20px">
            <div class="card-header">
              <span class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:6px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile Information
              </span>
            </div>
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--blue-light);border:1px solid var(--blue);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--blue);margin-bottom:16px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Profile details can only be changed by the <strong>&nbsp;Head Administrator</strong>.
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-input" value="${Utils.escapeHtml(user.name)}" disabled style="opacity:0.7;cursor:not-allowed">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-input" value="${Utils.escapeHtml(user.email)}" disabled style="opacity:0.7;cursor:not-allowed">
                </div>
              </div>
            </div>
          </div>

          <!-- Password change -->
          <div class="card" style="margin-bottom:20px">
            <div class="card-header">
              <span class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Change Password
              </span>
            </div>
            <div class="card-body">
              <p style="font-size:0.857rem;color:var(--gray-600);margin:0 0 16px">
                For your security, password changes are handled via a confirmation email.
                Click the button below and we'll send a secure reset link to your registered address.
                Your current password stays active until you complete the process through the link.
              </p>
              <div id="accPwMsg"></div>
              <button class="btn btn-primary" id="accSavePw">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Send Password Reset Link
              </button>
            </div>
          </div>

          <!-- Activity summary -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:6px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                My Recent Activity
              </span>
            </div>
            <div id="accRecentActivity"></div>
          </div>

        </div>
      </div>
    `;
  },

  _bindEvents() {
    const user = appState.currentUser;
    this._renderStats(user);
    this._renderRecentActivity(user);

    // Photo upload
    document.getElementById('accPhotoInput')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._handlePhotoUpload(file);
    });

    // Send password reset link
    document.getElementById('accSavePw')?.addEventListener('click', () => this._sendPasswordReset());
  },

  _renderStats(user) {
    const interventions = appState.interventions.filter(i => Utils.getTechIds(i).includes(user.id));
    const completed = interventions.filter(i => i.status === 'completed').length;
    const rate = Utils.percent(completed, interventions.length);

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('accStatAssigned',  interventions.length);
    el('accStatCompleted', completed);
    el('accStatRate',      interventions.length ? rate + '%' : '—');
  },

  _renderRecentActivity(user) {
    const container = document.getElementById('accRecentActivity');
    if (!container) return;

    const mine = Utils.sortBy(
      appState.interventions.filter(i => Utils.getTechIds(i).includes(user.id)),
      'createdAt', 'desc'
    ).slice(0, 8);

    if (mine.length === 0) {
      container.innerHTML = `<div class="dash-activity-empty">No interventions assigned to you yet.</div>`;
      return;
    }

    const rows = mine.map(i => {
      const client  = appState.clients.find(c => c.id === i.clientId);
      const machine = appState.machines.find(m => m.id === i.machineId);
      return `
        <div class="dash-act-item">
          <div class="dash-act-dot ${i.status === 'completed' ? 'dash-act-dot-green' : i.priority === 'urgent' ? 'dash-act-dot-red' : 'dash-act-dot-blue'}"></div>
          <div class="dash-act-body">
            <div class="dash-act-title">${Utils.escapeHtml(client?.name || '—')} — ${Utils.escapeHtml(machine?.model || '—')}</div>
            <div class="dash-act-meta">${Utils.getStatusBadge(i.status, i)} <span style="margin-left:4px">${Utils.formatRelative(i.createdAt)}</span></div>
          </div>
          <button class="btn btn-ghost btn-sm btn-icon dash-act-view" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>`;
    }).join('');

    container.innerHTML = rows;
  },

  _handlePhotoUpload(file) {
    if (!file.type.startsWith('image/')) {
      Toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('Image must be smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = async () => {
        // Resize to max 256×256 via canvas
        const size   = 256;
        const canvas = document.createElement('canvas');
        canvas.width  = size;
        canvas.height = size;
        const ctx    = canvas.getContext('2d');
        // Cover-crop: centre the image
        const scale  = Math.max(size / img.width, size / img.height);
        const sw     = size / scale;
        const sh     = size / scale;
        const sx     = (img.width  - sw) / 2;
        const sy     = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        try {
          const user = appState.currentUser;
          await Storage.updateUser(user.id, { photoURL: dataUrl });
          appState.currentUser = { ...user, photoURL: dataUrl };

          // Update avatar display
          const avatarEl = document.getElementById('accAvatarDisplay');
          if (avatarEl) {
            avatarEl.style.background = 'transparent';
            avatarEl.innerHTML = Utils.userAvatarHtml(appState.currentUser);
          }
          Sidebar.render();
          Toast.success('Profile picture updated.');
        } catch (err) {
          console.error('[MyAccount] photo upload error:', err);
          Toast.error('Failed to save profile picture.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  async _sendPasswordReset() {
    const btn   = document.getElementById('accSavePw');
    const msgEl = document.getElementById('accPwMsg');
    const user  = appState.currentUser;

    btn.disabled = true;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Sending…`;

    try {
      await fbAuth.sendPasswordResetEmail(user.email);

      await Storage.logAction({
        action:   'REQUEST_PASSWORD_RESET',
        actor:    user.name,
        target:   `${user.name} (${user.email})`,
        targetId: user.id,
        details:  'User requested a password reset link from My Account'
      });

      // Send in-app chat notification to the user's own DM with the superadmin
      try {
        const now     = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const sa      = appState.users.find(u => u.role === 'superadmin');
        if (sa) {
          const convId = [user.id, sa.id].sort().join('_');
          await db.collection('chatMessages').add({
            conversationId: convId,
            senderId:       sa.id,
            senderName:     sa.name,
            text:           `A password reset was initiated for your account on ${dateStr} at ${timeStr}.\nIf you did not request this, please contact your administrator immediately.`,
            createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
            readBy:         [sa.id],
            isSystemNotice: true
          });
        }
      } catch (chatErr) {
        console.warn('[MyAccount] Failed to send chat notification:', chatErr);
      }

      this._showMsg(msgEl,
        `A confirmation email has been sent to ${user.email}. Please click the link in the email to set your new password. Your current password remains active until you complete the process.`,
        'success'
      );
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Resend Link`;
      btn.disabled = false;
    } catch (err) {
      console.error('[MyAccount] password reset error:', err);
      let msg = 'Failed to send reset email. Please try again.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many requests. Please wait a moment before trying again.';
      this._showMsg(msgEl, msg, 'danger');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Send Password Reset Link`;
      btn.disabled = false;
    }
  },

  _showMsg(el, text, type) {
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}" style="margin-bottom:12px"><span>${Utils.escapeHtml(text)}</span></div>`;
    setTimeout(() => { if (el) el.innerHTML = ''; }, 5000);
  }
};
