/* ============================================================
   seed.js — Demo Seed Data v9
   Uses existing Firebase Auth accounts — resolves UIDs at
   runtime by looking up each user's Firestore profile by email
   (doc ID = Firebase Auth UID set during account registration).
   Guard: meta/seed { seeded: 'v9' } — runs once per Firestore.
   ============================================================ */

async function seedDemoData() {

  // ── GUARD ──────────────────────────────────────────────────
  try {
    const meta = await db.collection('meta').doc('seed').get();
    if (meta.exists && meta.data().seeded === 'v9') return;
  } catch (e) {
    console.warn('[Seed] Could not check guard, aborting:', e);
    return;
  }

  console.log('[Seed] Starting demo seed v9…');

  // ── RESOLVE REAL UIDs FROM FIRESTORE (doc id = Firebase UID) ─
  // Auth accounts already exist — their Firestore profile doc ID
  // is their UID. We find them by querying the email field.

  async function uidByEmail(email) {
    try {
      const snap = await db.collection(COL.USERS)
        .where('email', '==', email.toLowerCase()).limit(1).get();
      if (!snap.empty) return snap.docs[0].id;
    } catch (e) { /* not yet seeded */ }
    return null;
  }

  // The currently signed-in user's UID is always known
  const currentUid  = fbAuth.currentUser?.uid;
  const currentEmail = fbAuth.currentUser?.email?.toLowerCase();

  if (!currentUid) {
    console.warn('[Seed] No authenticated user — aborting seed.');
    return;
  }

  // Known emails → UID map. For accounts that have no Firestore profile yet
  // (newly created in Firebase Auth), we can still resolve the UID if that
  // user is the one currently logged in.
  const KNOWN = {
    'superadmin@bavarian.mu':      null,
    'admin@bavarian.mu':           null,
    'giovannimarianne1@gmail.com': null,
    'jonathanchellen@bavarian.mu': null,
  };

  // Always assign the current user's UID to their email entry
  if (currentEmail && currentEmail in KNOWN) {
    KNOWN[currentEmail] = currentUid;
  }

  // For the others, try to find their existing Firestore profile doc
  await Promise.all(Object.keys(KNOWN).map(async email => {
    if (KNOWN[email]) return; // already resolved
    KNOWN[email] = await uidByEmail(email);
  }));

  const saUid = KNOWN['superadmin@bavarian.mu'];
  const adUid = KNOWN['admin@bavarian.mu'];
  const t1Uid = KNOWN['giovannimarianne1@gmail.com'];
  const t2Uid = KNOWN['jonathanchellen@bavarian.mu'];

  // ── DATE HELPERS ────────────────────────────────────────────
  const now = new Date();

  function iso(offsetDays, hour = 8) {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }
  function dateStr(offsetDays) {
    return iso(offsetDays, 0).slice(0, 10);
  }
  function hoursLater(h) {
    return new Date(now.getTime() + h * 3600000).toISOString();
  }

  // ── BATCH HELPERS (500-doc safety) ───────────────────────────
  const batches = [];
  let cur = db.batch();
  let n   = 0;

  function bset(col, id, data) {
    if (n >= 490) { batches.push(cur); cur = db.batch(); n = 0; }
    cur.set(db.collection(col).doc(id), data);
    n++;
  }
  async function commit() {
    batches.push(cur);
    for (const b of batches) await b.commit();
  }

  // ── 1. USER PROFILES ────────────────────────────────────────
  // Write a Firestore profile for each account.
  // Uses the resolved UID as the doc ID. If the profile already
  // exists it will be overwritten with canonical seed data.

  const PROFILES = [];

  if (saUid) PROFILES.push({
    id: saUid, name: 'Super Admin', email: 'superadmin@bavarian.mu',
    role: 'superadmin', phone: '+230 5700 0001', createdAt: iso(-400),
  });
  if (adUid) PROFILES.push({
    id: adUid, name: 'Admin', email: 'admin@bavarian.mu',
    role: 'admin', phone: '+230 5700 0002', createdAt: iso(-300),
  });
  if (t1Uid) PROFILES.push({
    id: t1Uid, name: 'Giovanni Marianne', email: 'giovannimarianne1@gmail.com',
    role: 'technician', phone: '+230 5712 0003', createdAt: iso(-250),
  });
  if (t2Uid) PROFILES.push({
    id: t2Uid, name: 'Jonathan Chellen', email: 'jonathanchellen@bavarian.mu',
    role: 'technician', phone: '+230 5712 0004', createdAt: iso(-200),
  });

  PROFILES.forEach(p => bset(COL.USERS, p.id, p));

  // Resolved IDs for use in interventions (fall back to empty string gracefully)
  const T1 = t1Uid || '';
  const T2 = t2Uid || '';

  // ── 2. CLIENTS ──────────────────────────────────────────────
  const CLIENTS = [
    { id: 'cl-001', clientNumber: 'CLT-10001', name: 'Sun Foods Ltd',
      email: 'contact@sunfoods.mu', phone: '+230 467 0001',
      address: 'Zone Industrielle Riche Terre', district: 'Pamplemousses District',
      createdAt: iso(-400) },
    { id: 'cl-002', clientNumber: 'CLT-10002', name: 'Tropical Beverages Co.',
      email: 'ops@tropicalbev.mu', phone: '+230 467 0002',
      address: 'Zone Industrielle Phoenix', district: 'Plaines Wilhems District',
      createdAt: iso(-380) },
    { id: 'cl-003', clientNumber: 'CLT-10003', name: 'Seafresh Processors',
      email: 'plant@seafresh.mu', phone: '+230 467 0003',
      address: 'Zone Industrielle Mahebourg', district: 'Grand Port District',
      createdAt: iso(-300) },
    { id: 'cl-004', clientNumber: 'CLT-10004', name: 'MauriDairy Industries',
      email: 'production@mauridairy.mu', phone: '+230 467 0004',
      address: 'Zone Industrielle Coromandel', district: 'Moka District',
      createdAt: iso(-280) },
    { id: 'cl-005', clientNumber: 'CLT-10005', name: 'Island Fresh Produce',
      email: 'logistics@islandfresh.mu', phone: '+230 467 0005',
      address: 'Zone Industrielle Rose Belle', district: 'Grand Port District',
      createdAt: iso(-200) },
    { id: 'cl-006', clientNumber: 'CLT-10006', name: 'BioMed Packaging SA',
      email: 'quality@biomed.mu', phone: '+230 467 0006',
      address: 'Ebène CyberCity', district: 'Moka District',
      createdAt: iso(-150) },
  ];
  CLIENTS.forEach(c => bset(COL.CLIENTS, c.id, c));

  // ── 3. MACHINES ─────────────────────────────────────────────
  const MACHINES = [
    { id: 'mch-001', clientId: 'cl-001', model: 'MULTIVAC R 245',
      serialNumber: 'MV-R245-2019-001', jobNumber: '100001',
      status: 'active', purchaseDate: '2019-03-15',
      district: 'Pamplemousses District', location: 'Zone Industrielle Riche Terre',
      notes: 'Main tray sealer — line 1.', createdAt: iso(-400) },
    { id: 'mch-002', clientId: 'cl-001', model: 'MULTIVAC T 800',
      serialNumber: 'MV-T800-2021-002', jobNumber: '100002',
      status: 'maintenance', purchaseDate: '2021-07-20',
      district: 'Pamplemousses District', location: 'Zone Industrielle Riche Terre',
      notes: 'Thermoforming line 2. Currently under repair.', createdAt: iso(-350) },
    { id: 'mch-003', clientId: 'cl-002', model: 'MULTIVAC H 060',
      serialNumber: 'MV-H060-2020-003', jobNumber: '100003',
      status: 'active', purchaseDate: '2020-01-10',
      district: 'Plaines Wilhems District', location: 'Zone Industrielle Phoenix',
      notes: 'Horizontal flow-wrap line.', createdAt: iso(-380) },
    { id: 'mch-004', clientId: 'cl-002', model: 'MULTIVAC C 500',
      serialNumber: 'MV-C500-2022-004', jobNumber: '100004',
      status: 'active', purchaseDate: '2022-05-08',
      district: 'Plaines Wilhems District', location: 'Zone Industrielle Phoenix',
      notes: 'Chamber machine — secondary packaging.', createdAt: iso(-300) },
    { id: 'mch-005', clientId: 'cl-003', model: 'MULTIVAC R 535',
      serialNumber: 'MV-R535-2018-005', jobNumber: '100005',
      status: 'active', purchaseDate: '2018-09-25',
      district: 'Grand Port District', location: 'Zone Industrielle Mahebourg',
      notes: 'High-output thermoformer for seafood trays.', createdAt: iso(-300) },
    { id: 'mch-006', clientId: 'cl-003', model: 'MULTIVAC X 612',
      serialNumber: 'MV-X612-2023-006', jobNumber: '100006',
      status: 'active', purchaseDate: '2023-02-14',
      district: 'Grand Port District', location: 'Zone Industrielle Mahebourg',
      notes: 'Latest generation — automated loading.', createdAt: iso(-250) },
    { id: 'mch-007', clientId: 'cl-004', model: 'MULTIVAC T 300',
      serialNumber: 'MV-T300-2017-007', jobNumber: '100007',
      status: 'active', purchaseDate: '2017-06-11',
      district: 'Moka District', location: 'Zone Industrielle Coromandel',
      notes: 'Dairy tray packer.', createdAt: iso(-280) },
    { id: 'mch-008', clientId: 'cl-004', model: 'MULTIVAC R 105',
      serialNumber: 'MV-R105-2022-008', jobNumber: '100008',
      status: 'active', purchaseDate: '2022-11-30',
      district: 'Moka District', location: 'Zone Industrielle Coromandel',
      notes: 'Small-batch cheese packaging.', createdAt: iso(-200) },
    { id: 'mch-009', clientId: 'cl-005', model: 'MULTIVAC H 130',
      serialNumber: 'MV-H130-2021-009', jobNumber: '100009',
      status: 'decommissioned', purchaseDate: '2021-03-05',
      district: 'Grand Port District', location: 'Zone Industrielle Rose Belle',
      notes: 'Decommissioned — replaced by mch-010.', createdAt: iso(-200) },
    { id: 'mch-010', clientId: 'cl-005', model: 'MULTIVAC H 244',
      serialNumber: 'MV-H244-2024-010', jobNumber: '100010',
      status: 'active', purchaseDate: '2024-01-20',
      district: 'Grand Port District', location: 'Zone Industrielle Rose Belle',
      notes: 'New flagship fresh-produce line.', createdAt: iso(-100) },
    { id: 'mch-011', clientId: 'cl-006', model: 'MULTIVAC T 600',
      serialNumber: 'MV-T600-2020-011', jobNumber: '100011',
      status: 'active', purchaseDate: '2020-08-17',
      district: 'Moka District', location: 'Ebène CyberCity',
      notes: 'Medical device packaging.', createdAt: iso(-150) },
    { id: 'mch-012', clientId: 'cl-006', model: 'MULTIVAC T 700',
      serialNumber: 'MV-T700-2023-012', jobNumber: '100012',
      status: 'active', purchaseDate: '2023-10-01',
      district: 'Moka District', location: 'Ebène CyberCity',
      notes: 'Sterile packaging validation unit.', createdAt: iso(-80) },
  ];
  MACHINES.forEach(m => bset(COL.MACHINES, m.id, m));

  // ── 4. MAINTENANCE CONTRACTS ─────────────────────────────────
  // schedule[] dates drive PMC visit due notifications.
  // Contracts with endDate within 30 days trigger expiry alerts.

  const MC = [
    // mc-001: Gold, mch-001, CRITICAL expiry in 3 days, PMC visit TODAY
    { id: 'mc-001', clientId: 'cl-001', machineId: 'mch-001', type: 'gold',
      startDate: dateStr(-362), endDate: dateStr(3),
      schedule: [dateStr(-270), dateStr(-180), dateStr(-90), dateStr(0)],
      notes: 'Gold — 4 annual visits. Renew urgently.', createdAt: iso(-362) },

    // mc-002: Silver, mch-002, WARNING expiry in 18 days, PMC visit TOMORROW
    { id: 'mc-002', clientId: 'cl-001', machineId: 'mch-002', type: 'silver',
      startDate: dateStr(-347), endDate: dateStr(18),
      schedule: [dateStr(-180), dateStr(1)],
      notes: 'Silver — 2 visits/year.', createdAt: iso(-347) },

    // mc-003: Gold, mch-003, expiry in 45 days (no notification), PMC visit in 5 days
    { id: 'mc-003', clientId: 'cl-002', machineId: 'mch-003', type: 'gold',
      startDate: dateStr(-320), endDate: dateStr(45),
      schedule: [dateStr(-240), dateStr(-120), dateStr(5), dateStr(125)],
      notes: 'Gold — 4 visits.', createdAt: iso(-320) },

    // mc-004: Bronze, mch-004, healthy, visit 1 done
    { id: 'mc-004', clientId: 'cl-002', machineId: 'mch-004', type: 'bronze',
      startDate: dateStr(-60), endDate: dateStr(305),
      schedule: [dateStr(-30), dateStr(120)],
      notes: 'Bronze — 2 visits. Visit 1 done.', createdAt: iso(-60) },

    // mc-005: Gold, mch-005, CRITICAL expiry TOMORROW, PMC visit in 3 days
    { id: 'mc-005', clientId: 'cl-003', machineId: 'mch-005', type: 'gold',
      startDate: dateStr(-364), endDate: dateStr(1),
      schedule: [dateStr(-270), dateStr(-180), dateStr(-90), dateStr(3)],
      notes: 'Contract expires tomorrow! Immediate renewal required.', createdAt: iso(-364) },

    // mc-006: Silver, mch-006, healthy, PMC visit in 6 days
    { id: 'mc-006', clientId: 'cl-003', machineId: 'mch-006', type: 'silver',
      startDate: dateStr(-180), endDate: dateStr(185),
      schedule: [dateStr(-90), dateStr(6)],
      notes: 'Silver — bi-annual visits.', createdAt: iso(-180) },

    // mc-007: Gold, mch-007, WARNING expiry in 25 days, all visits done
    { id: 'mc-007', clientId: 'cl-004', machineId: 'mch-007', type: 'gold',
      startDate: dateStr(-340), endDate: dateStr(25),
      schedule: [dateStr(-255), dateStr(-170), dateStr(-85), dateStr(-10)],
      notes: 'All visits completed. Awaiting renewal.', createdAt: iso(-340) },

    // mc-008: Bronze, mch-011, healthy, no imminent visit
    { id: 'mc-008', clientId: 'cl-006', machineId: 'mch-011', type: 'bronze',
      startDate: dateStr(-90), endDate: dateStr(275),
      schedule: [dateStr(-60), dateStr(120)],
      notes: 'Medical packaging — ISO compliance required.', createdAt: iso(-90) },
  ];
  MC.forEach(mc => bset(COL.MAINTENANCE_CONTRACTS, mc.id, mc));

  // ── 5. INTERVENTIONS ─────────────────────────────────────────
  // Helper: build a minimal but valid intervention doc
  function mkInt(id, clientId, machineId, type, status, priority, desc, techIds, scheduledDate, createdAtOffset, extra = {}) {
    const createdAt = iso(createdAtOffset);
    const sched = scheduledDate ? scheduledDate : null;
    return {
      id, clientId, machineId, type, status, priority,
      description: desc,
      technicianIds: techIds,
      technicianId: techIds[0] || null,
      scheduledDate: sched,
      createdAt,
      updatedAt: createdAt,
      statusUpdatedAt: createdAt,
      notes: [],
      parts: [],
      statusHistory: [{ status, changedBy: 'System', timestamp: createdAt, note: 'Seeded' }],
      scheduledHistory: sched ? [{ scheduledDate: sched, status, technicianIds: techIds, technicianId: techIds[0] || null, changedBy: 'System', timestamp: createdAt }] : [],
      auditTrail: [{ action: 'Created', user: 'System', timestamp: createdAt, details: `Status: ${status}` }],
      ...extra
    };
  }

  const INTERVENTIONS = [

    // ═══ OVERDUE (assigned/tentative + past scheduledDate) ════════════
    // Also triggers SLA breach for high/urgent ones open > 3 days

    mkInt('int-001', 'cl-001', 'mch-001', 'breakdown', 'assigned', 'high',
      'Sealing jaw temperature inconsistency — 15% tray reject rate. Line halted.',
      [T1], iso(-3), -5,
      { notes: [{ id: 'n1', text: 'Client called twice. Awaiting parts confirmation.', author: 'Admin', createdAt: iso(-4) }] }),

    mkInt('int-002', 'cl-002', 'mch-003', 'breakdown', 'tentative', 'urgent',
      'Film tension sensor failure. Machine producing malformed packs. Production stopped.',
      [T2], iso(-2), -6),

    mkInt('int-003', 'cl-003', 'mch-005', 'support', 'assigned', 'medium',
      'Calibration check — product weight complaints from QA. Audit next week.',
      [T1], iso(-1), -3),

    // ═══ UPCOMING (assigned/tentative + scheduledDate within 24 h) ════

    mkInt('int-004', 'cl-004', 'mch-007', 'breakdown', 'assigned', 'high',
      'Vacuum pump escalating noise — risk of total failure. Two-tech replacement job.',
      [T1, T2], hoursLater(3), -4),        // 3 h away → UPCOMING + SLA breach (4 d)

    mkInt('int-005', 'cl-005', 'mch-010', 'installation', 'tentative', 'medium',
      'New conveyor belt installation and H 244 integration. Parts on site.',
      [T2], hoursLater(10), -2),           // 10 h away → UPCOMING

    mkInt('int-006', 'cl-006', 'mch-011', 'training', 'assigned', 'low',
      'Operator training for new shift team (6 operators). Materials ready.',
      [T1], hoursLater(22), -7),           // 22 h away → UPCOMING

    // ═══ SLA BREACH ONLY (high/urgent open > 3 days) ══════════════════

    mkInt('int-007', 'cl-001', 'mch-002', 'breakdown', 'new', 'high',
      'Forming station misalignment. Trays deforming on every cycle. No tech assigned yet.',
      [], null, -5),                        // no date → also UNPLANNED

    mkInt('int-008', 'cl-002', 'mch-004', 'breakdown', 'ongoing', 'urgent',
      'Control board failure. Replacement board sourced, installation in progress.',
      [T2], iso(-7), -9),

    mkInt('int-009', 'cl-003', 'mch-006', 'breakdown', 'waiting_parts', 'high',
      'Cutting knife set worn. Full blade assembly ordered from Germany. ETA 3-5 days.',
      [T1], iso(5), -10),

    // ═══ UNPLANNED (new/tentative + no scheduledDate + non-PMC) ══════

    mkInt('int-010', 'cl-004', 'mch-008', 'support', 'new', 'medium',
      'Software update request — new packaging format recipes for product launch in 2 weeks.',
      [], null, -1),

    mkInt('int-011', 'cl-005', 'mch-010', 'survey', 'tentative', 'low',
      'Annual machine performance survey requested. Schedule when tech is in the area.',
      [T1], null, -2),

    mkInt('int-012', 'cl-006', 'mch-012', 'breakdown', 'new', 'urgent',
      'Complete sealing failure on T 700. Medical-grade packaging compromised. ISO at risk.',
      [], null, -4),                        // also SLA breach (urgent, 4 d)

    // ═══ PMC INTERVENTIONS ════════════════════════════════════════════

    // mc-001 visits 0-2 COMPLETED (so no notification for these)
    mkInt('int-013', 'cl-001', 'mch-001', 'pmc', 'completed', 'medium',
      'Annual PMC — 1st visit: lubrication, seal check, calibration.',
      [T1], dateStr(-270) + 'T08:00:00.000Z', -272,
      { maintenanceContractId: 'mc-001', maintenanceVisitIndex: 0, completedAt: iso(-270) }),

    mkInt('int-014', 'cl-001', 'mch-001', 'pmc', 'completed', 'medium',
      'Annual PMC — 2nd visit: belt replacement, sensor validation.',
      [T1], dateStr(-180) + 'T08:00:00.000Z', -182,
      { maintenanceContractId: 'mc-001', maintenanceVisitIndex: 1, completedAt: iso(-180) }),

    mkInt('int-015', 'cl-001', 'mch-001', 'pmc', 'completed', 'medium',
      'Annual PMC — 3rd visit: vacuum pump service, new seals fitted.',
      [T2], dateStr(-90) + 'T08:00:00.000Z', -92,
      { maintenanceContractId: 'mc-001', maintenanceVisitIndex: 2, completedAt: iso(-90) }),

    // mc-001 visit 3 — ASSIGNED for TODAY → PMC Visit Due (critical, today)
    mkInt('int-016', 'cl-001', 'mch-001', 'pmc', 'assigned', 'medium',
      'Annual PMC — 4th visit: full overhaul, documentation update, contract renewal discussion.',
      [T1], dateStr(0) + 'T08:00:00.000Z', -7,
      { maintenanceContractId: 'mc-001', maintenanceVisitIndex: 3 }),

    // mc-002 visit 0 COMPLETED
    mkInt('int-017', 'cl-001', 'mch-002', 'pmc', 'completed', 'medium',
      'PMC — 1st visit T 800: baseline check after installation.',
      [T2], dateStr(-180) + 'T08:00:00.000Z', -182,
      { maintenanceContractId: 'mc-002', maintenanceVisitIndex: 0, completedAt: iso(-180) }),

    // mc-002 visit 1 — TENTATIVE for TOMORROW → PMC Visit Due (tomorrow)
    mkInt('int-018', 'cl-001', 'mch-002', 'pmc', 'tentative', 'medium',
      'PMC — 2nd visit T 800: comprehensive check after repair downtime.',
      [T1], dateStr(1) + 'T09:00:00.000Z', -5,
      { maintenanceContractId: 'mc-002', maintenanceVisitIndex: 1 }),

    // mc-003 visits 0-1 COMPLETED
    mkInt('int-019', 'cl-002', 'mch-003', 'pmc', 'completed', 'medium',
      'PMC — 1st visit H 060: initial baseline.',
      [T2], dateStr(-240) + 'T08:00:00.000Z', -242,
      { maintenanceContractId: 'mc-003', maintenanceVisitIndex: 0, completedAt: iso(-240) }),

    mkInt('int-020', 'cl-002', 'mch-003', 'pmc', 'completed', 'medium',
      'PMC — 2nd visit H 060: mid-year tension check, all good.',
      [T2], dateStr(-120) + 'T08:00:00.000Z', -122,
      { maintenanceContractId: 'mc-003', maintenanceVisitIndex: 1, completedAt: iso(-120) }),

    // mc-003 visit 2 — ASSIGNED in 5 days → PMC Visit Due (5 days)
    mkInt('int-021', 'cl-002', 'mch-003', 'pmc', 'assigned', 'medium',
      'PMC — 3rd visit H 060: flow-wrap tension and seal quality check.',
      [T2], dateStr(5) + 'T10:00:00.000Z', -3,
      { maintenanceContractId: 'mc-003', maintenanceVisitIndex: 2 }),

    // mc-004 visit 0 COMPLETED — no notification
    mkInt('int-022', 'cl-002', 'mch-004', 'pmc', 'completed', 'low',
      'PMC — 1st visit C 500: initial baseline check.',
      [T1], dateStr(-30) + 'T08:00:00.000Z', -32,
      { maintenanceContractId: 'mc-004', maintenanceVisitIndex: 0, completedAt: iso(-30) }),

    // mc-005 visits 0-2 COMPLETED
    mkInt('int-023', 'cl-003', 'mch-005', 'pmc', 'completed', 'medium',
      'PMC — 1st visit R 535: annual lubrication and calibration.',
      [T1], dateStr(-270) + 'T08:00:00.000Z', -272,
      { maintenanceContractId: 'mc-005', maintenanceVisitIndex: 0, completedAt: iso(-270) }),

    mkInt('int-024', 'cl-003', 'mch-005', 'pmc', 'completed', 'medium',
      'PMC — 2nd visit R 535: knife replacement, full function test.',
      [T2], dateStr(-180) + 'T08:00:00.000Z', -182,
      { maintenanceContractId: 'mc-005', maintenanceVisitIndex: 1, completedAt: iso(-180) }),

    mkInt('int-025', 'cl-003', 'mch-005', 'pmc', 'completed', 'medium',
      'PMC — 3rd visit R 535: vacuum pump overhaul.',
      [T1], dateStr(-90) + 'T08:00:00.000Z', -92,
      { maintenanceContractId: 'mc-005', maintenanceVisitIndex: 2, completedAt: iso(-90) }),

    // mc-005 visit 3 — TENTATIVE in 3 days → PMC Visit Due (3 days)
    mkInt('int-026', 'cl-003', 'mch-005', 'pmc', 'tentative', 'medium',
      'PMC — 4th visit R 535: end-of-contract overhaul. Renewal offer to be presented.',
      [T2], dateStr(3) + 'T08:00:00.000Z', -4,
      { maintenanceContractId: 'mc-005', maintenanceVisitIndex: 3 }),

    // mc-006 visit 0 COMPLETED
    mkInt('int-027', 'cl-003', 'mch-006', 'pmc', 'completed', 'low',
      'PMC — 1st visit X 612: 6-month check, no issues found.',
      [T1], dateStr(-90) + 'T08:00:00.000Z', -92,
      { maintenanceContractId: 'mc-006', maintenanceVisitIndex: 0, completedAt: iso(-90) }),

    // mc-006 visit 1 — ASSIGNED in 6 days → PMC Visit Due (6 days)
    mkInt('int-028', 'cl-003', 'mch-006', 'pmc', 'assigned', 'low',
      'PMC — 2nd visit X 612: routine 6-month check.',
      [T1], dateStr(6) + 'T08:00:00.000Z', -2,
      { maintenanceContractId: 'mc-006', maintenanceVisitIndex: 1 }),

    // mc-007 all visits COMPLETED — no PMC notification
    mkInt('int-029', 'cl-004', 'mch-007', 'pmc', 'completed', 'medium',
      'PMC — 4th visit T 300: annual end-of-contract check.',
      [T2], dateStr(-10) + 'T08:00:00.000Z', -12,
      { maintenanceContractId: 'mc-007', maintenanceVisitIndex: 3, completedAt: iso(-10) }),

    // ═══ ADDITIONAL STATUS COVERAGE ══════════════════════════════════

    mkInt('int-030', 'cl-004', 'mch-007', 'breakdown', 'ongoing', 'high',
      'Drive motor replacement in progress. Motor received on site.',
      [T2], iso(-1), -2),

    mkInt('int-031', 'cl-005', 'mch-009', 'survey', 'pending', 'low',
      'Decommission survey for H 130. Awaiting client logistics confirmation.',
      [T1], iso(10), -20),

    mkInt('int-032', 'cl-006', 'mch-012', 'installation', 'completed', 'medium',
      'T 700 initial installation and commissioning. Test packs validated.',
      [T1, T2], iso(-80), -85, { completedAt: iso(-80) }),

    mkInt('int-033', 'cl-003', 'mch-005', 'training', 'cancelled', 'low',
      'Operator refresh training cancelled — industrial action. Rescheduled for next quarter.',
      [T1], iso(-15), -30),

    mkInt('int-034', 'cl-001', 'mch-002', 'breakdown', 'waiting_parts', 'medium',
      'Sealing foil feed roller worn. Replacement ordered, arriving Friday.',
      [T1], iso(4), -8,
      { parts: [{ id: 'p1', reference: 'MV-ROLLER-245-A', description: 'Foil feed roller assembly', quantity: 1, unit: 'pcs', addedAt: iso(-7) }] }),

    mkInt('int-035', 'cl-004', 'mch-008', 'support', 'assigned', 'low',
      'Remote recipe programming — new packaging formats for product launch.',
      [T2], iso(7), -3),

    mkInt('int-036', 'cl-002', 'mch-003', 'breakdown', 'completed', 'medium',
      'Film tracking guide replacement. Machine realigned, running correctly.',
      [T2], iso(-22), -25, { completedAt: iso(-22) }),

  ];

  INTERVENTIONS.forEach(i => bset(COL.INTERVENTIONS, i.id, i));

  // ── 6. LEGACY CONTRACTS (service contract records) ──────────
  const CONTRACTS = [
    { id: 'con-001', clientId: 'cl-001', machineId: 'mch-001', type: 'gold',
      startDate: '2025-01-01', endDate: '2025-12-31',
      notes: 'Full coverage including parts.', createdAt: iso(-400) },
    { id: 'con-002', clientId: 'cl-002', machineId: 'mch-003', type: 'silver',
      startDate: '2025-04-01', endDate: '2026-03-31',
      notes: 'Labour only.', createdAt: iso(-380) },
    { id: 'con-003', clientId: 'cl-003', machineId: 'mch-005', type: 'bronze',
      startDate: '2024-07-01', endDate: '2026-06-30',
      notes: 'Annual inspection only.', createdAt: iso(-300) },
  ];
  CONTRACTS.forEach(c => bset(COL.CONTRACTS, c.id, c));

  // ── 7. SEED GUARD ────────────────────────────────────────────
  bset('meta', 'seed', { seeded: 'v9', seededAt: new Date().toISOString() });

  await commit();
  console.log('[Seed] Demo seed v9 complete.');
}
