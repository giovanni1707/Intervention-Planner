/* ============================================================
   state.js — Global Reactive Application State
   ============================================================ */

// Global reactive state using DOM Helpers ReactiveUtils
const appState = ReactiveUtils.state({
  currentUser: null,
  currentRoute: 'dashboard',

  // Data collections (loaded from localStorage)
  clients: [],
  machines: [],
  interventions: [],
  users: [],
  contracts: [],

  // Filter state for Interventions view
  filters: {
    status: 'all',
    priority: 'all',
    type: 'all',
    technicianId: 'all',
    clientId: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    jobNumber: ''
  },

  // UI preferences
  ui: {
    interventionView: 'table'  // 'table' | 'kanban'
  }
});

// ── DATA LOADERS ───────────────────────────────────────────
function loadStateFromStorage() {
  appState.clients       = Storage.getClients();
  appState.machines      = Storage.getMachines();
  appState.interventions = Storage.getInterventions();
  appState.users         = Storage.getUsers();
  appState.contracts     = Storage.getContracts();
}

function refreshClients() {
  appState.clients = Storage.getClients();
}

function refreshMachines() {
  appState.machines = Storage.getMachines();
}

function refreshInterventions() {
  appState.interventions = Storage.getInterventions();
}

function refreshUsers() {
  appState.users = Storage.getUsers();
}

// ── FILTER HELPERS ─────────────────────────────────────────
function resetFilters() {
  appState.filters = {
    status: 'all',
    priority: 'all',
    type: 'all',
    technicianId: 'all',
    clientId: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    jobNumber: ''
  };
}
