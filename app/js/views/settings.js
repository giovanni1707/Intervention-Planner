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
    autoRefresh: false,
    brightness: 100,
    sessionPersistence: 'local'
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

    // Brightness — applied to the app shell so login screen is unaffected
    const brightness = (s.brightness !== undefined) ? Math.max(30, Math.min(100, s.brightness)) : 100;
    const shell = document.getElementById('appShell');
    if (shell) {
      shell.style.filter = brightness < 100 ? `brightness(${brightness}%)` : '';
    }
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

        <!-- Card 3: Brightness -->
        <div class="setting-card">
          <div class="setting-card-title">Brightness</div>
          <div class="setting-card-desc">Reduce the overall brightness of the interface to suit your environment</div>
          <div style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div style="display:flex;align-items:center;gap:8px;font-size:0.857rem;color:var(--gray-600)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                Brightness
              </div>
              <span id="brightnessValue" style="font-size:0.929rem;font-weight:700;color:var(--blue);min-width:42px;text-align:right">${s.brightness !== undefined ? s.brightness : 100}%</span>
            </div>
            <input type="range" id="brightnessSlider"
              min="30" max="100" step="1"
              value="${s.brightness !== undefined ? s.brightness : 100}"
              class="brightness-slider"
              oninput="Settings._setBrightness(this.value)">
            <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.714rem;color:var(--gray-400)">
              <span>30% — Dim</span>
              <span>100% — Full</span>
            </div>
          </div>
          ${(s.brightness !== undefined && s.brightness < 100) ? `
          <div style="margin-top:12px">
            <button class="btn btn-ghost btn-sm" onclick="Settings._setBrightness(100)">
              Reset to Full Brightness
            </button>
          </div>` : ''}
        </div>

        <!-- Card 4: Accent Color -->
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

        <!-- Card 7: Session Persistence -->
        <div class="setting-card">
          <div class="setting-card-title">Session Persistence</div>
          <div class="setting-card-desc">Control whether your login session is preserved when you close the browser tab.</div>
          <div class="toggle-row" style="margin-top:14px">
            <div class="toggle-label">
              Stay Logged In
              <small id="sessionPersistenceHint">${s.sessionPersistence === 'local'
                ? 'Session is restored automatically when you reopen the app'
                : 'Session ends when you close the tab — each tab is independent'
              }</small>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="sessionPersistenceToggle" ${s.sessionPersistence === 'local' ? 'checked' : ''}
                     onchange="Settings._setSessionPersistence(this.checked ? 'local' : 'session')">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div style="margin-top:12px;padding:10px 12px;border-radius:var(--radius-sm);font-size:0.786rem;display:flex;align-items:flex-start;gap:8px;
               ${s.sessionPersistence === 'local'
                 ? 'background:#ECFDF5;border:1px solid #6EE7B7;color:#065F46'
                 : 'background:#FFF7ED;border:1px solid #FDBA74;color:#92400E'}"
               id="sessionPersistenceBanner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink:0;margin-top:1px">
              ${s.sessionPersistence === 'local'
                ? '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
                : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><line x1="17" y1="3" x2="17" y2="7"/>'}
            </svg>
            <span id="sessionPersistenceStatus">
              ${s.sessionPersistence === 'local'
                ? '<strong>Stay Logged In</strong> — Opening the app in a new tab or after closing will automatically restore your session.'
                : '<strong>Session Per Tab</strong> — Closing this tab will log you out. Each tab requires a separate login.'}
            </span>
          </div>
          <div style="margin-top:10px;font-size:0.75rem;color:var(--gray-400)">
            Takes effect on your next login.
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

  _setBrightness(value) {
    const level = Math.max(30, Math.min(100, parseInt(value, 10)));
    this.save({ brightness: level });

    // Update slider display without full re-mount
    const display = document.getElementById('brightnessValue');
    if (display) display.textContent = level + '%';

    const slider = document.getElementById('brightnessSlider');
    if (slider) slider.value = level;

    // Show / hide the reset button
    const card = slider?.closest('.setting-card');
    if (card) {
      let resetBtn = card.querySelector('.brightness-reset-btn');
      if (level < 100) {
        if (!resetBtn) {
          const div = document.createElement('div');
          div.style.marginTop = '12px';
          div.innerHTML = `<button class="btn btn-ghost btn-sm brightness-reset-btn" onclick="Settings._setBrightness(100)">Reset to Full Brightness</button>`;
          card.appendChild(div);
        }
      } else {
        resetBtn?.parentElement?.remove();
      }
    }
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

  _setSessionPersistence(mode) {
    // Revert the toggle visually — change only applied after password confirmation
    const toggle = document.getElementById('sessionPersistenceToggle');
    if (toggle) toggle.checked = !toggle.checked;

    // Open password confirmation modal
    const body = `
      <div style="margin-bottom:14px;padding:10px 14px;background:#FFF7ED;border:1px solid #FDBA74;border-radius:var(--radius-sm);display:flex;align-items:flex-start;gap:8px;font-size:0.857rem;color:#92400E">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="flex-shrink:0;margin-top:1px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Changing your session setting requires password confirmation.
      </div>
      <div class="form-group">
        <label class="form-label">Current Password <span class="required">*</span></label>
        <input type="password" id="sessionPwdInput" class="form-input" placeholder="Enter your password" autocomplete="current-password">
      </div>
      <div id="sessionPwdError" class="error-msg hidden"></div>
    `;
    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" id="sessionPwdConfirmBtn" onclick="Settings._confirmSessionPersistence('${mode}')">Confirm</button>
    `;
    Modals.open('Confirm Password', body, footer, {
      onOpen: () => {
        const input = document.getElementById('sessionPwdInput');
        if (input) {
          input.focus();
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') Settings._confirmSessionPersistence(mode);
          });
        }
      }
    });
  },

  async _confirmSessionPersistence(mode) {
    const input  = document.getElementById('sessionPwdInput');
    const errEl  = document.getElementById('sessionPwdError');
    const btn    = document.getElementById('sessionPwdConfirmBtn');
    const password = input?.value;

    if (!password) {
      if (errEl) { errEl.textContent = 'Please enter your password.'; errEl.classList.remove('hidden'); }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }
    if (errEl) errEl.classList.add('hidden');

    try {
      const email = appState.currentUser?.email;
      await fbAuth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm'; }
      if (errEl) {
        errEl.textContent = 'Incorrect password. Please try again.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // Password verified — apply the change
    Modals.close();
    this.save({ sessionPersistence: mode });
    const isLocal = mode === 'local';

    const toggle = document.getElementById('sessionPersistenceToggle');
    if (toggle) toggle.checked = isLocal;

    const hint = document.getElementById('sessionPersistenceHint');
    if (hint) hint.textContent = isLocal
      ? 'Session is restored automatically when you reopen the app'
      : 'Session ends when you close the tab — each tab is independent';

    const banner = document.getElementById('sessionPersistenceBanner');
    if (banner) {
      banner.style.background   = isLocal ? '#ECFDF5' : '#FFF7ED';
      banner.style.borderColor  = isLocal ? '#6EE7B7' : '#FDBA74';
      banner.style.color        = isLocal ? '#065F46' : '#92400E';
    }

    const status = document.getElementById('sessionPersistenceStatus');
    if (status) status.innerHTML = isLocal
      ? '<strong>Stay Logged In</strong> — Opening the app in a new tab or after closing will automatically restore your session.'
      : '<strong>Session Per Tab</strong> — Closing this tab will log you out. Each tab requires a separate login.';

    const svg = banner?.querySelector('svg');
    if (svg) svg.innerHTML = isLocal
      ? '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
      : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><line x1="17" y1="3" x2="17" y2="7"/>';

    Toast.success(`Session mode updated to "${isLocal ? 'Stay Logged In' : 'Session Per Tab'}". Takes effect on next login.`);
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

};

Views.Settings = Settings;
