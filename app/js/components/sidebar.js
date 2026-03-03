/* ============================================================
   components/sidebar.js — Navigation Sidebar
   ============================================================ */

const Sidebar = {
  _collapsed: localStorage.getItem('bps_sidebar_collapsed') === 'true',

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
    localStorage.setItem('bps_sidebar_collapsed', this._collapsed);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', this._collapsed);
  },

  _navItems: [
    {
      route: 'dashboard', label: 'Dashboard', adminOnly: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
    },
    {
      route: 'clients', label: 'Clients', adminOnly: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`
    },
    {
      route: 'interventions', label: 'Interventions', adminOnly: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
    },
    {
      route: 'planning', label: 'Planning', adminOnly: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    },
    {
      route: 'technicians', label: 'Technicians', adminOnly: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    },
    {
      route: 'reports', label: 'Reports', adminOnly: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
    },
    {
      route: 'settings', label: 'Settings', adminOnly: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`
    }
  ],

  render() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const user = appState.currentUser;
    const isAdmin = user && user.role === 'admin';
    const visibleItems = this._navItems.filter(item => !item.adminOnly || isAdmin);

    const navHTML = visibleItems.map(item => `
      <div class="sidebar-nav-item" data-route="${item.route}" title="${item.label}">
        ${item.icon}
        <span>${item.label}</span>
      </div>
    `).join('');

    sidebar.classList.toggle('collapsed', this._collapsed);

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <div class="sidebar-logo-badge">BPS</div>
          <div class="sidebar-logo-text">
            <div class="sidebar-logo-name">Bavarian Packaging</div>
            <div class="sidebar-logo-sub">MULTIVAC — Indian Ocean</div>
          </div>
        </div>
        <button class="sidebar-toggle" id="sidebarToggleBtn" title="Toggle Sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Navigation</div>
        ${navHTML}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${user ? Utils.getInitials(user.name) : '?'}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user ? Utils.escapeHtml(user.name) : 'Guest'}</div>
            <div class="sidebar-user-role">${user ? (CONFIG.ROLES[user.role] || user.role) : ''}</div>
          </div>
          <button class="sidebar-logout" id="logoutBtn" title="Sign Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.setActive(appState.currentRoute);
  },

  setActive(route) {
    // Remove active from all
    const items = document.querySelectorAll('.sidebar-nav-item');
    items.forEach(el => el.classList.remove('active'));

    // Add active to current
    const active = document.querySelector(`.sidebar-nav-item[data-route="${route}"]`);
    if (active) active.classList.add('active');
  },

  bindEvents() {
    // Nav item clicks
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        if (route) Router.go(route);
      });
    });

    // Toggle collapse
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this._toggleCollapse());
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        showLogin();
      });
    }
  }
};
