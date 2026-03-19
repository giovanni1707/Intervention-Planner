/* ============================================================
   state.js — Global Reactive Application State
   ============================================================ */

const appState = ReactiveUtils.state({
  currentUser:  null,
  currentRoute: 'dashboard',

  // Data collections (kept in sync via Firestore onSnapshot)
  clients:              [],
  machines:             [],
  interventions:        [],
  users:                [],
  contracts:            [],
  maintenanceContracts: [],

  // Filter state for Interventions view
  filters: {
    status:      'all',
    priority:    'all',
    type:        'all',
    technicianId:'all',
    clientId:    'all',
    dateFrom:    '',
    dateTo:      '',
    search:      '',
    jobNumber:   '',
    district:    'all'
  },

  // UI preferences
  ui: {
    interventionView: 'table'  // 'table' | 'kanban'
  }
});

// ── SNAPSHOT UNSUBSCRIBE HANDLES ───────────────────────────
// Store these so we can detach listeners on logout
const _unsubs = {};

/**
 * Attach onSnapshot listeners for all core collections.
 * Each listener keeps appState in sync and triggers a re-render
 * of the currently active view whenever data changes.
 */
function attachListeners() {
  const collections = [
    { col: COL.CLIENTS,                key: 'clients'              },
    { col: COL.MACHINES,               key: 'machines'             },
    { col: COL.INTERVENTIONS,          key: 'interventions'        },
    { col: COL.USERS,                  key: 'users'                },
    { col: COL.CONTRACTS,              key: 'contracts'            },
    { col: COL.MAINTENANCE_CONTRACTS,  key: 'maintenanceContracts' }
  ];

  collections.forEach(({ col, key }) => {
    if (_unsubs[key]) _unsubs[key](); // detach previous if any
    _unsubs[key] = db.collection(col).onSnapshot(snap => {
      appState[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Re-render the active view after data arrives
      if (typeof Router !== 'undefined' && Router._current) {
        Router._rerender();
      }
    }, err => {
      console.error(`[onSnapshot] ${col}:`, err);
    });
  });
}

/** Detach all listeners (call on logout) */
function detachListeners() {
  Object.values(_unsubs).forEach(unsub => unsub && unsub());
  Object.keys(_unsubs).forEach(k => delete _unsubs[k]);
}

// ── INITIAL LOAD (one-time fetch for startup speed) ────────
async function loadStateFromStorage() {
  const [clients, machines, interventions, users, contracts, maintenanceContracts] = await Promise.all([
    Storage.getClients(),
    Storage.getMachines(),
    Storage.getInterventions(),
    Storage.getUsers(),
    Storage.getContracts(),
    Storage.getMaintenanceContracts()
  ]);
  appState.clients              = clients;
  appState.machines             = machines;
  appState.interventions        = interventions;
  appState.users                = users;
  appState.contracts            = contracts;
  appState.maintenanceContracts = maintenanceContracts;
}

// ── MANUAL REFRESH HELPERS (still used by some views) ──────
async function refreshClients() {
  appState.clients = await Storage.getClients();
}

async function refreshMachines() {
  appState.machines = await Storage.getMachines();
}

async function refreshInterventions() {
  appState.interventions = await Storage.getInterventions();
}

async function refreshUsers() {
  appState.users = await Storage.getUsers();
}

// ── FILTER HELPERS ─────────────────────────────────────────
function resetFilters() {
  appState.filters = {
    status:      'all',
    priority:    'all',
    type:        'all',
    technicianId:'all',
    clientId:    'all',
    dateFrom:    '',
    dateTo:      '',
    search:      '',
    jobNumber:   '',
    district:    'all'
  };
}
