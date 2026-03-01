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
              <th style="width:110px"></th>
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
      const hasContract = m.contractType && m.contractType !== 'none';
      const isExpired = hasContract && m.contractExpiry && new Date(m.contractExpiry) < new Date();
      const expiryClass = isExpired ? 'style="color:var(--red)"' : '';
      const expiryCell = !hasContract
        ? '—'
        : (m.contractExpiry ? Utils.formatDate(m.contractExpiry) : '—') + (isExpired ? ' <span class="badge badge-cancelled" style="font-size:0.643rem">Expired</span>' : '');
      return `
        <tr>
          <td class="td-primary">${Utils.escapeHtml(m.model)}</td>
          <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m.serialNumber)}</td>
          <td>${Utils.escapeHtml(m.type || '—')}</td>
          <td>${Utils.escapeHtml(client?.name || '—')}</td>
          <td>${Utils.escapeHtml(m.location || '—')}</td>
          <td style="white-space:nowrap">${Utils.formatDate(m.installDate)}</td>
          <td>${Utils.getContractBadge(m.contractType || 'none')}</td>
          <td ${expiryClass} style="white-space:nowrap">${expiryCell}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details" onclick="Views.Machines.openDetailModal('${m.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
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
          <select id="fMachineContract" class="form-select" onchange="Views.Machines._toggleExpiryField(this.value)">${contractTypes}</select>
        </div>
        <div class="form-group" id="fMachineExpiryGroup" ${(machine.contractType || 'none') === 'none' ? 'style="display:none"' : ''}>
          <label class="form-label">Contract Expiry Date</label>
          <input type="date" id="fMachineExpiry" class="form-input" value="${machine.contractExpiry || ''}">
        </div>
      </div>
    `;
  },

  _toggleExpiryField(contractType) {
    const group = document.getElementById('fMachineExpiryGroup');
    if (!group) return;
    if (contractType === 'none') {
      group.style.display = 'none';
      const input = document.getElementById('fMachineExpiry');
      if (input) input.value = '';
    } else {
      group.style.display = '';
    }
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

  openDetailModal(machineId) {
    const machine = Storage.getMachineById(machineId);
    if (!machine) return;

    const client   = appState.clients.find(c => c.id === machine.clientId);
    const history  = appState.interventions
      .filter(i => i.machineId === machineId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const isExpired = machine.contractExpiry && new Date(machine.contractExpiry) < new Date();

    const historyHTML = history.length === 0
      ? '<p class="text-sm text-muted" style="padding:8px 0">No interventions recorded for this machine.</p>'
      : `<table class="data-table" style="margin-top:0">
          <thead>
            <tr>
              <th>Status</th><th>Priority</th><th>Type</th>
              <th>Location</th><th>Technician</th><th>Scheduled</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${history.map(i => `
              <tr>
                <td>${Utils.getStatusBadge(i.status)}</td>
                <td>${Utils.getPriorityBadge(i.priority)}</td>
                <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
                <td style="font-size:0.786rem">${i.location === 'workshop' ? 'Workshop' : 'Client Premises'}</td>
                <td style="font-size:0.786rem">${Utils.escapeHtml(Utils.getTechnicianName(i.technicianId))}</td>
                <td style="font-size:0.786rem;white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm btn-icon" title="View"
                    onclick="Modals.close(); setTimeout(() => Views.Interventions.openDetailModal('${i.id}'), 100)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Machine info -->
        <div>
          <div class="detail-section-label">Machine Details</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-field-label">Model</div>
              <div class="detail-field-value">${Utils.escapeHtml(machine.model)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Serial Number</div>
              <div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(machine.serialNumber || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Type</div>
              <div class="detail-field-value">${Utils.escapeHtml(machine.type || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Production Line / Location</div>
              <div class="detail-field-value">${Utils.escapeHtml(machine.location || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Install Date</div>
              <div class="detail-field-value">${Utils.formatDate(machine.installDate)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Contract</div>
              <div class="detail-field-value">
                ${Utils.getContractBadge(machine.contractType || 'none')}
                ${(machine.contractType && machine.contractType !== 'none' && machine.contractExpiry) ? `<span style="margin-left:6px;font-size:0.786rem;color:${isExpired ? 'var(--red)' : 'var(--gray-500)'}">
                  expires ${Utils.formatDate(machine.contractExpiry)}${isExpired ? ' (expired)' : ''}
                </span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Client info -->
        ${client ? `
        <div>
          <div class="detail-section-label">Client</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-field-label">Company</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.name)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Contact</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.contactPerson || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Region</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.region || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Phone</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.phone || '—')}</div>
            </div>
          </div>
        </div>` : ''}

        <!-- Intervention history -->
        <div>
          <div class="detail-section-label">Intervention History (${history.length})</div>
          ${historyHTML}
        </div>

      </div>
    `;

    Modals.open(`${machine.model} — ${machine.serialNumber || ''}`, body, `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
      ${Auth.isAdmin() ? `<button class="btn btn-primary" onclick="Modals.close(); setTimeout(() => Views.Machines._openEditModal('${machineId}'), 100)">Edit Machine</button>` : ''}
    `);
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
