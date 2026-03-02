/* ============================================================
   storage.js — localStorage CRUD Wrappers
   ============================================================ */

const Storage = {

  // ── GENERIC ──────────────────────────────────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },

  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getOne(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  },

  // ── USERS ─────────────────────────────────────────────────
  getUsers() {
    return this.get(CONFIG.STORAGE_KEYS.USERS);
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email === email) || null;
  },

  createUser(data) {
    const users = this.getUsers();
    const user = { id: Utils.generateId(), createdAt: new Date().toISOString(), ...data };
    users.push(user);
    this.set(CONFIG.STORAGE_KEYS.USERS, users);
    return user;
  },

  updateUser(id, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    this.set(CONFIG.STORAGE_KEYS.USERS, users);
    return users[idx];
  },

  // ── CLIENTS ───────────────────────────────────────────────
  getClients() {
    return this.get(CONFIG.STORAGE_KEYS.CLIENTS);
  },

  getClientById(id) {
    return this.getClients().find(c => c.id === id) || null;
  },

  createClient(data) {
    const clients = this.getClients();
    const client = { id: Utils.generateId(), createdAt: new Date().toISOString(), ...data };
    clients.push(client);
    this.set(CONFIG.STORAGE_KEYS.CLIENTS, clients);
    return client;
  },

  updateClient(id, data) {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    clients[idx] = { ...clients[idx], ...data, updatedAt: new Date().toISOString() };
    this.set(CONFIG.STORAGE_KEYS.CLIENTS, clients);
    return clients[idx];
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    this.set(CONFIG.STORAGE_KEYS.CLIENTS, clients);
  },

  // ── MACHINES ──────────────────────────────────────────────
  getMachines() {
    return this.get(CONFIG.STORAGE_KEYS.MACHINES);
  },

  getMachineById(id) {
    return this.getMachines().find(m => m.id === id) || null;
  },

  getMachinesByClient(clientId) {
    return this.getMachines().filter(m => m.clientId === clientId);
  },

  createMachine(data) {
    const machines = this.getMachines();
    const now = new Date().toISOString();
    // Generate unique 6-digit job number not already in use
    let jobNumber;
    const existing = new Set(machines.map(m => m.jobNumber));
    do { jobNumber = String(Math.floor(100000 + Math.random() * 900000)); }
    while (existing.has(jobNumber));
    const machine = {
      id: Utils.generateId(),
      jobNumber,
      status: 'new',
      registeredAt: now,
      createdAt: now,
      ...data
    };
    machines.push(machine);
    this.set(CONFIG.STORAGE_KEYS.MACHINES, machines);
    return machine;
  },

  updateMachine(id, data) {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === id);
    if (idx === -1) return null;
    machines[idx] = { ...machines[idx], ...data, updatedAt: new Date().toISOString() };
    this.set(CONFIG.STORAGE_KEYS.MACHINES, machines);
    return machines[idx];
  },

  deleteMachine(id) {
    const machines = this.getMachines().filter(m => m.id !== id);
    this.set(CONFIG.STORAGE_KEYS.MACHINES, machines);
  },

  // ── INTERVENTIONS ──────────────────────────────────────────
  getInterventions() {
    return this.get(CONFIG.STORAGE_KEYS.INTERVENTIONS);
  },

  getInterventionById(id) {
    return this.getInterventions().find(i => i.id === id) || null;
  },

  getInterventionsByTechnician(techId) {
    return this.getInterventions().filter(i => i.technicianId === techId);
  },

  createIntervention(data) {
    const interventions = this.getInterventions();
    const now = new Date().toISOString();
    const intervention = {
      id: Utils.generateId(),
      createdAt: now,
      updatedAt: now,
      notes: [],
      parts: [],
      auditTrail: [{
        action: 'Created',
        user: data.createdBy || 'System',
        timestamp: now,
        details: `Status set to ${data.status || 'new'}`
      }],
      ...data
    };
    interventions.push(intervention);
    this.set(CONFIG.STORAGE_KEYS.INTERVENTIONS, interventions);
    return intervention;
  },

  updateIntervention(id, data, auditEntry) {
    const interventions = this.getInterventions();
    const idx = interventions.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const updated = { ...interventions[idx], ...data, updatedAt: now };
    if (auditEntry) {
      updated.auditTrail = [...(updated.auditTrail || []), {
        ...auditEntry,
        timestamp: now
      }];
    }
    interventions[idx] = updated;
    this.set(CONFIG.STORAGE_KEYS.INTERVENTIONS, interventions);
    return interventions[idx];
  },

  deleteIntervention(id) {
    const interventions = this.getInterventions().filter(i => i.id !== id);
    this.set(CONFIG.STORAGE_KEYS.INTERVENTIONS, interventions);
  },

  addInterventionNote(id, note) {
    const interventions = this.getInterventions();
    const idx = interventions.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const newNote = {
      id: Utils.generateId(),
      text: note.text,
      author: note.author,
      createdAt: new Date().toISOString()
    };
    interventions[idx].notes = [...(interventions[idx].notes || []), newNote];
    interventions[idx].updatedAt = new Date().toISOString();
    this.set(CONFIG.STORAGE_KEYS.INTERVENTIONS, interventions);
    return newNote;
  },

  addInterventionPart(id, part) {
    const interventions = this.getInterventions();
    const idx = interventions.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const newPart = {
      id: Utils.generateId(),
      reference: part.reference,
      description: part.description,
      quantity: part.quantity || 1,
      addedAt: new Date().toISOString()
    };
    interventions[idx].parts = [...(interventions[idx].parts || []), newPart];
    interventions[idx].updatedAt = new Date().toISOString();
    this.set(CONFIG.STORAGE_KEYS.INTERVENTIONS, interventions);
    return newPart;
  },

  // ── CONTRACTS ──────────────────────────────────────────────
  getContracts() {
    return this.get(CONFIG.STORAGE_KEYS.CONTRACTS);
  },

  getContractById(id) {
    return this.getContracts().find(c => c.id === id) || null;
  },

  createContract(data) {
    const contracts = this.getContracts();
    const contract = { id: Utils.generateId(), createdAt: new Date().toISOString(), ...data };
    contracts.push(contract);
    this.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
    return contract;
  },

  updateContract(id, data) {
    const contracts = this.getContracts();
    const idx = contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    contracts[idx] = { ...contracts[idx], ...data };
    this.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
    return contracts[idx];
  },

  deleteContract(id) {
    const contracts = this.getContracts().filter(c => c.id !== id);
    this.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
  }
};
