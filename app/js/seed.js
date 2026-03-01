/* ============================================================
   seed.js — Demo Data for First Run
   ============================================================ */

function seedDemoData() {
  if (localStorage.getItem(CONFIG.STORAGE_KEYS.SEEDED)) return;

  // ── USERS ──────────────────────────────────────────────────
  const users = [
    { id: 'u1', name: 'Admin User',       role: 'admin',      email: 'admin@bavarian.mu', password: 'admin123', createdAt: '2024-01-01T08:00:00Z' },
    { id: 'u2', name: 'Jean-Marc Dupont', role: 'technician', email: 'jm@bavarian.mu',    password: 'tech123',  createdAt: '2024-01-05T08:00:00Z' },
    { id: 'u3', name: 'Priya Naidoo',     role: 'technician', email: 'priya@bavarian.mu', password: 'tech123',  createdAt: '2024-01-05T08:00:00Z' }
  ];
  localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));

  // ── CLIENTS ────────────────────────────────────────────────
  const clients = [
    { id: 'c1', name: 'Ciel Group',         contactPerson: 'Marc Lagesse',      phone: '+230 203 6200', email: 'procurement@cielgroup.com',     region: 'Port Louis',  industry: 'Conglomerate', createdAt: '2024-01-10T08:00:00Z' },
    { id: 'c2', name: 'IBL Ltd',            contactPerson: 'Sophie Ah Vee',     phone: '+230 402 5600', email: 'maintenance@ibl.mu',            region: 'Ebène',       industry: 'Logistics',    createdAt: '2024-01-12T08:00:00Z' },
    { id: 'c3', name: 'Rogers Group',       contactPerson: 'Didier Moheeputh',  phone: '+230 206 5000', email: 'technical@rogers.mu',           region: 'Port Louis',  industry: 'Hospitality',  createdAt: '2024-01-15T08:00:00Z' },
    { id: 'c4', name: 'Constance Hotels',  contactPerson: 'Laetitia Perrier',  phone: '+230 697 9000', email: 'facilities@constancehotels.com', region: 'Grand Baie',  industry: 'Hospitality',  createdAt: '2024-01-18T08:00:00Z' },
    { id: 'c5', name: 'Leal & Co',         contactPerson: 'Antoine Leal',      phone: '+230 206 2900', email: 'operations@lealco.mu',          region: 'Rose Hill',   industry: 'Retail',       createdAt: '2024-01-20T08:00:00Z' }
  ];
  localStorage.setItem(CONFIG.STORAGE_KEYS.CLIENTS, JSON.stringify(clients));

  // ── MACHINES ───────────────────────────────────────────────
  const machines = [
    { id: 'm1',  clientId: 'c1', model: 'MULTIVAC R230',      serialNumber: 'MV-R230-2021-001', type: 'Tray Sealer',         installDate: '2021-03-15', contractType: 'gold',   contractExpiry: '2025-03-14', location: 'Production Line A', createdAt: '2024-01-10T08:00:00Z' },
    { id: 'm2',  clientId: 'c1', model: 'MULTIVAC R535',      serialNumber: 'MV-R535-2022-003', type: 'Thermoformer',        installDate: '2022-06-20', contractType: 'silver', contractExpiry: '2025-06-19', location: 'Production Line B', createdAt: '2024-01-10T08:00:00Z' },
    { id: 'm3',  clientId: 'c2', model: 'MULTIVAC T800',      serialNumber: 'MV-T800-2020-012', type: 'Flowpack',            installDate: '2020-11-10', contractType: 'bronze', contractExpiry: '2024-11-09', location: 'Packaging Hall 1',  createdAt: '2024-01-12T08:00:00Z' },
    { id: 'm4',  clientId: 'c2', model: 'MULTIVAC X-line 400',serialNumber: 'MV-XL400-2023-01', type: 'Inspection System',   installDate: '2023-02-28', contractType: 'gold',   contractExpiry: '2026-02-27', location: 'Quality Control',   createdAt: '2024-01-12T08:00:00Z' },
    { id: 'm5',  clientId: 'c3', model: 'MULTIVAC C300',      serialNumber: 'MV-C300-2021-007', type: 'Chamber Machine',     installDate: '2021-07-05', contractType: 'none',   contractExpiry: null,         location: 'Kitchen Prep',      createdAt: '2024-01-15T08:00:00Z' },
    { id: 'm6',  clientId: 'c3', model: 'MULTIVAC R230',      serialNumber: 'MV-R230-2023-009', type: 'Tray Sealer',         installDate: '2023-09-15', contractType: 'silver', contractExpiry: '2025-09-14', location: 'Banquet Prep',      createdAt: '2024-01-15T08:00:00Z' },
    { id: 'm7',  clientId: 'c4', model: 'MULTIVAC T800',      serialNumber: 'MV-T800-2022-018', type: 'Flowpack',            installDate: '2022-04-12', contractType: 'gold',   contractExpiry: '2025-04-11', location: 'Central Kitchen',   createdAt: '2024-01-18T08:00:00Z' },
    { id: 'm8',  clientId: 'c4', model: 'MULTIVAC X-line 200',serialNumber: 'MV-XL200-2021-004', type: 'Inspection System',  installDate: '2021-12-01', contractType: 'bronze', contractExpiry: '2024-11-30', location: 'Food Processing',   createdAt: '2024-01-18T08:00:00Z' },
    { id: 'm9',  clientId: 'c5', model: 'MULTIVAC R535',      serialNumber: 'MV-R535-2020-006', type: 'Thermoformer',        installDate: '2020-08-22', contractType: 'silver', contractExpiry: '2025-08-21', location: 'Warehouse A',       createdAt: '2024-01-20T08:00:00Z' },
    { id: 'm10', clientId: 'c5', model: 'MULTIVAC C300',      serialNumber: 'MV-C300-2023-015', type: 'Chamber Machine',     installDate: '2023-05-30', contractType: 'none',   contractExpiry: null,         location: 'Retail Packaging',  createdAt: '2024-01-20T08:00:00Z' }
  ];
  localStorage.setItem(CONFIG.STORAGE_KEYS.MACHINES, JSON.stringify(machines));

  // ── INTERVENTIONS ──────────────────────────────────────────
  const now = new Date();
  const d = (daysOffset) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + daysOffset);
    return dt.toISOString();
  };

  const interventions = [
    {
      id: 'i1', clientId: 'c1', machineId: 'm1', type: 'breakdown', priority: 'urgent',
      location: 'client', status: 'ongoing', technicianId: 'u2',
      description: 'Sealing head overheating — production halted. Immediate repair required.',
      scheduledDate: d(-1), createdAt: d(-3), updatedAt: d(-1),
      notes: [{ id: 'n1', text: 'Technician on site. Identified faulty heating element.', author: 'Jean-Marc Dupont', createdAt: d(-1) }],
      parts: [{ id: 'p1', reference: 'HE-R230-001', description: 'Heating Element 230V', quantity: 1, addedAt: d(-1) }],
      createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-3), details: 'Status: new, Priority: urgent' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-2), details: 'new → assigned, Assigned to Jean-Marc Dupont' },
        { action: 'Status Changed', user: 'Jean-Marc Dupont', timestamp: d(-1), details: 'assigned → ongoing' }
      ]
    },
    {
      id: 'i2', clientId: 'c2', machineId: 'm3', type: 'preventive', priority: 'medium',
      location: 'client', status: 'planned', technicianId: 'u3',
      description: 'Annual preventive maintenance — lubrication, belt inspection, calibration.',
      scheduledDate: d(3), createdAt: d(-5), updatedAt: d(-5),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-5), details: 'Status: new' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-4), details: 'new → planned' },
        { action: 'Technician Assigned', user: 'Admin User', timestamp: d(-4), details: 'Assigned to Priya Naidoo' }
      ]
    },
    {
      id: 'i3', clientId: 'c3', machineId: 'm5', type: 'breakdown', priority: 'high',
      location: 'workshop', status: 'waiting_parts', technicianId: 'u2',
      description: 'Vacuum pump failure. Replacement pump ordered, awaiting delivery.',
      scheduledDate: d(-7), createdAt: d(-10), updatedAt: d(-2),
      notes: [
        { id: 'n2', text: 'Pump completely seized. Part reference: VP-C300-002.', author: 'Jean-Marc Dupont', createdAt: d(-7) },
        { id: 'n3', text: 'Part ordered from Germany. ETA 5 business days.', author: 'Admin User', createdAt: d(-2) }
      ],
      parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-10), details: 'Status: new, Priority: high' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-9), details: 'new → assigned' },
        { action: 'Status Changed', user: 'Jean-Marc Dupont', timestamp: d(-7), details: 'assigned → ongoing' },
        { action: 'Status Changed', user: 'Jean-Marc Dupont', timestamp: d(-2), details: 'ongoing → waiting_parts, Part ordered' }
      ]
    },
    {
      id: 'i4', clientId: 'c4', machineId: 'm7', type: 'preventive', priority: 'low',
      location: 'client', status: 'completed', technicianId: 'u3',
      description: '6-month preventive maintenance completed successfully.',
      scheduledDate: d(-14), createdAt: d(-20), updatedAt: d(-13),
      notes: [{ id: 'n4', text: 'All checks done. Machine in good condition. Next PM in 6 months.', author: 'Priya Naidoo', createdAt: d(-13) }],
      parts: [
        { id: 'p2', reference: 'LB-T800-001', description: 'Lubricant 5L', quantity: 2, addedAt: d(-14) },
        { id: 'p3', reference: 'BL-T800-003', description: 'Drive Belt', quantity: 1, addedAt: d(-14) }
      ],
      createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-20), details: 'Status: new' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-18), details: 'new → planned' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-15), details: 'planned → assigned, Assigned to Priya Naidoo' },
        { action: 'Status Changed', user: 'Priya Naidoo', timestamp: d(-14), details: 'assigned → ongoing' },
        { action: 'Status Changed', user: 'Priya Naidoo', timestamp: d(-13), details: 'ongoing → completed' }
      ]
    },
    {
      id: 'i5', clientId: 'c5', machineId: 'm9', type: 'breakdown', priority: 'high',
      location: 'client', status: 'new', technicianId: null,
      description: 'Film sealing inconsistency — packaging defects reported. Needs urgent inspection.',
      scheduledDate: null, createdAt: d(-1), updatedAt: d(-1),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-1), details: 'Status: new, Priority: high' }
      ]
    },
    {
      id: 'i6', clientId: 'c1', machineId: 'm2', type: 'installation', priority: 'medium',
      location: 'client', status: 'assigned', technicianId: 'u3',
      description: 'New conveyor belt installation and commissioning on R535 line.',
      scheduledDate: d(5), createdAt: d(-2), updatedAt: d(-1),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-2), details: 'Status: new' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-1), details: 'new → assigned, Assigned to Priya Naidoo' }
      ]
    },
    {
      id: 'i7', clientId: 'c2', machineId: 'm4', type: 'support', priority: 'low',
      location: 'client', status: 'pending', technicianId: 'u2',
      description: 'Operator training request — new staff onboarding on X-line 400 controls.',
      scheduledDate: d(7), createdAt: d(-3), updatedAt: d(-3),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-3), details: 'Status: new' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-2), details: 'new → planned' },
        { action: 'Status Changed', user: 'Jean-Marc Dupont', timestamp: d(-1), details: 'planned → pending, Awaiting site access confirmation' }
      ]
    },
    {
      id: 'i8', clientId: 'c3', machineId: 'm6', type: 'preventive', priority: 'medium',
      location: 'client', status: 'completed', technicianId: 'u3',
      description: '3-month inspection completed. Film feed mechanism adjusted.',
      scheduledDate: d(-30), createdAt: d(-35), updatedAt: d(-29),
      notes: [{ id: 'n5', text: 'Film feed tension adjusted. Sealing bar cleaned. All OK.', author: 'Priya Naidoo', createdAt: d(-29) }],
      parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-35), details: 'Status: new' },
        { action: 'Status Changed', user: 'Priya Naidoo', timestamp: d(-29), details: 'ongoing → completed' }
      ]
    },
    {
      id: 'i9', clientId: 'c4', machineId: 'm8', type: 'breakdown', priority: 'urgent',
      location: 'client', status: 'new', technicianId: null,
      description: 'Machine not starting — electrical fault suspected. Production stopped.',
      scheduledDate: null, createdAt: d(0), updatedAt: d(0),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(0), details: 'Status: new, Priority: urgent — Emergency' }
      ]
    },
    {
      id: 'i10', clientId: 'c5', machineId: 'm10', type: 'installation', priority: 'low',
      location: 'client', status: 'planned', technicianId: 'u2',
      description: 'Initial setup and commissioning of newly purchased C300.',
      scheduledDate: d(10), createdAt: d(-7), updatedAt: d(-7),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-7), details: 'Status: new' },
        { action: 'Status Changed', user: 'Admin User', timestamp: d(-6), details: 'new → planned, Assigned to Jean-Marc Dupont' }
      ]
    },
    {
      id: 'i11', clientId: 'c1', machineId: 'm1', type: 'preventive', priority: 'medium',
      location: 'client', status: 'completed', technicianId: 'u2',
      description: 'Quarterly PM completed — sealing head cleaned, settings verified.',
      scheduledDate: d(-45), createdAt: d(-50), updatedAt: d(-44),
      notes: [{ id: 'n6', text: 'Quarterly PM complete. All parameters within spec.', author: 'Jean-Marc Dupont', createdAt: d(-44) }],
      parts: [{ id: 'p4', reference: 'SF-R230-007', description: 'Sealing Film Roll', quantity: 3, addedAt: d(-45) }],
      createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-50), details: 'Status: planned' },
        { action: 'Status Changed', user: 'Jean-Marc Dupont', timestamp: d(-44), details: 'ongoing → completed' }
      ]
    },
    {
      id: 'i12', clientId: 'c2', machineId: 'm3', type: 'breakdown', priority: 'high',
      location: 'workshop', status: 'cancelled', technicianId: 'u3',
      description: 'Belt slippage reported — inspection found no defect, false alarm.',
      scheduledDate: d(-20), createdAt: d(-22), updatedAt: d(-19),
      notes: [{ id: 'n7', text: 'Inspection complete — no fault found. Belt correctly tensioned. Closing ticket.', author: 'Priya Naidoo', createdAt: d(-19) }],
      parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-22), details: 'Status: new' },
        { action: 'Status Changed', user: 'Priya Naidoo', timestamp: d(-19), details: 'ongoing → cancelled, No fault found' }
      ]
    },
    {
      id: 'i13', clientId: 'c3', machineId: 'm5', type: 'support', priority: 'low',
      location: 'workshop', status: 'new', technicianId: null,
      description: 'Request for vacuum chamber manual and spare parts catalog.',
      scheduledDate: null, createdAt: d(-2), updatedAt: d(-2),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-2), details: 'Status: new' }
      ]
    },
    {
      id: 'i14', clientId: 'c4', machineId: 'm7', type: 'preventive', priority: 'medium',
      location: 'client', status: 'assigned', technicianId: 'u2',
      description: 'Annual full service — complete strip-down and inspection scheduled.',
      scheduledDate: d(14), createdAt: d(-1), updatedAt: d(-1),
      notes: [], parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-1), details: 'Status: planned' },
        { action: 'Technician Assigned', user: 'Admin User', timestamp: d(-1), details: 'Assigned to Jean-Marc Dupont' }
      ]
    },
    {
      id: 'i15', clientId: 'c5', machineId: 'm9', type: 'support', priority: 'medium',
      location: 'client', status: 'ongoing', technicianId: 'u3',
      description: 'Remote diagnostics session for film feed calibration optimization.',
      scheduledDate: d(0), createdAt: d(-1), updatedAt: d(0),
      notes: [{ id: 'n8', text: 'Remote session in progress. Feed tension being recalibrated.', author: 'Priya Naidoo', createdAt: d(0) }],
      parts: [], createdBy: 'Admin User',
      auditTrail: [
        { action: 'Created', user: 'Admin User', timestamp: d(-1), details: 'Status: assigned' },
        { action: 'Status Changed', user: 'Priya Naidoo', timestamp: d(0), details: 'assigned → ongoing' }
      ]
    }
  ];
  localStorage.setItem(CONFIG.STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));

  // ── CONTRACTS ──────────────────────────────────────────────
  const contracts = [
    { id: 'ct1', clientId: 'c1', machineId: 'm1', type: 'gold',   startDate: '2022-03-15', endDate: '2025-03-14', annualValue: 85000, currency: 'MUR', notes: '24/7 emergency response included', createdAt: '2022-03-15T08:00:00Z' },
    { id: 'ct2', clientId: 'c2', machineId: 'm4', type: 'gold',   startDate: '2023-02-28', endDate: '2026-02-27', annualValue: 120000, currency: 'MUR', notes: 'Full inspection and parts coverage', createdAt: '2023-02-28T08:00:00Z' },
    { id: 'ct3', clientId: 'c4', machineId: 'm7', type: 'gold',   startDate: '2022-04-12', endDate: '2025-04-11', annualValue: 95000, currency: 'MUR', notes: 'Priority response SLA: 4 hours', createdAt: '2022-04-12T08:00:00Z' }
  ];
  localStorage.setItem(CONFIG.STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));

  localStorage.setItem(CONFIG.STORAGE_KEYS.SEEDED, 'true');
  console.log('[Seed] Demo data loaded successfully');
}
