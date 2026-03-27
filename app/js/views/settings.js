/* ============================================================
   views/settings.js — Application Settings Page
   ============================================================ */

window.Views = window.Views || {};

const Settings = {
  _key: 'bps_settings',

  _defaults: {
    fontSize: 'medium',
    darkMode: false,
    accentColor: '#0066FF',
    sidebarTheme: 'navy',
    pageSize: 20,
    autoRefresh: false
  },

  _pageSizeOptions: [10, 20, 50, 100],

  _sidebarThemes: {
    navy:  { label: 'Dark Navy',  color: '#0D1F3C' },
    gray:  { label: 'Dark Gray',  color: '#1F2937' },
    blue:  { label: 'Deep Blue',  color: '#1E3A5F' }
  },

  _accentPresets: [
    '#0066FF', // Blue (default)
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#6366F1'  // Indigo
  ],

  _fontSizes: {
    small:  { label: 'S', size: '14px', desc: 'Small' },
    medium: { label: 'M', size: '16px', desc: 'Medium' },
    large:  { label: 'L', size: '18px', desc: 'Large'  }
  },

  /* ── STORAGE ─────────────────────────────────────────────── */
  get() {
    try {
      const stored = JSON.parse(localStorage.getItem(this._key));
      return Object.assign({}, this._defaults, stored);
    } catch {
      return Object.assign({}, this._defaults);
    }
  },

  save(updates) {
    const current = this.get();
    const merged  = Object.assign({}, current, updates);
    localStorage.setItem(this._key, JSON.stringify(merged));
    this.apply(merged);
    return merged;
  },

  reset() {
    localStorage.removeItem(this._key);
    this.apply(this._defaults);
  },

  /* ── APPLY ───────────────────────────────────────────────── */
  apply(settings) {
    const s = settings || this.get();

    // Font size
    const size = (this._fontSizes[s.fontSize] || this._fontSizes.medium).size;
    document.documentElement.style.fontSize = size;

    // Dark mode
    document.body.classList.toggle('dark-mode', !!s.darkMode);

    // Accent color
    const accent = s.accentColor || this._defaults.accentColor;
    document.documentElement.style.setProperty('--blue', accent);
    document.documentElement.style.setProperty('--blue-hover', this._darken(accent));
    document.documentElement.style.setProperty('--blue-light', this._lighten(accent));

    // Sidebar theme
    const theme = this._sidebarThemes[s.sidebarTheme];
    const sidebarColor = theme ? theme.color : this._sidebarThemes.navy.color;
    document.documentElement.style.setProperty('--sidebar-bg', sidebarColor);
  },

  /* ── COLOR HELPERS ───────────────────────────────────────── */
  _darken(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (n >> 16) - 30);
    const g = Math.max(0, ((n >> 8) & 0xFF) - 30);
    const b = Math.max(0, (n & 0xFF) - 30);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  _lighten(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 0xFF;
    const g = (n >> 8) & 0xFF;
    const b = n & 0xFF;
    const lr = Math.min(255, Math.round(r + (255 - r) * 0.9));
    const lg = Math.min(255, Math.round(g + (255 - g) * 0.9));
    const lb = Math.min(255, Math.round(b + (255 - b) * 0.9));
    return `#${((1 << 24) + (lr << 16) + (lg << 8) + lb).toString(16).slice(1)}`;
  },

  /* ── MOUNT ───────────────────────────────────────────────── */
  mount() {
    const content = document.getElementById('mainContent');
    const s = this.get();
    content.innerHTML = this._template(s);
    this._bindEvents(s);
  },

  _template(s) {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Customize your application appearance and preferences</p>
        </div>
      </div>

      <div class="settings-grid">

        <!-- Card 1: Typography -->
        <div class="setting-card">
          <div class="setting-card-title">Typography</div>
          <div class="setting-card-desc">Choose the text size across the application</div>
          <div class="size-btn-group">
            ${Object.entries(this._fontSizes).map(([key, f]) => `
              <button class="size-btn ${s.fontSize === key ? 'active' : ''}"
                      data-size="${key}"
                      onclick="Settings._setFontSize('${key}')">
                <div style="font-size:${f.size};font-weight:600;line-height:1">${f.label}</div>
                <div style="font-size:11px;margin-top:4px;opacity:0.7">${f.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Card 2: Dark Mode -->
        <div class="setting-card">
          <div class="setting-card-title">Theme</div>
          <div class="setting-card-desc">Switch between light and dark interface</div>
          <div class="toggle-row">
            <div class="toggle-label">
              Dark Mode
              <small>Reduces eye strain in low-light environments</small>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="darkModeToggle" ${s.darkMode ? 'checked' : ''}
                     onchange="Settings._setDarkMode(this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Card 3: Accent Color -->
        <div class="setting-card">
          <div class="setting-card-title">Accent Color</div>
          <div class="setting-card-desc">Color used for buttons, links, and highlights</div>
          <div class="color-swatches" id="accentSwatches">
            ${this._accentPresets.map(color => `
              <button class="color-swatch ${s.accentColor === color ? 'active' : ''}"
                      style="background:${color}"
                      title="${color}"
                      data-color="${color}"
                      onclick="Settings._setAccentColor('${color}')"></button>
            `).join('')}
          </div>
          <div class="color-input-row">
            <label for="accentCustom">Custom:</label>
            <input type="color" id="accentCustom" class="color-picker"
                   value="${s.accentColor}"
                   oninput="Settings._setAccentColor(this.value)">
            <span style="font-size:0.857rem;color:var(--gray-500)" id="accentHexDisplay">${s.accentColor}</span>
          </div>
        </div>

        <!-- Card 4: Sidebar Theme -->
        <div class="setting-card">
          <div class="setting-card-title">Sidebar</div>
          <div class="setting-card-desc">Choose the sidebar background color</div>
          <div class="sidebar-theme-grid" id="sidebarThemeGrid">
            ${Object.entries(this._sidebarThemes).map(([key, theme]) => `
              <div class="sidebar-theme-card ${s.sidebarTheme === key ? 'active' : ''}"
                   data-theme="${key}"
                   onclick="Settings._setSidebarTheme('${key}')">
                <div class="sidebar-theme-preview" style="background:${theme.color}"></div>
                <div class="sidebar-theme-label">${theme.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Card 5: Table Pagination -->
        <div class="setting-card">
          <div class="setting-card-title">Table Pagination</div>
          <div class="setting-card-desc">Number of rows displayed per page in all tables</div>
          <div class="size-btn-group">
            ${this._pageSizeOptions.map(n => `
              <button class="size-btn ${s.pageSize === n ? 'active' : ''}"
                      data-pagesize="${n}"
                      onclick="Settings._setPageSize(${n})">
                <div style="font-size:18px;font-weight:700;line-height:1">${n}</div>
                <div style="font-size:11px;margin-top:4px;opacity:0.7">rows</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Card 6: Auto-Refresh -->
        <div class="setting-card">
          <div class="setting-card-title">Auto-Refresh</div>
          <div class="setting-card-desc">Automatically re-render the current view every 5 minutes so changes made by other users become visible without a manual refresh.</div>
          <div class="toggle-row" style="margin-top:14px">
            <div class="toggle-label">
              Auto-Refresh
              <small>Skipped while a modal is open or you are typing in a field</small>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="autoRefreshToggle" ${s.autoRefresh ? 'checked' : ''}
                     onchange="Settings._setAutoRefresh(this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div style="margin-top:10px;font-size:0.786rem;display:flex;align-items:center;gap:6px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="flex-shrink:0;color:var(--gray-400)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="arStatusIndicator" style="color:${s.autoRefresh ? 'var(--green)' : 'var(--gray-400)'}">
              ${s.autoRefresh ? 'Active — refreshes every 5 minutes' : 'Off'}
            </span>
          </div>
        </div>

        <!-- Card 7: Change Password -->
        <div class="setting-card" style="grid-column:1/-1">
          <div class="setting-card-title">Change Password</div>
          <div class="setting-card-desc">Update your account password. You will be logged out after a successful change.</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:14px">

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:0.857rem">Current Password</label>
              <div style="position:relative">
                <input type="password" id="cpCurrent" class="form-input" placeholder="Enter current password" style="padding-right:40px">
                <button type="button" onclick="Settings._togglePw('cpCurrent','cpCurrentEye')"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);padding:0;line-height:1" title="Show/Hide">
                  <svg id="cpCurrentEye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:0.857rem">New Password</label>
              <div style="position:relative">
                <input type="password" id="cpNew" class="form-input" placeholder="8–10 characters" style="padding-right:40px" oninput="Settings._updateStrength()">
                <button type="button" onclick="Settings._togglePw('cpNew','cpNewEye')"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);padding:0;line-height:1" title="Show/Hide">
                  <svg id="cpNewEye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div style="margin-top:6px">
                <div style="display:flex;gap:4px;height:4px">
                  <div id="cpBar1" style="flex:1;border-radius:2px;background:var(--gray-200);transition:background 0.2s"></div>
                  <div id="cpBar2" style="flex:1;border-radius:2px;background:var(--gray-200);transition:background 0.2s"></div>
                  <div id="cpBar3" style="flex:1;border-radius:2px;background:var(--gray-200);transition:background 0.2s"></div>
                  <div id="cpBar4" style="flex:1;border-radius:2px;background:var(--gray-200);transition:background 0.2s"></div>
                </div>
                <div id="cpStrengthLabel" style="font-size:0.75rem;color:var(--gray-400);margin-top:3px"></div>
              </div>
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:0.857rem">Confirm New Password</label>
              <div style="position:relative">
                <input type="password" id="cpConfirm" class="form-input" placeholder="Re-enter new password" style="padding-right:40px">
                <button type="button" onclick="Settings._togglePw('cpConfirm','cpConfirmEye')"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);padding:0;line-height:1" title="Show/Hide">
                  <svg id="cpConfirmEye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

          </div>
          <div style="margin-top:16px">
            <button class="btn btn-primary" onclick="Settings._changePassword()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="margin-right:6px;vertical-align:-2px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Update Password
            </button>
          </div>
        </div>

      </div>

      <!-- Reset -->
      <div style="text-align:center;padding:8px 0 24px">
        <button class="btn btn-ghost" onclick="Settings._confirmReset()"
                style="color:var(--red)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:-2px">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.87"/>
          </svg>
          Reset to Defaults
        </button>
      </div>
    `;
  },

  _bindEvents(s) {
    // No additional event binding needed — all via inline onclick handlers
  },

  /* ── SETTERS (called from inline events) ─────────────────── */
  _setFontSize(size) {
    this.save({ fontSize: size });

    // Update active button state
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
  },

  _setDarkMode(enabled) {
    this.save({ darkMode: enabled });
  },

  _setAccentColor(color) {
    this.save({ accentColor: color });

    // Update swatch active states
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === color);
    });

    // Update custom picker + hex display
    const picker = document.getElementById('accentCustom');
    const hexDisplay = document.getElementById('accentHexDisplay');
    if (picker) picker.value = color;
    if (hexDisplay) hexDisplay.textContent = color;
  },

  _setSidebarTheme(themeKey) {
    this.save({ sidebarTheme: themeKey });

    // Update card active states
    document.querySelectorAll('.sidebar-theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === themeKey);
    });
  },

  _setPageSize(n) {
    this.save({ pageSize: n });

    document.querySelectorAll('.size-btn[data-pagesize]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.pagesize) === n);
    });
  },

  _setAutoRefresh(enabled) {
    this.save({ autoRefresh: enabled });
    if (typeof AutoRefresh !== 'undefined') {
      AutoRefresh.onSettingChange(enabled);
    }
    // Update status indicator without full re-mount
    const indicator = document.getElementById('arStatusIndicator');
    if (indicator) {
      indicator.textContent = enabled ? 'Active — refreshes every 5 minutes' : 'Off';
      indicator.style.color  = enabled ? 'var(--green)' : 'var(--gray-400)';
    }
  },

  _confirmReset() {
    Modals.confirm(
      'This will reset all appearance settings (font size, theme, colors) to their defaults.',
      'Reset Settings?'
    ).then(confirmed => {
      if (!confirmed) return;
      this.reset();
      Toast.success('Settings reset to defaults');
      this.mount();
    });
  },

  /* ── CHANGE PASSWORD ─────────────────────────────────────── */
  _togglePw(inputId, eyeId) {
    const input = document.getElementById(inputId);
    const eye   = document.getElementById(eyeId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    if (eye) eye.innerHTML = isHidden
      ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  },

  _updateStrength() {
    const pw = document.getElementById('cpNew')?.value || '';
    const bars = [1,2,3,4].map(i => document.getElementById(`cpBar${i}`));
    const label = document.getElementById('cpStrengthLabel');
    if (!bars[0]) return;

    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 10) score++;

    const levels = [
      { color: 'var(--red)',    text: 'Weak' },
      { color: '#F59E0B',       text: 'Fair' },
      { color: '#3B82F6',       text: 'Good' },
      { color: '#10B981',       text: 'Strong' }
    ];
    const level = pw.length === 0 ? null : levels[Math.min(score, 3)];
    bars.forEach((bar, i) => {
      bar.style.background = level && i < score ? level.color : 'var(--gray-200)';
    });
    if (label) label.textContent = level ? level.text : '';
    if (label) label.style.color = level ? level.color : 'var(--gray-400)';
  },

  async _changePassword() {
    const current = document.getElementById('cpCurrent')?.value;
    const npw     = document.getElementById('cpNew')?.value;
    const confirm = document.getElementById('cpConfirm')?.value;

    if (!current || !npw || !confirm) {
      Toast.error('All three fields are required.'); return;
    }

    const user = appState.currentUser;
    if (npw.length < 8 || npw.length > 10) {
      Toast.error('Password must be between 8 and 10 characters.'); return;
    }
    if (!/[A-Za-z]/.test(npw) || !/[0-9]/.test(npw)) {
      Toast.error('Password must contain both letters and numbers.'); return;
    }
    if (npw !== confirm) {
      Toast.error('Passwords do not match.'); return;
    }

    try {
      // Re-authenticate with current password, then update
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, current);
      await fbAuth.currentUser.reauthenticateWithCredential(credential);
      await fbAuth.currentUser.updatePassword(npw);

      await Storage.logAction({
        action:  'CHANGE_PASSWORD',
        actor:   user.name,
        target:  `${user.name} (${user.email})`,
        targetId: user.id,
        details: 'User changed their own password'
      });

      Toast.success('Password successfully updated. Logging you out…');

      setTimeout(() => {
        Auth.logout();
        window.location.reload();
      }, 1800);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Toast.error('Current password is incorrect.');
      } else {
        Toast.error(err.message || 'Failed to change password.');
      }
    }
  }
};

Views.Settings = Settings;
