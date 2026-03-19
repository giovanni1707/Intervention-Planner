/* ============================================================
   storage.js — Firestore CRUD Wrappers (async)
   All methods return Promises. Views must await them.
   ============================================================ */

const Storage = {

  // ── GENERIC HELPERS ──────────────────────────────────────

  /** Fetch all docs from a collection, returns array with id included */
  async _getAll(col) {
    const snap = await db.collection(col).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /** Get a single doc by Firestore doc ID */
  async _getById(col, id) {
    const snap = await db.collection(col).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  /** Set (overwrite) a doc */
  async _set(col, id, data) {
    await db.collection(col).doc(id).set(data);
  },

  /** Update (merge) a doc */
  async _update(col, id, data) {
    await db.collection(col).doc(id).update(data);
  },

  /** Delete a doc */
  async _delete(col, id) {
    await db.collection(col).doc(id).delete();
  },

  /** Add a new doc with auto-ID (or provided id as doc name) */
  async _add(col, data, id = null) {
    if (id) {
      await db.collection(col).doc(id).set(data);
      return { id, ...data };
    }
    const ref = await db.collection(col).add(data);
    return { id: ref.id, ...data };
  },

  // ── USERS ─────────────────────────────────────────────────

  async getUsers() {
    return this._getAll(COL.USERS);
  },

  async getUserById(id) {
    return this._getById(COL.USERS, id);
  },

  async getUserByEmail(email) {
    const snap = await db.collection(COL.USERS)
      .where('email', '==', email.toLowerCase())
      .limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },

  async createUser(data) {
    const now  = new Date().toISOString();
    const id   = data.id || Utils.generateId();
    const user = { createdAt: now, ...data, email: (data.email || '').toLowerCase(), id };
    await this._set(COL.USERS, id, user);
    return user;
  },

  async updateUser(id, data) {
    const updatedAt = new Date().toISOString();
    await this._update(COL.USERS, id, { ...data, updatedAt });
    return this._getById(COL.USERS, id);
  },

  async deleteUser(id) {
    await this._delete(COL.USERS, id);
  },

  // ── CLIENTS ───────────────────────────────────────────────

  async getClients() {
    return this._getAll(COL.CLIENTS);
  },

  async getClientById(id) {
    return this._getById(COL.CLIENTS, id);
  },

  async _generateClientNumber() {
    const clients  = await this.getClients();
    const existing = new Set(clients.map(c => c.clientNumber).filter(Boolean));
    let num;
    do { num = 'CLT-' + String(Math.floor(10000 + Math.random() * 90000)); }
    while (existing.has(num));
    return num;
  },

  async createClient(data) {
    const now          = new Date().toISOString();
    const id           = Utils.generateId();
    const clientNumber = await this._generateClientNumber();
    const client       = { createdAt: now, clientNumber, ...data, id };
    await this._set(COL.CLIENTS, id, client);
    return client;
  },

  async updateClient(id, data) {
    const updatedAt = new Date().toISOString();
    await this._update(COL.CLIENTS, id, { ...data, updatedAt });
    return this._getById(COL.CLIENTS, id);
  },

  async deleteClient(id) {
    await this._delete(COL.CLIENTS, id);
  },

  // ── MACHINES ──────────────────────────────────────────────

  async getMachines() {
    return this._getAll(COL.MACHINES);
  },

  async getMachineById(id) {
    return this._getById(COL.MACHINES, id);
  },

  async getMachinesByClient(clientId) {
    const snap = await db.collection(COL.MACHINES)
      .where('clientId', '==', clientId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createMachine(data) {
    const machines = await this.getMachines();
    const now      = new Date().toISOString();
    const id       = Utils.generateId();
    const existing = new Set(machines.map(m => m.jobNumber));
    let jobNumber;
    do { jobNumber = String(Math.floor(100000 + Math.random() * 900000)); }
    while (existing.has(jobNumber));
    const machine = {
      status: 'new',
      registeredAt: now,
      createdAt: now,
      ...data,
      jobNumber,
      id
    };
    await this._set(COL.MACHINES, id, machine);
    return machine;
  },

  async updateMachine(id, data) {
    const updatedAt = new Date().toISOString();
    await this._update(COL.MACHINES, id, { ...data, updatedAt });
    return this._getById(COL.MACHINES, id);
  },

  async deleteMachine(id) {
    await this._delete(COL.MACHINES, id);
  },

  // ── INTERVENTIONS ─────────────────────────────────────────

  async getInterventions() {
    return this._getAll(COL.INTERVENTIONS);
  },

  async getInterventionById(id) {
    return this._getById(COL.INTERVENTIONS, id);
  },

  async getInterventionsByTechnician(techId) {
    const all = await this.getInterventions();
    return all.filter(i => Utils.getTechIds(i).includes(techId));
  },

  async createIntervention(data) {
    const now           = new Date().toISOString();
    const id            = Utils.generateId();
    const initialStatus = data.status || 'new';
    const intervention  = {
      createdAt: now,
      updatedAt: now,
      statusUpdatedAt: now,
      technicianId: null,
      notes: [],
      parts: [],
      scheduledHistory: data.scheduledDate ? [{
        scheduledDate: data.scheduledDate,
        status: initialStatus,
        technicianIds: data.technicianIds || (data.technicianId ? [data.technicianId] : []),
        technicianId:  data.technicianId || null,
        changedBy:     data.createdBy || 'System',
        timestamp:     now
      }] : [],
      statusHistory: [{
        status:    initialStatus,
        changedBy: data.createdBy || 'System',
        timestamp: now,
        note:      'Intervention created'
      }],
      auditTrail: [{
        action:    'Created',
        user:      data.createdBy || 'System',
        timestamp: now,
        details:   `Status set to ${initialStatus}`
      }],
      ...data,
      id
    };
    await this._set(COL.INTERVENTIONS, id, intervention);
    return intervention;
  },

  async updateIntervention(id, data, auditEntry) {
    const existing = await this._getById(COL.INTERVENTIONS, id);
    if (!existing) return null;
    const now     = new Date().toISOString();
    const updated = { ...existing, ...data, updatedAt: now };

    const statusChanged = data.status && data.status !== existing.status;
    if (statusChanged || auditEntry?.statusNote) {
      if (statusChanged) updated.statusUpdatedAt = now;
      const historyEntry = {
        status:    data.status || existing.status,
        changedBy: auditEntry?.user || 'System',
        timestamp: now,
        note:      auditEntry?.statusNote || ''
      };
      updated.statusHistory = [...(existing.statusHistory || []), historyEntry];
    }

    const FINAL_STATUSES = ['completed', 'cancelled'];
    const newStatus    = data.status || existing.status;
    const newTechId    = data.technicianId  !== undefined ? data.technicianId  : existing.technicianId;
    const newTechIds   = data.technicianIds !== undefined ? data.technicianIds : (existing.technicianIds || (existing.technicianId ? [existing.technicianId] : []));
    const dateChanged  = data.scheduledDate !== undefined && data.scheduledDate !== existing.scheduledDate;
    const techChanged  = data.technicianIds !== undefined
      ? JSON.stringify(data.technicianIds.slice().sort()) !== JSON.stringify((existing.technicianIds || []).slice().sort())
      : (data.technicianId !== undefined && data.technicianId !== existing.technicianId);
    const isTracked    = !FINAL_STATUSES.includes(newStatus);
    const hasSchedule  = data.scheduledDate || existing.scheduledDate;
    const shouldRecord = isTracked && hasSchedule && (dateChanged || (techChanged && !dateChanged) || statusChanged);

    if (shouldRecord) {
      const schedEntry = {
        scheduledDate: data.scheduledDate || existing.scheduledDate,
        status:        newStatus,
        technicianIds: newTechIds,
        technicianId:  newTechId,
        changedBy:     auditEntry?.user || 'System',
        timestamp:     now
      };
      updated.scheduledHistory = [...(existing.scheduledHistory || []), schedEntry];
    }

    if (auditEntry) {
      updated.auditTrail = [...(updated.auditTrail || []), { ...auditEntry, timestamp: now }];
    }

    await this._set(COL.INTERVENTIONS, id, updated);
    return updated;
  },

  async deleteIntervention(id) {
    await this._delete(COL.INTERVENTIONS, id);
  },

  async addInterventionNote(id, note) {
    const intervention = await this._getById(COL.INTERVENTIONS, id);
    if (!intervention) return null;
    const newNote = {
      id:        Utils.generateId(),
      text:      note.text,
      author:    note.author,
      createdAt: new Date().toISOString()
    };
    const notes     = [...(intervention.notes || []), newNote];
    const updatedAt = new Date().toISOString();
    await this._update(COL.INTERVENTIONS, id, { notes, updatedAt });
    return newNote;
  },

  async addInterventionPart(id, part) {
    const intervention = await this._getById(COL.INTERVENTIONS, id);
    if (!intervention) return null;
    const newPart = {
      id:          Utils.generateId(),
      reference:   part.reference,
      description: part.description,
      quantity:    part.quantity || 1,
      unit:        part.unit || 'pcs',
      addedAt:     new Date().toISOString()
    };
    const parts     = [...(intervention.parts || []), newPart];
    const updatedAt = new Date().toISOString();
    await this._update(COL.INTERVENTIONS, id, { parts, updatedAt });
    return newPart;
  },

  // ── DELETED JOBS ──────────────────────────────────────────

  async getDeletedJobs() {
    const snap = await db.collection(COL.DELETED_JOBS)
      .orderBy('deletedAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async archiveDeletedJob(record) {
    const id = Utils.generateId();
    await this._set(COL.DELETED_JOBS, id, { ...record, id });
  },

  async purgeDeletedJob(jobNumber) {
    const snap = await db.collection(COL.DELETED_JOBS)
      .where('jobNumber', '==', jobNumber).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  // ── ACTION LOG ────────────────────────────────────────────

  async getActionLog() {
    const snap = await db.collection(COL.ACTION_LOG)
      .orderBy('timestamp', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async logAction(entry) {
    const id  = Utils.generateId();
    const log = { id, timestamp: new Date().toISOString(), ...entry };
    await this._set(COL.ACTION_LOG, id, log);
  },

  // ── CONTRACTS ─────────────────────────────────────────────

  async getContracts() {
    return this._getAll(COL.CONTRACTS);
  },

  async getContractById(id) {
    return this._getById(COL.CONTRACTS, id);
  },

  async createContract(data) {
    const id       = Utils.generateId();
    const contract = { createdAt: new Date().toISOString(), ...data, id };
    await this._set(COL.CONTRACTS, id, contract);
    return contract;
  },

  async updateContract(id, data) {
    await this._update(COL.CONTRACTS, id, data);
    return this._getById(COL.CONTRACTS, id);
  },

  async deleteContract(id) {
    await this._delete(COL.CONTRACTS, id);
  },

  // ── MAINTENANCE CONTRACTS ─────────────────────────────────

  async getMaintenanceContracts() {
    return this._getAll(COL.MAINTENANCE_CONTRACTS);
  },

  async getMaintenanceContractById(id) {
    return this._getById(COL.MAINTENANCE_CONTRACTS, id);
  },

  async createMaintenanceContract(data) {
    const id       = Utils.generateId();
    const contract = { createdAt: new Date().toISOString(), ...data, id };
    await this._set(COL.MAINTENANCE_CONTRACTS, id, contract);
    return contract;
  },

  async updateMaintenanceContract(id, data) {
    const updatedAt = new Date().toISOString();
    await this._update(COL.MAINTENANCE_CONTRACTS, id, { ...data, updatedAt });
    return this._getById(COL.MAINTENANCE_CONTRACTS, id);
  },

  async deleteMaintenanceContract(id) {
    await this._delete(COL.MAINTENANCE_CONTRACTS, id);
  }
};
