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
    SEEDED:        'bps_seeded',
    DELETED_JOBS:           'bps_deleted_jobs',
    ACTION_LOG:             'bps_action_log',
    MAINTENANCE_CONTRACTS:  'bps_maintenance_contracts'
  },

  STATUSES: {
    new:           { label: 'New',               color: 'badge-new' },
    tentative:     { label: 'Tentative',         color: 'badge-tentative' },
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
    breakdown:    'Breakdown Repair',
    preventive:   'Preventive Maintenance',
    pmc:          'PMC – Preventive Maintenance Contract',
    installation: 'Installation & Commissioning',
    support:      'Technical Support'
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
    superadmin: 'Head Administrator',
    admin:      'Admin',
    technician: 'Technician'
  },

  // Statuses considered "open" (not finished)
  OPEN_STATUSES: ['new', 'tentative', 'assigned', 'ongoing', 'pending', 'waiting_parts'],


  DISTRICTS: [
    'Black River District',
    'Flacq District',
    'Grand Port District',
    'Moka District',
    'Pamplemousses District',
    'Plaines Wilhems District',
    'Port Louis District',
    'Rivière du Rempart District',
    'Savanne District'
  ],

  // Locations per district — used for Location Address autocomplete
  DISTRICT_LOCATIONS: {
    'Black River District': [
      'Albion', 'Bambous', 'Cascavelle', 'Chamarel', 'Flic en Flac',
      'Grande Rivière Noire', 'Gris Gris', 'La Preneuse', 'Le Morne',
      'Petite Rivière', 'Rivière Noire', 'Tamarin', 'Wolmar',
      'Zone Industrielle Bambous', 'Zone Industrielle Petite Rivière'
    ],
    'Flacq District': [
      'Bel Air Rivière Sèche', 'Centre de Flacq', 'Deux Frères', 'Flacq',
      'Goodlands', 'Haute Rive', 'L\'Avenir', 'Lalmatie',
      'Laventure', 'Olivia', 'Poste de Flacq', 'Poste Lafayette',
      'Quatre Cocos', 'Rivière des Créoles', 'Saint Julien',
      'Trou d\'Eau Douce', 'Union Vale', 'Vacoas-Phoenix Industrial Zone'
    ],
    'Grand Port District': [
      'Beau Vallon', 'Burnt Village', 'Camp Diable', 'Deux Frères',
      'Grand Port', 'Ile aux Aigrettes', 'Mahebourg', 'Mare d\'Albert',
      'Plaine Magnien', 'Providence', 'Rivière des Anguilles',
      'Rose Belle', 'Saint Hubert', 'Vieux Grand Port',
      'Zone Industrielle Mahebourg', 'Zone Industrielle Rose Belle'
    ],
    'Moka District': [
      'Bassin', 'Belle Rose', 'Cascades', 'Coromandel', 'Ebène',
      'Ebène CyberCity', 'Highlands', 'Moka', 'Montagne Ory',
      'Providence', 'Quartier Militaire', 'Reduit', 'Saint Pierre',
      'Terre Rouge', 'Trou aux Cerfs', 'Vacoas',
      'Zone Industrielle Coromandel', 'Zone Industrielle Ebène'
    ],
    'Pamplemousses District': [
      'Amaury', 'Balaclava', 'Cap Malheureux', 'Calebasses',
      'Crève Coeur', 'Fond du Sac', 'Grand Baie', 'Grand Gaube',
      'Goodlands', 'La Croisette', 'Mapou', 'Mon Choisy',
      'Notre Dame', 'Pamplemousses', 'Piton', 'Plaine des Papayes',
      'Riche Terre', 'Rivière du Rempart', 'Triolet',
      'Zone Industrielle Riche Terre', 'Zone Industrielle Pamplemousses'
    ],
    'Plaines Wilhems District': [
      'Beau Bassin', 'Beau Bassin-Rose Hill', 'Bella Rose', 'Candos',
      'Cassis', 'Curepipe', 'Floréal', 'Forest Side', 'Glen Park',
      'Henrietta', 'Malherbes', 'Mesnil', 'Nouvelle France',
      'Palma', 'Phoenix', 'Quatre Bornes', 'Rose Hill',
      'Stanley', 'Surinam', 'Trèfles',
      'Zone Industrielle Plaine Lauzun', 'Zone Industrielle Phoenix'
    ],
    'Port Louis District': [
      'Baie du Tombeau', 'Caudan', 'Caudan Waterfront', 'Champ de Mars',
      'Cité Martial', 'Fond Latanier', 'Fort Victoria',
      'La Butte', 'La Tour Koenig', 'Les Salines',
      'Mer Rouge Industrial Zone', 'Morc. Tombeau Bay',
      'Port Louis City Centre', 'Port Louis Docks', 'Pointe aux Sables',
      'Roche Bois', 'Sainte Croix', 'Vallée des Prêtres',
      'Zone Industrielle Mer Rouge', 'Zone Industrielle Roche Bois'
    ],
    'Rivière du Rempart District': [
      'Amaury', 'Arsenal', 'Bain des Dames', 'Belle Vue Maurel',
      'Bon Espoir', 'Cap Malheureux', 'Congomah', 'Cottage',
      'Goodlands', 'Grand Gaube', 'Mapou', 'Nouveau Séjour',
      'Poudre d\'Or', 'Poudre d\'Or Hamlet', 'Providence',
      'Rivière du Rempart', 'Roches Noires', 'Vieux Moulin'
    ],
    'Savanne District': [
      'Baie du Cap', 'Bel Ombre', 'Britannia', 'Chemin Grenier',
      'Gris Gris', 'La Flora', 'L\'Escalier', 'Le Bouchon',
      'Les Salines', 'Mahebourg', 'Montagne Blanche',
      'Rivière des Anguilles', 'Rivière Noire', 'Saint Martin',
      'Souillac', 'Surinam', 'Tyack',
      'Zone Industrielle Chemin Grenier'
    ]
  }
};
