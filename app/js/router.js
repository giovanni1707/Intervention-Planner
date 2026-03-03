/* ============================================================
   router.js — Hash-based SPA Router
   ============================================================ */

const ROUTES = {
  dashboard:     () => Views.Dashboard.mount(),
  clients:       () => Views.Clients.mount(),
  interventions: () => Views.Interventions.mount(),
  planning:      () => Views.Planning.mount(),
  technicians:   () => Views.Technicians.mount(),
  reports:       () => Views.Reports.mount(),
  settings:      () => Views.Settings.mount()
};

// Routes accessible by technicians only
const TECH_ROUTES = ['interventions', 'settings'];

const Router = {
  _current: null,

  init() {
    window.addEventListener('hashchange', () => this._navigate());
    this._navigate();
  },

  go(route) {
    window.location.hash = '#/' + route;
  },

  _navigate() {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const route = Object.keys(ROUTES).includes(hash) ? hash : 'dashboard';

    // Role-based access: technicians can only access their interventions
    const user = appState.currentUser;
    if (user && user.role === 'technician' && !TECH_ROUTES.includes(route)) {
      this.go('interventions');
      return;
    }

    this._current = route;
    appState.currentRoute = route;
    Sidebar.setActive(route);

    const view = ROUTES[route] || ROUTES['dashboard'];
    try {
      view();
    } catch (err) {
      console.error('[Router] Error mounting view:', route, err);
      document.getElementById('mainContent').innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--gray-400)">
          <p style="font-size:1.2rem;margin-bottom:8px">Error loading view</p>
          <p style="font-size:0.857rem">${Utils.escapeHtml(err.message)}</p>
        </div>
      `;
    }
  },

  getCurrent() {
    return this._current;
  }
};
