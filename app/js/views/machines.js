/* ============================================================
   views/machines.js — Machine Management View
   ============================================================ */

Views.Machines = {
  _searchTerm: '',
  _filterClient: 'all',

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderTable(this._getFiltered());
    this._bindEvents();
  },

  _getFiltered() {
    let machines = appState.machines;
    if (this._filterClient !== 'all') {
      machines = machines.filter(m => m.clientId === this._filterClient);
    }
    if (this._searchTerm) {
      const q = this._searchTerm.toLowerCase();
      machines = machines.filter(m => {
        const client = appState.clients.find(c => c.id === m.clientId);
        return [m.model, m.serialNumber, m.type, m.location, client?.name].join(' ').toLowerCase().includes(q);
      });
    }
    return machines;
  },

  _template() {
    const clientOptions = appState.clients.map(c =>
      `<option value="${c.id}" ${this._filterClient === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Machines</h1>
          <p class="page-subtitle">${appState.machines.length} machine${appState.machines.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Views.Machines._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Machine
          </button>
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar-filters">
          <div class="search-bar">
            <span class="search-bar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="machineSearch" class="search-input" placeholder="Search machines…" value="${Utils.escapeHtml(this._searchTerm)}">
          </div>
          <select id="machineClientFilter" class="toolbar-select">
            <option value="all" ${this._filterClient === 'all' ? 'selected' : ''}>All Clients</option>
            ${clientOptions}
          </select>
        </div>
        <span id="machineCount" class="text-sm text-muted"></span>
      </div>

      <div class="table-wrapper has-toolbar">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Type</th>
              <th>Client</th>
              <th>Location</th>
              <th>Install Date</th>
              <th>Contract</th>
              <th>Contract Expiry</th>
              <th style="width:80px"></th>
            </tr>
          </thead>
          <tbody id="machineTableBody"></tbody>
        </table>
      </div>
    `;
  },

  _renderTable(machines) {
    const tbody   = document.getElementById('machineTableBody');
    const countEl = document.getElementById('machineCount');
    if (!tbody) return;
    if (countEl) countEl.textContent = `${machines.length} result${machines.length !== 1 ? 's' : ''}`;

    if (machines.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="9">
          <div class="table-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
            <p class="table-empty-text">No machines found</p>
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = machines.map(m => {
      const client = appState.clients.find(c => c.id === m.clientId);
      const isExpired = m.contractExpiry && new Date(m.contractExpiry) < new Date();
      const expiryClass = isExpired ? 'style="color:var(--red)"' : '';
      return `
        <tr>
          <td class="td-primary">${Utils.escapeHtml(m.model)}</td>
          <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m.serialNumber)}</td>
          <td>${Utils.escapeHtml(m.type || '—')}</td>
          <td>${Utils.escapeHtml(client?.name || '—')}</td>
          <td>${Utils.escapeHtml(m.location || '—')}</td>
          <td style="white-space:nowrap">${Utils.formatDate(m.installDate)}</td>
          <td>${Utils.getContractBadge(m.contractType || 'none')}</td>
          <td ${expiryClass} style="white-space:nowrap">${m.contractExpiry ? Utils.formatDate(m.contractExpiry) : '—'}${isExpired ? ' <span class="badge badge-cancelled" style="font-size:0.643rem">Expired</span>' : ''}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Machines._openEditModal('${m.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete" style="color:var(--red)" onclick="Views.Machines._deleteMachine('${m.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  _bindEvents() {
    const searchInput = document.getElementById('machineSearch');
    const clientFilter = document.getElementById('machineClientFilter');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this._searchTerm = searchInput.value;
        this._renderTable(this._getFiltered());
      });
    }
    if (clientFilter) {
      clientFilter.addEventListener('change', () => {
        this._filterClient = clientFilter.value;
        this._renderTable(this._getFiltered());
      });
    }
  },

  _machineFormHTML(machine = {}) {
    const clientOptions = appState.clients.map(c =>
      `<option value="${c.id}" ${machine.clientId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    const contractTypes = Object.entries(CONFIG.CONTRACT_TYPES).map(([k, v]) =>
      `<option value="${k}" ${(machine.contractType || 'none') === k ? 'selected' : ''}>${v}</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Model <span class="required">*</span></label>
          <input type="text" id="fMachineModel" class="form-input" value="${Utils.escapeHtml(machine.model || '')}" required placeholder="e.g. MULTIVAC R230">
        </div>
        <div class="form-group">
          <label class="form-label">Serial Number <span class="required">*</span></label>
          <input type="text" id="fMachineSerial" class="form-input" value="${Utils.escapeHtml(machine.serialNumber || '')}" required placeholder="MV-XXXX-YYYY-NNN">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Type</label>
          <input type="text" id="fMachineType" class="form-input" value="${Utils.escapeHtml(machine.type || '')}" placeholder="e.g. Tray Sealer">
        </div>
        <div class="form-group">
          <label class="form-label">Client <span class="required">*</span></label>
          <select id="fMachineClient" class="form-select">
            <option value="">— Select client —</option>
            ${clientOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Line</label>
          <input type="text" id="fMachineLocation" class="form-input" value="${Utils.escapeHtml(machine.location || '')}" placeholder="e.g. Production Line A">
        </div>
        <div class="form-group">
          <label class="form-label">Install Date</label>
          <input type="date" id="fMachineInstall" class="form-input" value="${machine.installDate || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contract Type</label>
          <select id="fMachineContract" class="form-select">${contractTypes}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Contract Expiry Date</label>
          <input type="date" id="fMachineExpiry" class="form-input" value="${machine.contractExpiry || ''}">
        </div>
      </div>
    `;
  },

  _openCreateModal() {
    Modals.open('Add New Machine', this._machineFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Machines._submitCreate()">Add Machine</button>
    `);
  },

  _submitCreate() {
    const model    = document.getElementById('fMachineModel')?.value.trim();
    const serial   = document.getElementById('fMachineSerial')?.value.trim();
    const clientId = document.getElementById('fMachineClient')?.value;

    if (!model)    { Toast.error('Machine model is required'); return; }
    if (!serial)   { Toast.error('Serial number is required'); return; }
    if (!clientId) { Toast.error('Please select a client'); return; }

    Storage.createMachine({
      model, serialNumber: serial, clientId,
      type:         document.getElementById('fMachineType')?.value.trim() || '',
      location:     document.getElementById('fMachineLocation')?.value.trim() || '',
      installDate:  document.getElementById('fMachineInstall')?.value || null,
      contractType: document.getElementById('fMachineContract')?.value || 'none',
      contractExpiry: document.getElementById('fMachineExpiry')?.value || null
    });

    refreshMachines();
    Modals.close();
    Toast.success(`Machine "${model}" added successfully`);
    this.mount();
  },

  _openEditModal(machineId) {
    const machine = Storage.getMachineById(machineId);
    if (!machine) return;

    Modals.open(`Edit Machine — ${machine.model}`, this._machineFormHTML(machine), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Machines._submitEdit('${machineId}')">Save Changes</button>
    `);
  },

  _submitEdit(machineId) {
    const model    = document.getElementById('fMachineModel')?.value.trim();
    const serial   = document.getElementById('fMachineSerial')?.value.trim();
    const clientId = document.getElementById('fMachineClient')?.value;

    if (!model)    { Toast.error('Machine model is required'); return; }
    if (!serial)   { Toast.error('Serial number is required'); return; }
    if (!clientId) { Toast.error('Please select a client'); return; }

    Storage.updateMachine(machineId, {
      model, serialNumber: serial, clientId,
      type:           document.getElementById('fMachineType')?.value.trim() || '',
      location:       document.getElementById('fMachineLocation')?.value.trim() || '',
      installDate:    document.getElementById('fMachineInstall')?.value || null,
      contractType:   document.getElementById('fMachineContract')?.value || 'none',
      contractExpiry: document.getElementById('fMachineExpiry')?.value || null
    });

    refreshMachines();
    Modals.close();
    Toast.success('Machine updated successfully');
    this.mount();
  },

  async _deleteMachine(machineId) {
    const machine = Storage.getMachineById(machineId);
    if (!machine) return;

    const interventionCount = appState.interventions.filter(i => i.machineId === machineId).length;
    let msg = `Delete "${machine.model}" (${machine.serialNumber})?`;
    if (interventionCount > 0) {
      msg += ` This machine has ${interventionCount} intervention(s) linked.`;
    }

    const confirmed = await Modals.confirm(msg, 'Delete Machine');
    if (!confirmed) return;

    Storage.deleteMachine(machineId);
    refreshMachines();
    Toast.success('Machine deleted');
    this.mount();
  }
};
