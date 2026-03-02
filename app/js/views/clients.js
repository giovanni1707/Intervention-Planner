/* ============================================================
   views/clients.js — Client Management View
   ============================================================ */

Views.Clients = {
  _searchTerm: '',
  _sortKey: 'name',
  _sortDir: 'asc',

  _sortIcon() {
    return `<span class="sort-icon">
      <svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill="currentColor"/></svg>
      <svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill="currentColor"/></svg>
    </span>`;
  },

  _thClass(key) {
    if (this._sortKey !== key) return 'sortable';
    return `sortable sort-${this._sortDir}`;
  },

  _setSort(key) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
    this._renderTable(this._getFiltered());
  },

  _getFiltered() {
    if (!this._searchTerm) return appState.clients;
    const q = this._searchTerm.toLowerCase();
    return appState.clients.filter(c =>
      [c.name, c.contactPerson, c.email, c.phone, c.region].join(' ').toLowerCase().includes(q)
    );
  },

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._renderTable(this._getFiltered());
    this._bindSearch();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Clients</h1>
          <p class="page-subtitle">${appState.clients.length} client${appState.clients.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Views.Clients._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Client
          </button>
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar-filters">
          <div class="search-bar">
            <span class="search-bar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="clientSearch" class="search-input" placeholder="Search clients…" value="${Utils.escapeHtml(this._searchTerm)}">
          </div>
        </div>
        <span id="clientCount" class="text-sm text-muted"></span>
      </div>

      <div class="table-wrapper has-toolbar">
        <table class="data-table" id="clientTable">
          <thead id="clientThead">
          </thead>
          <tbody id="clientTableBody"></tbody>
        </table>
      </div>
    `;
  },

  _renderTable(clients) {
    const tbody   = document.getElementById('clientTableBody');
    const thead   = document.getElementById('clientThead');
    const countEl = document.getElementById('clientCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${clients.length} result${clients.length !== 1 ? 's' : ''}`;

    if (thead) {
      const si = this._sortIcon();
      thead.innerHTML = `<tr>
        <th class="${this._thClass('name')}" onclick="Views.Clients._setSort('name')">Company${si}</th>
        <th class="${this._thClass('contactPerson')}" onclick="Views.Clients._setSort('contactPerson')">Contact Person${si}</th>
        <th>Phone</th>
        <th>Email</th>
        <th class="${this._thClass('region')}" onclick="Views.Clients._setSort('region')">Region${si}</th>
        <th class="${this._thClass('_machineCount')}" onclick="Views.Clients._setSort('_machineCount')">Machines${si}</th>
        <th class="${this._thClass('createdAt')}" onclick="Views.Clients._setSort('createdAt')">Added${si}</th>
        <th style="width:110px"></th>
      </tr>`;
    }

    // sort
    const sorted = [...clients].sort((a, b) => {
      let va, vb;
      if (this._sortKey === '_machineCount') {
        va = appState.machines.filter(m => m.clientId === a.id).length;
        vb = appState.machines.filter(m => m.clientId === b.id).length;
      } else {
        va = (a[this._sortKey] || '').toString().toLowerCase();
        vb = (b[this._sortKey] || '').toString().toLowerCase();
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this._sortDir === 'desc' ? -cmp : cmp;
    });

    if (sorted.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8">
          <div class="table-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p class="table-empty-text">No clients found</p>
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = sorted.map(c => {
      const machineCount = appState.machines.filter(m => m.clientId === c.id).length;
      return `
        <tr>
          <td class="td-primary">${Utils.escapeHtml(c.name)}</td>
          <td>${Utils.escapeHtml(c.contactPerson || '—')}</td>
          <td style="white-space:nowrap">${Utils.escapeHtml(c.phone || '—')}</td>
          <td><a href="mailto:${Utils.escapeHtml(c.email || '')}">${Utils.escapeHtml(c.email || '—')}</a></td>
          <td>${Utils.escapeHtml(c.region || '—')}</td>
          <td>
            <span class="badge badge-gray">${machineCount} machine${machineCount !== 1 ? 's' : ''}</span>
          </td>
          <td style="white-space:nowrap;font-size:0.786rem">${Utils.formatDateTime(c.createdAt)}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details" onclick="Views.Clients.openDetailModal('${c.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Clients._openEditModal('${c.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete" style="color:var(--red)" onclick="Views.Clients._deleteClient('${c.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  _bindSearch() {
    const input = document.getElementById('clientSearch');
    if (!input) return;
    input.addEventListener('input', () => {
      this._searchTerm = input.value;
      this._renderTable(this._getFiltered());
    });
  },

  _clientFormHTML(client = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Company Name <span class="required">*</span></label>
          <input type="text" id="fClientName" class="form-input" value="${Utils.escapeHtml(client.name || '')}" required placeholder="e.g. Ciel Group">
        </div>
        <div class="form-group">
          <label class="form-label">Industry</label>
          <input type="text" id="fClientIndustry" class="form-input" value="${Utils.escapeHtml(client.industry || '')}" placeholder="e.g. Food Processing">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contact Person</label>
          <input type="text" id="fClientContact" class="form-input" value="${Utils.escapeHtml(client.contactPerson || '')}" placeholder="Full name">
        </div>
        <div class="form-group">
          <label class="form-label">Region</label>
          <input type="text" id="fClientRegion" class="form-input" value="${Utils.escapeHtml(client.region || '')}" placeholder="e.g. Port Louis">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" id="fClientPhone" class="form-input" value="${Utils.escapeHtml(client.phone || '')}" placeholder="+230 000 0000">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="fClientEmail" class="form-input" value="${Utils.escapeHtml(client.email || '')}" placeholder="contact@company.mu">
        </div>
      </div>
    `;
  },

  _openCreateModal() {
    Modals.open('Add New Client', this._clientFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Clients._submitCreate()">Create Client</button>
    `);
  },

  _submitCreate() {
    const name = document.getElementById('fClientName')?.value.trim();
    if (!name) { Toast.error('Company name is required'); return; }

    Storage.createClient({
      name,
      industry:      document.getElementById('fClientIndustry')?.value.trim() || '',
      contactPerson: document.getElementById('fClientContact')?.value.trim() || '',
      region:        document.getElementById('fClientRegion')?.value.trim() || '',
      phone:         document.getElementById('fClientPhone')?.value.trim() || '',
      email:         document.getElementById('fClientEmail')?.value.trim() || ''
    });

    refreshClients();
    Modals.close();
    Toast.success(`Client "${name}" created successfully`);
    this.mount();
  },

  _openEditModal(clientId) {
    const client = Storage.getClientById(clientId);
    if (!client) return;

    Modals.open(`Edit Client — ${client.name}`, this._clientFormHTML(client), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Clients._submitEdit('${clientId}')">Save Changes</button>
    `);
  },

  _submitEdit(clientId) {
    const name = document.getElementById('fClientName')?.value.trim();
    if (!name) { Toast.error('Company name is required'); return; }

    Storage.updateClient(clientId, {
      name,
      industry:      document.getElementById('fClientIndustry')?.value.trim() || '',
      contactPerson: document.getElementById('fClientContact')?.value.trim() || '',
      region:        document.getElementById('fClientRegion')?.value.trim() || '',
      phone:         document.getElementById('fClientPhone')?.value.trim() || '',
      email:         document.getElementById('fClientEmail')?.value.trim() || ''
    });

    refreshClients();
    Modals.close();
    Toast.success('Client updated successfully');
    this.mount();
  },

  openDetailModal(clientId) {
    const client = Storage.getClientById(clientId);
    if (!client) return;

    const machines     = appState.machines.filter(m => m.clientId === clientId);
    const allIntv      = appState.interventions.filter(i => i.clientId === clientId);
    const openIntv     = allIntv.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const lastService  = allIntv
      .filter(i => i.status === 'completed' && i.scheduledDate)
      .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0];

    const machinesHTML = machines.length === 0
      ? '<p class="text-sm text-muted" style="padding:8px 0">No machines registered for this client.</p>'
      : `<table class="data-table" style="margin-top:0">
          <thead><tr><th>Model</th><th>Serial</th><th>Type</th><th>Contract</th></tr></thead>
          <tbody>
            ${machines.map(m => `
              <tr>
                <td class="td-primary">${Utils.escapeHtml(m.model)}</td>
                <td style="font-family:monospace;font-size:0.8rem">${Utils.escapeHtml(m.serialNumber || '—')}</td>
                <td>${Utils.escapeHtml(CONFIG.INTERVENTION_TYPES[m.type] || m.type || '—')}</td>
                <td>${Utils.getContractBadge(m.contractType)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Header info -->
        <div class="detail-grid">
          <div class="detail-field">
            <div class="detail-field-label">Company</div>
            <div class="detail-field-value">${Utils.escapeHtml(client.name)}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Industry</div>
            <div class="detail-field-value">${Utils.escapeHtml(client.industry || '—')}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Region</div>
            <div class="detail-field-value">${Utils.escapeHtml(client.region || '—')}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Client Since</div>
            <div class="detail-field-value">${Utils.formatDate(client.createdAt)}</div>
          </div>
        </div>

        <!-- Contact -->
        <div>
          <div class="detail-section-label">Contact Information</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-field-label">Contact Person</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.contactPerson || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Phone</div>
              <div class="detail-field-value">${Utils.escapeHtml(client.phone || '—')}</div>
            </div>
            <div class="detail-field" style="grid-column:1/-1">
              <div class="detail-field-label">Email</div>
              <div class="detail-field-value">
                ${client.email
                  ? `<a href="mailto:${Utils.escapeHtml(client.email)}">${Utils.escapeHtml(client.email)}</a>`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:flex;gap:12px">
          <div class="stat-box" style="flex:1;padding:12px 16px">
            <div class="stat-box-value">${machines.length}</div>
            <div class="stat-box-label">Machines</div>
          </div>
          <div class="stat-box" style="flex:1;padding:12px 16px">
            <div class="stat-box-value">${allIntv.length}</div>
            <div class="stat-box-label">Total Interventions</div>
          </div>
          <div class="stat-box" style="flex:1;padding:12px 16px">
            <div class="stat-box-value">${openIntv.length}</div>
            <div class="stat-box-label">Open</div>
          </div>
          <div class="stat-box" style="flex:1;padding:12px 16px">
            <div class="stat-box-value" style="font-size:0.9rem">${lastService ? Utils.formatDate(lastService.scheduledDate) : '—'}</div>
            <div class="stat-box-label">Last Service</div>
          </div>
        </div>

        <!-- Machines -->
        <div>
          <div class="detail-section-label">Registered Machines (${machines.length})</div>
          ${machinesHTML}
        </div>

      </div>
    `;

    Modals.open(`${client.name}`, body, `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
      ${Auth.isAdmin() ? `<button class="btn btn-primary" onclick="Modals.close(); setTimeout(() => Views.Clients._openEditModal('${clientId}'), 100)">Edit Client</button>` : ''}
    `);
  },

  async _deleteClient(clientId) {
    const client = Storage.getClientById(clientId);
    if (!client) return;

    const machineCount = appState.machines.filter(m => m.clientId === clientId).length;
    const interventionCount = appState.interventions.filter(i => i.clientId === clientId).length;

    let msg = `Delete "${client.name}"?`;
    if (machineCount > 0 || interventionCount > 0) {
      msg += ` This client has ${machineCount} machine(s) and ${interventionCount} intervention(s) linked to them.`;
    }

    const confirmed = await Modals.confirm(msg, 'Delete Client');
    if (!confirmed) return;

    Storage.deleteClient(clientId);
    refreshClients();
    Toast.success('Client deleted');
    this.mount();
  }
};
