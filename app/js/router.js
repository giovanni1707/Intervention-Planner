/* ============================================================
   router.js — Hash-based SPA Router
   ============================================================ */

const ROUTES = {
  dashboard:     () => Views.Dashboard.mount(),
  clients:       () => Views.Clients.mount(),
  interventions: () => Views.Interventions.mount(),
  planning:      () => Views.Planning.mount(),
  technicians:   () => Views.Technicians.mount(),
  users:         () => Views.Users.mount(),
  reports:       () => Views.Reports.mount(),
  'job-tracker': () => Views.JobTracker.mount(),
  settings:      () => Views.Settings.mount()
};

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
