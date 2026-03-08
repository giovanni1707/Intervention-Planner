/* ============================================================
   views/maintenance-contracts.js — Maintenance Contracts Management
   ============================================================ */

window.Views = window.Views || {};

Views.MaintenanceContracts = {

  /* ── HELPERS ─────────────────────────────────────────────── */

  // Returns interval in months based on visits/year
  _intervalMonths(visitsPerYear) {
    const map = { 1: 12, 2: 6, 3: 4, 4: 3 };
    return map[visitsPerYear] || 12;
  },

  // Generate scheduled maintenance dates from contract start/end + frequency
  _generateSchedule(startDate, endDate, visitsPerYear) {
    const interval = this._intervalMonths(visitsPerYear);
    const dates = [];
    const start = new Date(startDate);
    const end   = new Date(endDate);
    let current = new Date(start);
    // First visit on start date
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + interval);
    }
    return dates;
  },

  // Contract status: expired / expiring-soon (≤30 days) / active
  _contractStatus(endDate) {
    const now     = new Date();
    const end     = new Date(endDate);
    const diffMs  = end - now;
    const diffDay = Math.ceil(diffMs / 86400000);
    if (diffDay < 0)  return 'expired';
    if (diffDay <= 30) return 'expiring';
    return 'active';
  },

  _statusBadge(status) {
    const map = {
      active:   { label: 'Active',         bg: '#D1FAE5', color: '#065F46' },
      expiring: { label: 'Expiring Soon',  bg: '#FEF3C7', color: '#92400E' },
      expired:  { label: 'Expired',        bg: '#FEE2E2', color: '#991B1B' }
    };
    const m = map[status] || map.active;
    return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;background:${m.bg};color:${m.color}">${m.label}</span>`;
  },

  // Count completed & remaining scheduled visits for a contract
  _visitStats(contract) {
    const schedule    = contract.schedule || [];
    const today       = new Date();
    today.setHours(0, 0, 0, 0);
    const completed   = contract.completedVisits || [];
    const remaining   = schedule.filter(d => new Date(d) > today && !completed.includes(d));
    const overdue     = schedule.filter(d => new Date(d) <= today && !completed.includes(d));
    return {
      total:     schedule.length,
      completed: completed.length,
      remaining: remaining.length,
      overdue:   overdue.length
    };
  },

  // Next upcoming (not yet completed) scheduled date
  _nextVisit(contract) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedule   = (contract.schedule || []).sort();
    const completed  = contract.completedVisits || [];
    return schedule.find(d => new Date(d) >= today && !completed.includes(d)) || null;
  },

  /* ── MOUNT ───────────────────────────────────────────────── */
  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
    this._checkNotifications();
  },

  /* ── TEMPLATE ────────────────────────────────────────────── */
  _template() {
    const contracts  = Storage.getMaintenanceContracts();
    const clients    = Storage.getClients();
    const machines   = Storage.getMachines();

    // KPI calculations
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const active    = contracts.filter(c => this._contractStatus(c.endDate) === 'active');
    const expiring  = contracts.filter(c => this._contractStatus(c.endDate) === 'expiring');
    const expired   = contracts.filter(c => this._contractStatus(c.endDate) === 'expired');
    const totalComp = contracts.reduce((sum, c) => sum + (c.completedVisits || []).length, 0);
    const totalRem  = contracts.reduce((sum, c) => {
      const s = this._visitStats(c);
      return sum + s.remaining;
    }, 0);

    const isAdmin = Auth.isAdmin();

    /* Notification banner for expiring + overdue */
    const expiringBanner = expiring.length > 0 ? `
      <div style="margin-bottom:12px;padding:12px 20px;background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:0.857rem;color:#92400E">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span><strong>${expiring.length} contract${expiring.length > 1 ? 's' : ''}</strong> expiring within 30 days. Review and renew as needed.</span>
      </div>
    ` : '';

    /* Table rows */
    const rows = contracts.length === 0 ? `
      <tr><td colspan="9">
        <div class="table-empty">
          <p class="table-empty-text">No maintenance contracts found</p>
          ${isAdmin ? `<p style="font-size:0.8rem;color:var(--gray-400);margin-top:4px">Click "Add Contract" to register the first one.</p>` : ''}
        </div>
      </td></tr>
    ` : contracts.map(contract => {
      const client  = clients.find(c => c.id === contract.clientId);
      const machine = machines.find(m => m.id === contract.machineId);
      const stats   = this._visitStats(contract);
      const status  = this._contractStatus(contract.endDate);
      const nextV   = this._nextVisit(contract);
      const progPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const progColor = progPct >= 80 ? '#10B981' : progPct >= 40 ? '#F59E0B' : '#3B82F6';

      return `
        <tr>
          <td>
            <div style="font-weight:600">${Utils.escapeHtml(client ? client.name : '—')}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${client ? Utils.escapeHtml(client.region || '') : ''}</div>
          </td>
          <td>
            <div style="font-weight:500">${Utils.escapeHtml(machine ? machine.model : '—')}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${Utils.escapeHtml(contract.serialNumber || (machine ? machine.serialNumber : '—'))}</div>
          </td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.startDate)}</td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.endDate)}</td>
          <td style="text-align:center;font-weight:600">${contract.visitsPerYear}×/yr</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px;min-width:60px">
                <div style="width:${progPct}%;background:${progColor};height:6px;border-radius:4px"></div>
              </div>
              <span style="font-size:0.8rem;white-space:nowrap;color:var(--gray-600)">${stats.completed}/${stats.total}</span>
            </div>
            ${stats.overdue > 0 ? `<div style="font-size:0.75rem;color:var(--red);margin-top:2px">${stats.overdue} overdue</div>` : ''}
          </td>
          <td style="font-size:0.857rem;white-space:nowrap">
            ${nextV ? Utils.formatDate(nextV) : '<span style="color:var(--gray-400)">—</span>'}
          </td>
          <td>${this._statusBadge(status)}</td>
          <td>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details"
                      onclick="Views.MaintenanceContracts.openDetailModal('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${isAdmin ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit Contract"
                      onclick="Views.MaintenanceContracts.openEditModal('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete Contract" style="color:var(--red)"
                      onclick="Views.MaintenanceContracts._confirmDelete('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Maintenance Contracts</h1>
          <p class="page-subtitle">Manage and track yearly equipment maintenance agreements</p>
        </div>
        ${isAdmin ? `
        <div>
          <button class="btn btn-primary" id="addContractBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contract
          </button>
        </div>` : ''}
      </div>

      <!-- KPI Cards -->
      <div class="grid-4" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-label">Active Contracts</div>
          <div class="kpi-value">${active.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Expiring Soon</div>
          <div class="kpi-value" style="color:var(--yellow)">${expiring.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Completed Visits</div>
          <div class="kpi-value" style="color:var(--green-dark, #059669)">${totalComp}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Remaining Visits</div>
          <div class="kpi-value">${totalRem}</div>
        </div>
      </div>

      ${expiringBanner}

      <div class="card">
        <div class="card-header">
          <span class="card-title">Contracts</span>
          <span class="text-sm text-muted">${contracts.length} total &bull; ${expired.length} expired</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Machine / Serial</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Freq.</th>
                  <th>Progress</th>
                  <th>Next Visit</th>
                  <th>Status</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ── BIND EVENTS ─────────────────────────────────────────── */
  _bindEvents() {
    const addBtn = document.getElementById('addContractBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.openCreateModal());
  },

  /* ── NOTIFICATIONS ───────────────────────────────────────── */
  _checkNotifications() {
    if (!Auth.isAdmin()) return;
    const contracts = Storage.getMaintenanceContracts();
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    contracts.forEach(contract => {
      const clients  = Storage.getClients();
      const machines = Storage.getMachines();
      const client   = clients.find(c => c.id === contract.clientId);
      const machine  = machines.find(m => m.id === contract.machineId);
      const label    = `${client ? client.name : '?'} — ${machine ? machine.model : '?'}`;

      // Expiry notifications (30 & 7 days)
      const end     = new Date(contract.endDate);
      const diffDay = Math.ceil((end - today) / 86400000);
      const notifKey = `bps_mc_notif_${contract.id}`;
      const notified  = JSON.parse(sessionStorage.getItem(notifKey) || '{}');

      if (diffDay >= 0 && diffDay <= 7 && !notified.expiry7) {
        Toast.warning(`Contract expiring in ${diffDay} day${diffDay !== 1 ? 's' : ''}: ${label}`);
        notified.expiry7 = true;
        sessionStorage.setItem(notifKey, JSON.stringify(notified));
      } else if (diffDay > 7 && diffDay <= 30 && !notified.expiry30) {
        Toast.warning(`Contract expiring in ${diffDay} days: ${label}`);
        notified.expiry30 = true;
        sessionStorage.setItem(notifKey, JSON.stringify(notified));
      }

      // Upcoming maintenance notifications (7 & 1 day before)
      const nextV = this._nextVisit(contract);
      if (nextV) {
        const visitDiff = Math.ceil((new Date(nextV) - today) / 86400000);
        if (visitDiff === 1 && !notified.visit1) {
          Toast.warning(`Maintenance due tomorrow: ${label}`);
          notified.visit1 = true;
          sessionStorage.setItem(notifKey, JSON.stringify(notified));
        } else if (visitDiff <= 7 && visitDiff > 1 && !notified.visit7) {
          Toast.warning(`Maintenance due in ${visitDiff} days: ${label}`);
          notified.visit7 = true;
          sessionStorage.setItem(notifKey, JSON.stringify(notified));
        }
      }
    });
  },

  /* ── CREATE MODAL ────────────────────────────────────────── */
  openCreateModal() {
    const clients  = Storage.getClients();
    const machines = Storage.getMachines();

    const clientOpts = clients.map(c =>
      `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    const body = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client <span style="color:var(--red)">*</span></label>
          <select id="mcClient" class="form-select" onchange="Views.MaintenanceContracts._populateMachines()">
            <option value="">— Select Client —</option>
            ${clientOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Machine <span style="color:var(--red)">*</span></label>
          <select id="mcMachine" class="form-select">
            <option value="">— Select Client First —</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Serial Number <span style="font-size:0.8rem;color:var(--gray-500)">(auto-filled or override)</span></label>
        <input type="text" id="mcSerial" class="form-input" placeholder="e.g. SN-123456">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date <span style="color:var(--red)">*</span></label>
          <input type="date" id="mcStart" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">End Date <span style="color:var(--red)">*</span></label>
          <input type="date" id="mcEnd" class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Maintenances per Year <span style="color:var(--red)">*</span></label>
        <select id="mcVisits" class="form-select">
          <option value="1">1 per year (every 12 months)</option>
          <option value="2" selected>2 per year (every 6 months)</option>
          <option value="3">3 per year (every 4 months)</option>
          <option value="4">4 per year (every 3 months)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea id="mcNotes" class="form-input" rows="2" placeholder="Optional notes..."></textarea>
      </div>
      <div id="mcError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.MaintenanceContracts._submitCreate()">Create Contract</button>
    `;

    Modals.open('Add Maintenance Contract', body, footer);
  },

  _populateMachines(selectedMachineId) {
    const clientId = document.getElementById('mcClient')?.value ||
                     document.getElementById('ecClient')?.value;
    const machSel  = document.getElementById('mcMachine') ||
                     document.getElementById('ecMachine');
    if (!machSel) return;
    const machines = Storage.getMachinesByClient(clientId);
    machSel.innerHTML = machines.length
      ? machines.map(m => `<option value="${m.id}" ${m.id === selectedMachineId ? 'selected' : ''}>${Utils.escapeHtml(m.model)} — ${Utils.escapeHtml(m.serialNumber || '')}</option>`).join('')
      : `<option value="">No machines for this client</option>`;

    // Auto-fill serial
    const serial = document.getElementById('mcSerial') || document.getElementById('ecSerial');
    if (serial && machines.length) {
      const m = selectedMachineId ? machines.find(x => x.id === selectedMachineId) : machines[0];
      if (m && !serial.value) serial.value = m.serialNumber || '';
    }

    // Also listen for machine change to update serial
    machSel.addEventListener('change', () => {
      const m = Storage.getMachineById(machSel.value);
      const s = document.getElementById('mcSerial') || document.getElementById('ecSerial');
      if (m && s) s.value = m.serialNumber || '';
    });
  },

  _submitCreate() {
    const clientId    = document.getElementById('mcClient')?.value;
    const machineId   = document.getElementById('mcMachine')?.value;
    const serial      = document.getElementById('mcSerial')?.value.trim();
    const startDate   = document.getElementById('mcStart')?.value;
    const endDate     = document.getElementById('mcEnd')?.value;
    const visitsPerYear = parseInt(document.getElementById('mcVisits')?.value, 10);
    const notes       = document.getElementById('mcNotes')?.value.trim();
    const errEl       = document.getElementById('mcError');
    const showErr     = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!clientId)   return showErr('Please select a client.');
    if (!machineId)  return showErr('Please select a machine.');
    if (!startDate)  return showErr('Start date is required.');
    if (!endDate)    return showErr('End date is required.');
    if (new Date(endDate) <= new Date(startDate)) return showErr('End date must be after start date.');

    const schedule = this._generateSchedule(startDate, endDate, visitsPerYear);

    Storage.createMaintenanceContract({
      clientId, machineId,
      serialNumber: serial,
      startDate, endDate,
      visitsPerYear,
      schedule,
      completedVisits: [],
      notes,
      createdBy: appState.currentUser?.name || 'Admin'
    });

    Modals.close();
    Toast.success('Maintenance contract created.');
    this.mount();
  },

  /* ── EDIT MODAL ──────────────────────────────────────────── */
  openEditModal(contractId) {
    const contract = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;

    const clients    = Storage.getClients();
    const machines   = Storage.getMachinesByClient(contract.clientId);

    const clientOpts = clients.map(c =>
      `<option value="${c.id}" ${c.id === contract.clientId ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    const machOpts = machines.map(m =>
      `<option value="${m.id}" ${m.id === contract.machineId ? 'selected' : ''}>${Utils.escapeHtml(m.model)} — ${Utils.escapeHtml(m.serialNumber || '')}</option>`
    ).join('');

    const body = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client <span style="color:var(--red)">*</span></label>
          <select id="ecClient" class="form-select" onchange="Views.MaintenanceContracts._populateMachines()">
            <option value="">— Select Client —</option>
            ${clientOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Machine <span style="color:var(--red)">*</span></label>
          <select id="ecMachine" class="form-select">${machOpts}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Serial Number</label>
        <input type="text" id="ecSerial" class="form-input" value="${Utils.escapeHtml(contract.serialNumber || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date <span style="color:var(--red)">*</span></label>
          <input type="date" id="ecStart" class="form-input" value="${contract.startDate}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date <span style="color:var(--red)">*</span></label>
          <input type="date" id="ecEnd" class="form-input" value="${contract.endDate}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Maintenances per Year <span style="color:var(--red)">*</span></label>
        <select id="ecVisits" class="form-select">
          <option value="1" ${contract.visitsPerYear === 1 ? 'selected' : ''}>1 per year (every 12 months)</option>
          <option value="2" ${contract.visitsPerYear === 2 ? 'selected' : ''}>2 per year (every 6 months)</option>
          <option value="3" ${contract.visitsPerYear === 3 ? 'selected' : ''}>3 per year (every 4 months)</option>
          <option value="4" ${contract.visitsPerYear === 4 ? 'selected' : ''}>4 per year (every 3 months)</option>
        </select>
      </div>
      <div style="padding:10px 12px;background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;font-size:0.8rem;color:#92400E;margin-bottom:12px">
        <strong>Note:</strong> Changing dates or frequency will regenerate the maintenance schedule. Completed visits will be preserved where dates match.
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea id="ecNotes" class="form-input" rows="2">${Utils.escapeHtml(contract.notes || '')}</textarea>
      </div>
      <div id="ecError" class="error-msg hidden"></div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.MaintenanceContracts._submitEdit('${contractId}')">Save Changes</button>
    `;

    Modals.open(`Edit Contract`, body, footer);
  },

  _submitEdit(contractId) {
    const contract    = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;

    const clientId    = document.getElementById('ecClient')?.value;
    const machineId   = document.getElementById('ecMachine')?.value;
    const serial      = document.getElementById('ecSerial')?.value.trim();
    const startDate   = document.getElementById('ecStart')?.value;
    const endDate     = document.getElementById('ecEnd')?.value;
    const visitsPerYear = parseInt(document.getElementById('ecVisits')?.value, 10);
    const notes       = document.getElementById('ecNotes')?.value.trim();
    const errEl       = document.getElementById('ecError');
    const showErr     = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!clientId)   return showErr('Please select a client.');
    if (!machineId)  return showErr('Please select a machine.');
    if (!startDate)  return showErr('Start date is required.');
    if (!endDate)    return showErr('End date is required.');
    if (new Date(endDate) <= new Date(startDate)) return showErr('End date must be after start date.');

    // Regenerate schedule, preserve completed visits that still fall on a scheduled date
    const newSchedule = this._generateSchedule(startDate, endDate, visitsPerYear);
    const preserved   = (contract.completedVisits || []).filter(d => newSchedule.includes(d));

    Storage.updateMaintenanceContract(contractId, {
      clientId, machineId,
      serialNumber: serial,
      startDate, endDate,
      visitsPerYear,
      schedule: newSchedule,
      completedVisits: preserved,
      notes
    });

    Modals.close();
    Toast.success('Contract updated.');
    this.mount();
  },

  /* ── DELETE ──────────────────────────────────────────────── */
  _confirmDelete(contractId) {
    const contract = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;
    const clients  = Storage.getClients();
    const client   = clients.find(c => c.id === contract.clientId);

    Modals.confirm(
      `Delete maintenance contract for "${client ? client.name : 'this client'}"? This cannot be undone.`,
      'Delete Contract?'
    ).then(confirmed => {
      if (!confirmed) return;
      Storage.deleteMaintenanceContract(contractId);
      Toast.success('Contract deleted.');
      this.mount();
    });
  },

  /* ── DETAIL MODAL ────────────────────────────────────────── */
  openDetailModal(contractId) {
    const contract = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;

    const clients  = Storage.getClients();
    const machines = Storage.getMachines();
    const client   = clients.find(c => c.id === contract.clientId);
    const machine  = machines.find(m => m.id === contract.machineId);
    const stats    = this._visitStats(contract);
    const status   = this._contractStatus(contract.endDate);
    const isAdmin  = Auth.isAdmin();
    const progPct  = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const progColor = progPct >= 80 ? '#10B981' : progPct >= 40 ? '#F59E0B' : '#3B82F6';

    // Schedule table
    const scheduleRows = (contract.schedule || []).map((date, idx) => {
      const isCompleted = (contract.completedVisits || []).includes(date);
      const isPast      = new Date(date) < new Date();
      const isOverdue   = isPast && !isCompleted;
      const rowBg       = isCompleted ? '#F0FDF4' : isOverdue ? '#FEF2F2' : '';
      return `
        <tr style="background:${rowBg}">
          <td style="font-weight:500">Visit ${idx + 1}</td>
          <td>${Utils.formatDate(date)}</td>
          <td>
            ${isCompleted
              ? `<span style="color:#065F46;font-weight:600;font-size:0.857rem">&#10003; Completed</span>`
              : isOverdue
              ? `<span style="color:var(--red);font-size:0.857rem">Overdue</span>`
              : `<span style="color:var(--gray-500);font-size:0.857rem">Scheduled</span>`
            }
          </td>
          <td>
            ${isAdmin && !isCompleted ? `
              <button class="btn btn-ghost btn-sm" style="color:#059669;font-size:0.8rem"
                      onclick="Views.MaintenanceContracts._markVisitDone('${contractId}', '${date}')">
                Mark Done
              </button>` : ''}
            ${isAdmin && isCompleted ? `
              <button class="btn btn-ghost btn-sm" style="color:var(--gray-500);font-size:0.8rem"
                      onclick="Views.MaintenanceContracts._unmarkVisit('${contractId}', '${date}')">
                Undo
              </button>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const body = `
      <!-- Header info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;color:var(--gray-400);letter-spacing:.05em;margin-bottom:4px">Client</div>
          <div style="font-weight:700;font-size:1rem">${Utils.escapeHtml(client ? client.name : '—')}</div>
          <div style="font-size:0.857rem;color:var(--gray-500)">${client ? Utils.escapeHtml(client.region || '') : ''}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;color:var(--gray-400);letter-spacing:.05em;margin-bottom:4px">Machine</div>
          <div style="font-weight:700;font-size:1rem">${Utils.escapeHtml(machine ? machine.model : '—')}</div>
          <div style="font-size:0.857rem;color:var(--gray-500)">S/N: ${Utils.escapeHtml(contract.serialNumber || (machine ? machine.serialNumber : '—'))}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="padding:12px;background:var(--gray-50);border-radius:8px;text-align:center">
          <div style="font-size:0.75rem;color:var(--gray-500);margin-bottom:4px">Start</div>
          <div style="font-weight:600;font-size:0.9rem">${Utils.formatDate(contract.startDate)}</div>
        </div>
        <div style="padding:12px;background:var(--gray-50);border-radius:8px;text-align:center">
          <div style="font-size:0.75rem;color:var(--gray-500);margin-bottom:4px">End</div>
          <div style="font-weight:600;font-size:0.9rem">${Utils.formatDate(contract.endDate)}</div>
        </div>
        <div style="padding:12px;background:var(--gray-50);border-radius:8px;text-align:center">
          <div style="font-size:0.75rem;color:var(--gray-500);margin-bottom:4px">Frequency</div>
          <div style="font-weight:600;font-size:0.9rem">${contract.visitsPerYear}×/yr</div>
        </div>
        <div style="padding:12px;background:var(--gray-50);border-radius:8px;text-align:center">
          <div style="font-size:0.75rem;color:var(--gray-500);margin-bottom:4px">Status</div>
          <div>${this._statusBadge(status)}</div>
        </div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:0.857rem;font-weight:600">Completion Progress</span>
          <span style="font-size:0.857rem;color:var(--gray-600)">${stats.completed} / ${stats.total} visits (${progPct}%)</span>
        </div>
        <div style="background:var(--gray-200);border-radius:6px;height:10px">
          <div style="width:${progPct}%;background:${progColor};height:10px;border-radius:6px;transition:width 0.3s"></div>
        </div>
        ${stats.overdue > 0 ? `<div style="font-size:0.8rem;color:var(--red);margin-top:4px">${stats.overdue} visit${stats.overdue > 1 ? 's' : ''} overdue</div>` : ''}
      </div>

      ${contract.notes ? `
      <div style="margin-bottom:16px;padding:10px 14px;background:var(--gray-50);border-radius:6px;font-size:0.857rem;color:var(--gray-600)">
        <strong style="color:var(--gray-700)">Notes:</strong> ${Utils.escapeHtml(contract.notes)}
      </div>` : ''}

      <!-- Schedule Table -->
      <div style="font-weight:600;font-size:0.857rem;margin-bottom:8px;color:var(--gray-700)">Maintenance Schedule</div>
      <div class="table-wrapper" style="max-height:280px;overflow-y:auto">
        <table class="data-table" id="scheduleTable_${contractId}">
          <thead>
            <tr>
              <th>Visit</th>
              <th>Scheduled Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${scheduleRows || `<tr><td colspan="4" style="text-align:center;color:var(--gray-400)">No schedule generated</td></tr>`}</tbody>
        </table>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
      ${isAdmin ? `<button class="btn btn-primary" onclick="Modals.close();setTimeout(()=>Views.MaintenanceContracts.openEditModal('${contractId}'),80)">Edit Contract</button>` : ''}
    `;

    Modals.open(`Contract — ${client ? Utils.escapeHtml(client.name) : ''}`, body, footer, { size: 'lg' });
  },

  /* ── VISIT COMPLETION ────────────────────────────────────── */
  _markVisitDone(contractId, date) {
    const contract = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;
    const completed = [...(contract.completedVisits || [])];
    if (!completed.includes(date)) completed.push(date);
    Storage.updateMaintenanceContract(contractId, { completedVisits: completed });
    Toast.success(`Visit on ${Utils.formatDate(date)} marked as completed.`);
    // Refresh the detail modal in place
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId), 80);
    // Refresh main list in background
    setTimeout(() => {
      if (Router.getCurrent() === 'maintenance-contracts') this.mount();
    }, 200);
  },

  _unmarkVisit(contractId, date) {
    const contract = Storage.getMaintenanceContractById(contractId);
    if (!contract) return;
    const completed = (contract.completedVisits || []).filter(d => d !== date);
    Storage.updateMaintenanceContract(contractId, { completedVisits: completed });
    Toast.success(`Visit on ${Utils.formatDate(date)} marked as pending.`);
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId), 80);
    setTimeout(() => {
      if (Router.getCurrent() === 'maintenance-contracts') this.mount();
    }, 200);
  }
};
