/* ============================================================
   views/interventions.js — Interventions View (Table + Kanban)
   ============================================================ */

Views.Interventions = {
  _effectCleanup: null,
  _sortKey: 'createdAt',
  _sortDir: 'desc',
  _page: 1,

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
    this._page = 1;
    const filtered = Utils.filterInterventions(appState.interventions, appState.filters);
    this._renderTable(filtered);
  },

  _goToPage(p) {
    this._page = p;
    const filtered = Utils.filterInterventions(appState.interventions, appState.filters);
    this._renderTable(filtered);
  },

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindToolbar();

    if (this._effectCleanup) this._effectCleanup();
    this._effectCleanup = ReactiveUtils.effect(() => {
      const filtered = Utils.filterInterventions(appState.interventions, appState.filters);
      const view = appState.ui.interventionView;
      if (view === 'kanban') {
        this._renderKanban(filtered);
      } else {
        this._renderTable(filtered);
      }
    });
  },

  unmount() {
    if (this._effectCleanup) {
      this._effectCleanup();
      this._effectCleanup = null;
    }
  },

  _template() {
    const user = appState.currentUser;
    const isAdmin = user && user.role === 'admin';

    const statusOptions = [
      '<option value="all">All Statuses</option>',
      ...Object.entries(CONFIG.STATUSES).map(([k, v]) =>
        `<option value="${k}" ${appState.filters.status === k ? 'selected' : ''}>${v.label}</option>`)
    ].join('');

    const priorityOptions = [
      '<option value="all">All Priorities</option>',
      ...Object.entries(CONFIG.PRIORITIES).map(([k, v]) =>
        `<option value="${k}" ${appState.filters.priority === k ? 'selected' : ''}>${v.label}</option>`)
    ].join('');

    const typeOptions = [
      '<option value="all">All Types</option>',
      ...Object.entries(CONFIG.INTERVENTION_TYPES).map(([k, v]) =>
        `<option value="${k}" ${appState.filters.type === k ? 'selected' : ''}>${v}</option>`)
    ].join('');

    const techOptions = [
      '<option value="all">All Technicians</option>',
      ...appState.users.filter(u => u.role === 'technician').map(u =>
        `<option value="${u.id}" ${appState.filters.technicianId === u.id ? 'selected' : ''}>${Utils.escapeHtml(u.name)}</option>`)
    ].join('');

    const clientOptions = isAdmin ? [
      '<option value="all">All Clients</option>',
      ...appState.clients.map(c =>
        `<option value="${c.id}" ${appState.filters.clientId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`)
    ].join('') : '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Interventions</h1>
          <p class="page-subtitle" id="interventionSubtitle">Loading…</p>
        </div>
        <div class="page-actions">
          <div class="view-toggle">
            <button class="view-toggle-btn ${appState.ui.interventionView === 'table' ? 'active' : ''}" id="viewTable">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Table
            </button>
            <button class="view-toggle-btn ${appState.ui.interventionView === 'kanban' ? 'active' : ''}" id="viewKanban">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="18"/><rect x="10" y="3" width="5" height="12"/><rect x="17" y="3" width="5" height="15"/></svg>
              Kanban
            </button>
          </div>
          ${isAdmin ? `<button class="btn btn-primary" onclick="Views.Interventions._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Intervention
          </button>` : ''}
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar-filters" style="flex-wrap:wrap;gap:8px">
          <div class="search-bar">
            <span class="search-bar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="intSearch" class="search-input" placeholder="Search…" value="${Utils.escapeHtml(appState.filters.search)}">
          </div>
          <select id="intStatus" class="toolbar-select">${statusOptions}</select>
          <select id="intPriority" class="toolbar-select">${priorityOptions}</select>
          <select id="intType" class="toolbar-select">${typeOptions}</select>
          ${isAdmin ? `<select id="intTech" class="toolbar-select">${techOptions}</select>` : ''}
          ${isAdmin ? `<select id="intClient" class="toolbar-select">${clientOptions}</select>` : ''}
          <input type="date" id="intDateFrom" class="toolbar-select" value="${appState.filters.dateFrom}" title="From date" style="min-width:120px">
          <input type="date" id="intDateTo" class="toolbar-select" value="${appState.filters.dateTo}" title="To date" style="min-width:120px">
          <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._resetFilters()">Clear</button>
        </div>
        <span id="intCount" class="text-sm text-muted"></span>
      </div>

      <div id="interventionContent"></div>
    `;
  },

  _bindToolbar() {
    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change', () => {
        appState.filters[key] = el.value;
        this._page = 1;
      });
    };

    bind('intSearch', 'search');
    bind('intStatus', 'status');
    bind('intPriority', 'priority');
    bind('intType', 'type');
    bind('intTech', 'technicianId');
    bind('intClient', 'clientId');
    bind('intDateFrom', 'dateFrom');
    bind('intDateTo', 'dateTo');

    const viewTableBtn  = document.getElementById('viewTable');
    const viewKanbanBtn = document.getElementById('viewKanban');

    if (viewTableBtn) viewTableBtn.addEventListener('click', () => {
      appState.ui.interventionView = 'table';
      viewTableBtn.classList.add('active');
      viewKanbanBtn?.classList.remove('active');
    });

    if (viewKanbanBtn) viewKanbanBtn.addEventListener('click', () => {
      appState.ui.interventionView = 'kanban';
      viewKanbanBtn.classList.add('active');
      viewTableBtn?.classList.remove('active');
    });
  },

  _resetFilters() {
    resetFilters();
    this.mount();
  },

  _renderTable(interventions) {
    const container = document.getElementById('interventionContent');
    const countEl   = document.getElementById('intCount');
    const subtitle  = document.getElementById('interventionSubtitle');
    if (!container) return;

    if (countEl) countEl.textContent = `${interventions.length} result${interventions.length !== 1 ? 's' : ''}`;
    if (subtitle) subtitle.textContent = `${interventions.length} intervention${interventions.length !== 1 ? 's' : ''} found`;

    if (interventions.length === 0) {
      container.innerHTML = `
        <div class="table-wrapper has-toolbar">
          <div class="table-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            <p class="table-empty-text">No interventions match the current filters</p>
          </div>
        </div>
      `;
      return;
    }

    const sorted = [...interventions].sort((a, b) => {
      let va, vb;
      if (this._sortKey === '_jobNumber') {
        const ma = appState.machines.find(m => m.id === a.machineId);
        const mb = appState.machines.find(m => m.id === b.machineId);
        va = ma?.jobNumber || '';
        vb = mb?.jobNumber || '';
      } else if (this._sortKey === '_serialNumber') {
        const ma = appState.machines.find(m => m.id === a.machineId);
        const mb = appState.machines.find(m => m.id === b.machineId);
        va = (ma?.serialNumber || '').toLowerCase();
        vb = (mb?.serialNumber || '').toLowerCase();
      } else if (this._sortKey === '_machineType') {
        const ma = appState.machines.find(m => m.id === a.machineId);
        const mb = appState.machines.find(m => m.id === b.machineId);
        va = (ma?.type || '').toLowerCase();
        vb = (mb?.type || '').toLowerCase();
      } else if (this._sortKey === '_machineName') {
        const ma = appState.machines.find(m => m.id === a.machineId);
        const mb = appState.machines.find(m => m.id === b.machineId);
        va = (ma?.name || '').toLowerCase();
        vb = (mb?.name || '').toLowerCase();
      } else if (this._sortKey === '_clientName') {
        va = Utils.getClientName(a.clientId).toLowerCase();
        vb = Utils.getClientName(b.clientId).toLowerCase();
      } else if (this._sortKey === '_machineModel') {
        va = Utils.getMachineModel(a.machineId).toLowerCase();
        vb = Utils.getMachineModel(b.machineId).toLowerCase();
      } else if (this._sortKey === '_techName') {
        va = Utils.getTechnicianName(a.technicianId).toLowerCase();
        vb = Utils.getTechnicianName(b.technicianId).toLowerCase();
      } else {
        va = (a[this._sortKey] || '').toString().toLowerCase();
        vb = (b[this._sortKey] || '').toString().toLowerCase();
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this._sortDir === 'desc' ? -cmp : cmp;
    });

    // pagination
    const pageSize   = Pagination.getPageSize();
    const totalPages = Math.ceil(sorted.length / pageSize);
    if (this._page > totalPages) this._page = Math.max(1, totalPages);
    const pageItems = Pagination.paginate(sorted, this._page, pageSize);

    const pageRows = pageItems.map(i => {
      const machine = appState.machines.find(m => m.id === i.machineId);
      const isOverdue = CONFIG.OPEN_STATUSES.includes(i.status) && i.scheduledDate && Utils.isPast(i.scheduledDate);
      const techName = i.technicianId ? Utils.getTechnicianName(i.technicianId) : 'Unassigned';
      return `
        <tr ${isOverdue ? 'style="background:var(--red-light)"' : ''}>
          <td style="font-family:monospace;font-size:0.786rem;color:var(--gray-500)">${Utils.escapeHtml(machine?.jobNumber || '—')}</td>
          <td style="font-family:monospace;font-size:0.786rem;color:var(--gray-500)">${Utils.escapeHtml(machine?.serialNumber || '—')}</td>
          <td class="td-primary">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
          <td style="font-size:0.786rem">${Utils.escapeHtml(machine?.type || '—')}</td>
          <td style="font-size:0.786rem">${Utils.escapeHtml(machine?.name || '—')}</td>
          <td>${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</td>
          <td>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
          <td>${Utils.getPriorityBadge(i.priority)}</td>
          <td>${Utils.getStatusBadge(i.status)}</td>
          <td style="font-size:0.786rem;color:${i.technicianId ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(techName)}</td>
          <td style="white-space:nowrap;font-size:0.786rem;color:${i.statusUpdatedAt ? 'inherit' : 'var(--gray-400)'}">${i.statusUpdatedAt ? Utils.formatDateTime(i.statusUpdatedAt) : '—'}</td>
          <td style="white-space:nowrap;font-size:0.786rem">${Utils.formatDateTime(i.createdAt)}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Detail" onclick="Views.Interventions.openDetailModal('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Interventions._openEditModal('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              ${Auth.isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" title="Delete" style="color:var(--red)" onclick="Views.Interventions._deleteIntervention('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const si = this._sortIcon();
    container.innerHTML = `
      <div class="table-wrapper has-toolbar">
        <table class="data-table">
          <thead>
            <tr>
              <th class="${this._thClass('_jobNumber')}" onclick="Views.Interventions._setSort('_jobNumber')">Job #${si}</th>
              <th class="${this._thClass('_serialNumber')}" onclick="Views.Interventions._setSort('_serialNumber')">Serial #${si}</th>
              <th class="${this._thClass('_clientName')}" onclick="Views.Interventions._setSort('_clientName')">Client${si}</th>
              <th class="${this._thClass('_machineType')}" onclick="Views.Interventions._setSort('_machineType')">Machine${si}</th>
              <th class="${this._thClass('_machineName')}" onclick="Views.Interventions._setSort('_machineName')">Name${si}</th>
              <th class="${this._thClass('_machineModel')}" onclick="Views.Interventions._setSort('_machineModel')">Model${si}</th>
              <th class="${this._thClass('type')}" onclick="Views.Interventions._setSort('type')">Type${si}</th>
              <th class="${this._thClass('priority')}" onclick="Views.Interventions._setSort('priority')">Priority${si}</th>
              <th class="${this._thClass('status')}" onclick="Views.Interventions._setSort('status')">Status${si}</th>
              <th class="${this._thClass('_techName')}" onclick="Views.Interventions._setSort('_techName')">Technician${si}</th>
              <th class="${this._thClass('statusUpdatedAt')}" onclick="Views.Interventions._setSort('statusUpdatedAt')">Status Updated${si}</th>
              <th class="${this._thClass('createdAt')}" onclick="Views.Interventions._setSort('createdAt')">Created${si}</th>
              <th style="width:100px"></th>
            </tr>
          </thead>
          <tbody>${pageRows}</tbody>
        </table>
        ${Pagination.render(sorted.length, this._page, pageSize, p => `Views.Interventions._goToPage(${p})`)}
      </div>
    `;
  },

  _renderKanban(interventions) {
    const container = document.getElementById('interventionContent');
    const countEl   = document.getElementById('intCount');
    if (!container) return;
    if (countEl) countEl.textContent = `${interventions.length} result${interventions.length !== 1 ? 's' : ''}`;

    const grouped = Utils.groupBy(interventions, 'status');

    const columns = Object.entries(CONFIG.STATUSES).map(([status, cfg]) => {
      const items = grouped[status] || [];
      const cards = items.length === 0
        ? '<div class="kanban-empty">No items</div>'
        : items.map(i => `
          <div class="kanban-card" onclick="Views.Interventions.openDetailModal('${i.id}')">
            <div class="kanban-card-client">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</div>
            <div class="kanban-card-machine">${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</div>
            <div class="kanban-card-meta">
              ${Utils.getPriorityBadge(i.priority)}
              <span class="kanban-card-date">${Utils.formatDate(i.scheduledDate)}</span>
            </div>
            <div class="kanban-card-meta" style="margin-top:4px">
              <span class="text-xs text-muted">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</span>
              <span class="text-xs text-muted">${Utils.escapeHtml(Utils.getTechnicianName(i.technicianId))}</span>
            </div>
          </div>
        `).join('');

      return `
        <div class="kanban-col">
          <div class="kanban-col-header">
            <span class="kanban-col-title">${cfg.label}</span>
            <span class="kanban-col-count">${items.length}</span>
          </div>
          <div class="kanban-cards">${cards}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="kanban-board">${columns}</div>`;
  },

  // ── FORM HELPERS ──────────────────────────────────────────
  _interventionFormHTML(intervention = {}) {
    const isEdit = !!intervention.id;

    const clientOptions = appState.clients.map(c =>
      `<option value="${c.id}" ${intervention.clientId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    const selectedClientId = intervention.clientId || '';
    const machineOptions = appState.machines
      .filter(m => !selectedClientId || m.clientId === selectedClientId)
      .map(m => `<option value="${m.id}" ${intervention.machineId === m.id ? 'selected' : ''}>${Utils.escapeHtml(m.model)} — Job #${m.jobNumber} (${m.serialNumber})</option>`)
      .join('');

    const typeOptions = Object.entries(CONFIG.INTERVENTION_TYPES).map(([k, v]) =>
      `<option value="${k}" ${(intervention.type || 'breakdown') === k ? 'selected' : ''}>${v}</option>`
    ).join('');

    const priorityOptions = Object.entries(CONFIG.PRIORITIES).map(([k, v]) =>
      `<option value="${k}" ${(intervention.priority || 'medium') === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');

    const statusOptions = Object.entries(CONFIG.STATUSES).map(([k, v]) =>
      `<option value="${k}" ${(intervention.status || 'new') === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');

    const techOptions = [
      '<option value="">Unassigned</option>',
      ...appState.users.filter(u => u.role === 'technician').map(u =>
        `<option value="${u.id}" ${intervention.technicianId === u.id ? 'selected' : ''}>${Utils.escapeHtml(u.name)}</option>`)
    ].join('');

    // Machine section — register new on create, dropdowns on edit
    const machineSection = isEdit ? `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client <span class="required">*</span></label>
          <select id="fIntClient" class="form-select">
            <option value="">— Select client —</option>
            ${clientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Machine <span class="required">*</span></label>
          <select id="fIntMachine" class="form-select">
            <option value="">— Select machine —</option>
            ${machineOptions}
          </select>
        </div>
      </div>
    ` : `
      <div style="background:var(--blue-light);border:1px solid var(--blue);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;font-size:0.786rem;color:var(--blue)">
        A new machine will be registered automatically with a unique Job # and status <strong>New</strong>.
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Name <span class="required">*</span></label>
          <input type="text" id="fNewMachineName" class="form-input" placeholder="e.g. MULTIVAC">
        </div>
        <div class="form-group">
          <label class="form-label">Model <span class="required">*</span></label>
          <input type="text" id="fNewMachineModel" class="form-input" placeholder="e.g. R230">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Serial Number <span class="required">*</span></label>
          <input type="text" id="fNewMachineSerial" class="form-input" placeholder="MV-XXXX-YYYY-NNN">
        </div>
        <div class="form-group"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Type</label>
          <input type="text" id="fNewMachineType" class="form-input" placeholder="e.g. Tray Sealer">
        </div>
        <div class="form-group">
          <label class="form-label">Client <span class="required">*</span></label>
          <select id="fNewMachineClient" class="form-select">
            <option value="">— Select client —</option>
            ${clientOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Line</label>
          <input type="text" id="fNewMachineLocation" class="form-input" placeholder="e.g. Production Line A">
        </div>
        <div class="form-group">
          <label class="form-label">Contract Type</label>
          <select id="fNewMachineContract" class="form-select" onchange="Views.Interventions._toggleNewMachineExpiry(this.value)">
            ${Object.entries(CONFIG.CONTRACT_TYPES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row" id="fNewMachineExpiryGroup" style="display:none">
        <div class="form-group">
          <label class="form-label">Contract Expiry Date</label>
          <input type="date" id="fNewMachineExpiry" class="form-input">
        </div>
        <div class="form-group"></div>
      </div>
      <hr style="border:none;border-top:1px solid var(--gray-200);margin:8px 0 12px">
    `;

    return `
      ${machineSection}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type <span class="required">*</span></label>
          <select id="fIntType" class="form-select">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority <span class="required">*</span></label>
          <select id="fIntPriority" class="form-select">${priorityOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Intervention Location</label>
          <select id="fIntLocation" class="form-select">
            <option value="client" ${(intervention.location || 'client') === 'client' ? 'selected' : ''}>Client Premises</option>
            <option value="workshop" ${intervention.location === 'workshop' ? 'selected' : ''}>Workshop</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="fIntStatus" class="form-select">${statusOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Assigned Technician</label>
          <select id="fIntTech" class="form-select">${techOptions}</select>
        </div>
        <div class="form-group"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Scheduled Date</label>
          <input type="date" id="fIntDate" class="form-input" value="${intervention.scheduledDate ? intervention.scheduledDate.slice(0, 10) : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Scheduled Time</label>
          <input type="time" id="fIntTime" class="form-input" value="${intervention.scheduledDate ? new Date(intervention.scheduledDate).toTimeString().slice(0,5) : '08:00'}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="fIntDesc" class="form-textarea" rows="3" placeholder="Describe the issue or work to be done…">${Utils.escapeHtml(intervention.description || '')}</textarea>
      </div>
    `;
  },

  _toggleNewMachineExpiry(contractType) {
    const group = document.getElementById('fNewMachineExpiryGroup');
    if (!group) return;
    group.style.display = contractType === 'none' ? 'none' : '';
    if (contractType === 'none') {
      const input = document.getElementById('fNewMachineExpiry');
      if (input) input.value = '';
    }
  },

  _bindClientMachineDropdown() {
    // Client → Machine cascade for the edit form
    const clientSel  = document.getElementById('fIntClient');
    const machineSel = document.getElementById('fIntMachine');
    if (!clientSel || !machineSel) return;

    clientSel.addEventListener('change', () => {
      const clientId = clientSel.value;
      const machines = clientId ? appState.machines.filter(m => m.clientId === clientId) : appState.machines;
      machineSel.innerHTML = '<option value="">— Select machine —</option>' +
        machines.map(m => `<option value="${m.id}">${Utils.escapeHtml(m.model)} — Job #${m.jobNumber} (${m.serialNumber})</option>`).join('');
    });
  },

  _openCreateModal() {
    Modals.open('New Intervention', this._interventionFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitCreate()">Create Intervention</button>
    `, { size: 'lg' });
  },

  _submitCreate() {
    const type = document.getElementById('fIntType')?.value;
    if (!type) { Toast.error('Please select an intervention type'); return; }

    const user = appState.currentUser;

    const machineName = document.getElementById('fNewMachineName')?.value.trim();
    const model    = document.getElementById('fNewMachineModel')?.value.trim();
    const serial   = document.getElementById('fNewMachineSerial')?.value.trim();
    const clientId = document.getElementById('fNewMachineClient')?.value;

    if (!machineName) { Toast.error('Machine name is required'); return; }
    if (!model)    { Toast.error('Machine model is required'); return; }
    if (!serial)   { Toast.error('Serial number is required'); return; }
    if (!clientId) { Toast.error('Please select a client for the machine'); return; }

    const newMachine = Storage.createMachine({
      name: machineName, model, serialNumber: serial, clientId,
      type:           document.getElementById('fNewMachineType')?.value.trim() || '',
      location:       document.getElementById('fNewMachineLocation')?.value.trim() || '',
      contractType:   document.getElementById('fNewMachineContract')?.value || 'none',
      contractExpiry: document.getElementById('fNewMachineExpiry')?.value || null
    });
    const machineId = newMachine.id;
    refreshMachines();

    const dateVal = document.getElementById('fIntDate')?.value;
    const timeVal = document.getElementById('fIntTime')?.value || '08:00';
    const scheduledDate = dateVal ? new Date(`${dateVal}T${timeVal}`).toISOString() : null;

    Storage.createIntervention({
      clientId, machineId, type,
      priority:     document.getElementById('fIntPriority')?.value || 'medium',
      status:       document.getElementById('fIntStatus')?.value || 'new',
      technicianId: document.getElementById('fIntTech')?.value || null,
      location:     document.getElementById('fIntLocation')?.value || 'client',
      scheduledDate,
      description:  document.getElementById('fIntDesc')?.value.trim() || '',
      createdBy:    user?.name || 'Admin'
    });

    refreshInterventions();
    Modals.close();
    Toast.success('Intervention created successfully');
  },

  _openEditModal(interventionId) {
    const intervention = Storage.getInterventionById(interventionId);
    if (!intervention) return;

    Modals.open(`Edit Intervention`, this._interventionFormHTML(intervention), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitEdit('${interventionId}')">Save Changes</button>
    `, { size: 'lg', onOpen: () => this._bindClientMachineDropdown() });
  },

  _submitEdit(interventionId) {
    const original   = Storage.getInterventionById(interventionId);
    const clientId  = document.getElementById('fIntClient')?.value;
    const machineId = document.getElementById('fIntMachine')?.value;

    if (!clientId)  { Toast.error('Please select a client'); return; }
    if (!machineId) { Toast.error('Please select a machine'); return; }

    const dateVal = document.getElementById('fIntDate')?.value;
    const timeVal = document.getElementById('fIntTime')?.value || '08:00';
    const scheduledDate = dateVal ? new Date(`${dateVal}T${timeVal}`).toISOString() : null;

    const newStatus = document.getElementById('fIntStatus')?.value || original.status;
    const user = appState.currentUser;

    const auditEntry = newStatus !== original.status ? {
      action: 'Status Changed',
      user: user?.name || 'Admin',
      details: `${original.status} → ${newStatus}`
    } : {
      action: 'Updated',
      user: user?.name || 'Admin',
      details: 'Intervention details updated'
    };

    Storage.updateIntervention(interventionId, {
      clientId, machineId,
      type:         document.getElementById('fIntType')?.value,
      priority:     document.getElementById('fIntPriority')?.value,
      status:       newStatus,
      technicianId: document.getElementById('fIntTech')?.value || null,
      location:     document.getElementById('fIntLocation')?.value || 'client',
      scheduledDate,
      description:  document.getElementById('fIntDesc')?.value.trim() || ''
    }, auditEntry);

    refreshInterventions();
    Modals.close();
    Toast.success('Intervention updated');
  },

  async _deleteIntervention(interventionId) {
    const confirmed = await Modals.confirm('Delete this intervention? This cannot be undone.', 'Delete Intervention');
    if (!confirmed) return;
    Storage.deleteIntervention(interventionId);
    refreshInterventions();
    Toast.success('Intervention deleted');
  },

  // ── DETAIL MODAL ──────────────────────────────────────────
  openDetailModal(interventionId) {
    const i = Storage.getInterventionById(interventionId);
    if (!i) return;

    const client  = appState.clients.find(c => c.id === i.clientId);
    const machine = appState.machines.find(m => m.id === i.machineId);
    const tech    = appState.users.find(u => u.id === i.technicianId);
    const user    = appState.currentUser;
    const isAdmin = user && user.role === 'admin';
    const isTech  = user && user.id === i.technicianId;

    const canAddNote = isAdmin || isTech;
    const canAddPart = isAdmin || isTech;

    // ── Build status tab data ──────────────────────────────────
    // Sort oldest → newest, assign notes/parts per status window
    const statusChain = [...(i.statusHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const allNotes    = [...(i.notes  || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const allParts    = [...(i.parts  || [])].sort((a, b) => new Date(a.addedAt)   - new Date(b.addedAt));

    const statusTabs = statusChain.map((s, idx) => {
      const windowStart = new Date(s.timestamp);
      const windowEnd   = statusChain[idx + 1] ? new Date(statusChain[idx + 1].timestamp) : new Date(9999999999999);
      return {
        s,
        isLatest: idx === statusChain.length - 1,
        tabId: `stab-${i.id}-${idx}`,
        panelId: `spanel-${i.id}-${idx}`,
        cardNotes: allNotes.filter(n => { const t = new Date(n.createdAt); return t >= windowStart && t < windowEnd; }),
        cardParts: allParts.filter(p => { const t = new Date(p.addedAt);   return t >= windowStart && t < windowEnd; })
      };
    });

    // Tab bar — oldest left, newest right (current is rightmost & pre-selected)
    const tabBarHTML = statusTabs.length === 0
      ? ''
      : `<div class="stab-bar" role="tablist">${statusTabs.map(({ s, isLatest, tabId, panelId }) => `
          <button class="stab-btn${isLatest ? ' stab-btn-active' : ''}"
            id="${tabId}" role="tab"
            aria-selected="${isLatest}"
            aria-controls="${panelId}"
            onclick="Views.Interventions._switchStatusTab(this,'${i.id}')">
            ${Utils.getStatusBadge(s.status)}
            ${isLatest ? '<span class="stab-current-dot" title="Current"></span>' : ''}
          </button>
        `).join('')}</div>`;

    // Panel for each tab
    const tabPanelsHTML = statusTabs.length === 0
      ? '<p class="text-sm text-muted">No status history available.</p>'
      : statusTabs.map(({ s, isLatest, tabId, panelId, cardNotes, cardParts }) => {

          const notesBlock = cardNotes.length === 0
            ? '<p class="stab-empty">No notes during this status.</p>'
            : cardNotes.map(n => `
                <div class="stab-note-item">
                  <p class="stab-note-text">${Utils.escapeHtml(n.text)}</p>
                  <p class="stab-note-meta">${Utils.escapeHtml(n.author)} · ${Utils.formatDateTime(n.createdAt)}</p>
                </div>`).join('');

          const partsBlock = cardParts.length === 0
            ? '<p class="stab-empty">No parts used during this status.</p>'
            : `<table class="parts-table">
                <thead><tr><th>Reference</th><th>Description</th><th>Qty</th><th>Added</th></tr></thead>
                <tbody>${cardParts.map(p => `
                  <tr>
                    <td style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
                    <td>${Utils.escapeHtml(p.description)}</td>
                    <td>${p.quantity}</td>
                    <td>${Utils.formatDate(p.addedAt)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>`;

          return `
            <div class="stab-panel${isLatest ? ' stab-panel-active' : ''}"
              id="${panelId}" role="tabpanel" aria-labelledby="${tabId}">

              <div class="stab-panel-header">
                <div class="stab-panel-meta">
                  ${Utils.getStatusBadge(s.status)}
                  ${isLatest ? '<span class="al-current-tag">Current</span>' : ''}
                  <span class="stab-panel-by">by ${Utils.escapeHtml(s.changedBy)}</span>
                  <span class="stab-panel-time">${Utils.formatDateTime(s.timestamp)}</span>
                </div>
              </div>

              ${s.note ? `
                <div class="stab-block">
                  <div class="stab-block-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                    Status Note
                  </div>
                  <p class="stab-block-text">${Utils.escapeHtml(s.note)}</p>
                </div>` : ''}

              ${i.description ? `
                <div class="stab-block">
                  <div class="stab-block-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Description
                  </div>
                  <p class="stab-block-text">${Utils.escapeHtml(i.description)}</p>
                </div>` : ''}

              <div class="stab-block">
                <div class="stab-block-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Notes
                  ${isLatest && canAddNote ? `<button class="btn btn-ghost btn-sm stab-add-btn" onclick="Views.Interventions._openAddNoteModal('${i.id}')">+ Add</button>` : ''}
                </div>
                ${notesBlock}
              </div>

              <div class="stab-block">
                <div class="stab-block-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Parts Used
                  ${isLatest && canAddPart ? `<button class="btn btn-ghost btn-sm stab-add-btn" onclick="Views.Interventions._openAddPartModal('${i.id}')">+ Add</button>` : ''}
                </div>
                ${partsBlock}
              </div>

            </div>`;
        }).join('');

    const body = `
      <div class="detail-section">
        <div class="detail-section-label">Intervention Details</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-field-label">Job Number</div><div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(machine?.jobNumber || '—')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Serial Number</div><div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(machine?.serialNumber || '—')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Client</div><div class="detail-field-value">${Utils.escapeHtml(client?.name || '—')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Machine</div><div class="detail-field-value">${Utils.escapeHtml(machine?.model || '—')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Type</div><div class="detail-field-value">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</div></div>
          <div class="detail-field"><div class="detail-field-label">Location</div><div class="detail-field-value">${i.location === 'workshop' ? 'Workshop' : 'Client Premises'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Technician</div><div class="detail-field-value" style="${!i.technicianId ? 'color:var(--gray-400)' : ''}">${Utils.escapeHtml(tech?.name || 'Unassigned')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value">${Utils.getStatusBadge(i.status)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Priority</div><div class="detail-field-value">${Utils.getPriorityBadge(i.priority)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Scheduled</div><div class="detail-field-value">${Utils.formatDateTime(i.scheduledDate)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Created</div><div class="detail-field-value">${Utils.formatDateTime(i.createdAt)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Status Last Updated</div><div class="detail-field-value">${i.statusUpdatedAt ? Utils.formatDateTime(i.statusUpdatedAt) : '—'}</div></div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-label">Status History</div>
        ${tabBarHTML}
        <div class="stab-panels">${tabPanelsHTML}</div>
      </div>
    `;

    const footer = ``;

    Modals.open(`Intervention #${i.id.slice(-6)}`, body, footer, { size: 'lg' });
  },

  _switchStatusTab(btn, interventionId) {
    const bar = btn.closest('.stab-bar');
    if (!bar) return;
    // Deactivate all tabs in this bar
    bar.querySelectorAll('.stab-btn').forEach(b => {
      b.classList.remove('stab-btn-active');
      b.setAttribute('aria-selected', 'false');
    });
    // Activate clicked tab
    btn.classList.add('stab-btn-active');
    btn.setAttribute('aria-selected', 'true');
    // Hide all panels, show the target panel
    const panelContainer = bar.nextElementSibling;
    panelContainer.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('stab-panel-active'));
    const targetPanel = document.getElementById(btn.getAttribute('aria-controls'));
    if (targetPanel) targetPanel.classList.add('stab-panel-active');
  },

  _openAddNoteModal(interventionId) {
    Modals.open('Add Note', `
      <div class="form-group">
        <label class="form-label">Note <span class="required">*</span></label>
        <textarea id="fNoteText" class="form-textarea" rows="4" placeholder="Enter your note…"></textarea>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitNote('${interventionId}')">Add Note</button>
    `);
  },

  _submitNote(interventionId) {
    const text = document.getElementById('fNoteText')?.value.trim();
    if (!text) { Toast.error('Note text is required'); return; }

    const user = appState.currentUser;
    Storage.addInterventionNote(interventionId, {
      text,
      author: user?.name || 'Admin'
    });

    Storage.updateIntervention(interventionId, {}, {
      action: 'Note Added',
      user: user?.name || 'Admin',
      details: Utils.truncate(text, 60)
    });

    refreshInterventions();
    Modals.close();
    Toast.success('Note added');
    setTimeout(() => this.openDetailModal(interventionId), 100);
  },

  _openAddPartModal(interventionId) {
    Modals.open('Add Part Used', `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Part Reference <span class="required">*</span></label>
          <input type="text" id="fPartRef" class="form-input" placeholder="e.g. HE-R230-001">
        </div>
        <div class="form-group">
          <label class="form-label">Quantity</label>
          <input type="number" id="fPartQty" class="form-input" value="1" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" id="fPartDesc" class="form-input" placeholder="e.g. Heating Element 230V">
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitPart('${interventionId}')">Add Part</button>
    `);
  },

  _submitPart(interventionId) {
    const ref = document.getElementById('fPartRef')?.value.trim();
    if (!ref) { Toast.error('Part reference is required'); return; }

    const user = appState.currentUser;
    Storage.addInterventionPart(interventionId, {
      reference:   ref,
      description: document.getElementById('fPartDesc')?.value.trim() || '',
      quantity:    parseInt(document.getElementById('fPartQty')?.value) || 1
    });

    Storage.updateIntervention(interventionId, {}, {
      action: 'Part Added',
      user: user?.name || 'Admin',
      details: `${ref} × ${document.getElementById('fPartQty')?.value || 1}`
    });

    refreshInterventions();
    Modals.close();
    Toast.success('Part added');
    setTimeout(() => this.openDetailModal(interventionId), 100);
  }
};
