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
    pageSize: 20
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
    '#06B6D4'  // Cyan
  ],

  _fontSizes: {
    small:  { label: 'S', size: '18px', desc: 'Small' },
    medium: { label: 'M', size: '20px', desc: 'Medium' },
    large:  { label: 'L', size: '22px', desc: 'Large'  }
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
  }
};

Views.Settings = Settings;
