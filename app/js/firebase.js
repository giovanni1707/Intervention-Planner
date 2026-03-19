/* ============================================================
   firebase.js — Firebase Initialization
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyBKzWCEscwlxJGoKclmhwwZ9iO1KQYmRUI",
  authDomain:        "maintenance-management-77d0e.firebaseapp.com",
  projectId:         "maintenance-management-77d0e",
  storageBucket:     "maintenance-management-77d0e.firebasestorage.app",
  messagingSenderId: "836546299162",
  appId:             "1:836546299162:web:0bca708b0cf767850658a3",
  measurementId:     "G-ZV9PGHL5SN"
};

firebase.initializeApp(firebaseConfig);

// Expose globally so storage.js / auth.js can use them
const db       = firebase.firestore();
const fbAuth   = firebase.auth();

// Enable offline persistence so cached data is served while network reconnects.
// Multi-tab support is enabled by default with synchronizeTabs.
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence only works in one tab at a time.
    console.warn('[Firestore] Persistence unavailable (multiple tabs).');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence (e.g. Safari private mode).
    console.warn('[Firestore] Persistence not supported in this browser.');
  }
});

// Collection name constants (Firestore)
const COL = {
  USERS:                'users',
  CLIENTS:              'clients',
  MACHINES:             'machines',
  INTERVENTIONS:        'interventions',
  CONTRACTS:            'contracts',
  MAINTENANCE_CONTRACTS:'maintenanceContracts',
  DELETED_JOBS:         'deletedJobs',
  ACTION_LOG:           'actionLog',
  SEEDED:               'meta'          // single doc { seeded: 'v4' }
};
