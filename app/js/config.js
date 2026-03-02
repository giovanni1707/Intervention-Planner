/* ============================================================
   config.js — Application Constants & Configuration
   ============================================================ */

const CONFIG = {
  STORAGE_KEYS: {
    USERS:         'bps_users',
    CLIENTS:       'bps_clients',
    MACHINES:      'bps_machines',
    INTERVENTIONS: 'bps_interventions',
    CONTRACTS:     'bps_contracts',
    SESSION:       'bps_session',
    SEEDED:        'bps_seeded'
  },

  STATUSES: {
    new:           { label: 'New',               color: 'badge-new' },
    planned:       { label: 'Planned',           color: 'badge-planned' },
    assigned:      { label: 'Assigned',          color: 'badge-assigned' },
    ongoing:       { label: 'On Going',          color: 'badge-ongoing' },
    pending:       { label: 'Pending',           color: 'badge-pending' },
    waiting_parts: { label: 'Waiting for Parts', color: 'badge-waiting' },
    completed:     { label: 'Completed',         color: 'badge-completed' },
    cancelled:     { label: 'Cancelled',         color: 'badge-cancelled' }
  },

  PRIORITIES: {
    low:    { label: 'Low',    color: 'badge-priority-low' },
    medium: { label: 'Medium', color: 'badge-priority-medium' },
    high:   { label: 'High',   color: 'badge-priority-high' },
    urgent: { label: 'Urgent', color: 'badge-priority-urgent' }
  },

  INTERVENTION_TYPES: {
    breakdown:  'Breakdown Repair',
    preventive: 'Preventive Maintenance',
    installation: 'Installation & Commissioning',
    support:    'Technical Support'
  },

  CONTRACT_TYPES: {
    none:   'No Contract',
    bronze: 'Bronze',
    silver: 'Silver',
    gold:   'Gold'
  },

  MACHINE_STATUSES: {
    new:            'New',
    active:         'Active',
    maintenance:    'Under Maintenance',
    decommissioned: 'Decommissioned'
  },

  ROLES: {
    admin:      'Admin',
    technician: 'Technician'
  },

  // Statuses considered "open" (not finished)
  OPEN_STATUSES: ['new', 'planned', 'assigned', 'ongoing', 'pending', 'waiting_parts'],

  // Workload threshold per technician
  MAX_WORKLOAD: 8
};
