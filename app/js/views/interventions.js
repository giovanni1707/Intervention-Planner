/* ============================================================
   views/interventions.js — Interventions View (Table + Kanban)
   ============================================================ */

Views.Interventions = {
  _effectCleanup: null,
  _sortKey: 'createdAt',
  _sortDir: 'desc',

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
    // Re-run the effect by touching interventions (just re-render directly)
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
          <div class="search-bar" style="max-width:140px">
            <span class="search-bar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>
            </span>
            <input type="text" id="intJobNumber" class="search-input" placeholder="Job #…" maxlength="6" value="${Utils.escapeHtml(appState.filters.jobNumber)}" style="font-family:monospace;letter-spacing:0.05em">
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
      });
    };

    bind('intSearch', 'search');
    bind('intJobNumber', 'jobNumber');
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

    const rows = sorted.map(i => {
      const machine = appState.machines.find(m => m.id === i.machineId);
      const isOverdue = CONFIG.OPEN_STATUSES.includes(i.status) && i.scheduledDate && Utils.isPast(i.scheduledDate);
      return `
        <tr ${isOverdue ? 'style="background:var(--red-light)"' : ''}>
          <td style="font-family:monospace;font-size:0.786rem;color:var(--gray-500)">${Utils.escapeHtml(machine?.jobNumber || '—')}</td>
          <td class="td-primary">${Utils.escapeHtml(Utils.getClientName(i.clientId))}</td>
          <td>${Utils.escapeHtml(Utils.getMachineModel(i.machineId))}</td>
          <td>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
          <td>${Utils.getPriorityBadge(i.priority)}</td>
          <td>${Utils.getStatusBadge(i.status)}</td>
          <td>${Utils.escapeHtml(Utils.getTechnicianName(i.technicianId))}</td>
          <td style="white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
          <td style="white-space:nowrap;color:var(--gray-400);font-size:0.786rem">${Utils.formatRelative(i.createdAt)}</td>
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
              <th class="${this._thClass('_clientName')}" onclick="Views.Interventions._setSort('_clientName')">Client${si}</th>
              <th class="${this._thClass('_machineModel')}" onclick="Views.Interventions._setSort('_machineModel')">Machine${si}</th>
              <th class="${this._thClass('type')}" onclick="Views.Interventions._setSort('type')">Type${si}</th>
              <th class="${this._thClass('priority')}" onclick="Views.Interventions._setSort('priority')">Priority${si}</th>
              <th class="${this._thClass('status')}" onclick="Views.Interventions._setSort('status')">Status${si}</th>
              <th class="${this._thClass('_techName')}" onclick="Views.Interventions._setSort('_techName')">Technician${si}</th>
              <th class="${this._thClass('scheduledDate')}" onclick="Views.Interventions._setSort('scheduledDate')">Scheduled${si}</th>
              <th class="${this._thClass('createdAt')}" onclick="Views.Interventions._setSort('createdAt')">Created${si}</th>
              <th style="width:100px"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
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
    const clientOptions = appState.clients.map(c =>
      `<option value="${c.id}" ${intervention.clientId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
    ).join('');

    // Machine options depend on selected client — build for current value, JS will update
    const selectedClientId = intervention.clientId || '';
    const machineOptions = appState.machines
      .filter(m => !selectedClientId || m.clientId === selectedClientId)
      .map(m => `<option value="${m.id}" ${intervention.machineId === m.id ? 'selected' : ''}>${Utils.escapeHtml(m.model)} (${m.serialNumber})</option>`)
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

    const isEdit = !!intervention.id;

    return `
      ${!isEdit ? `
      <div class="form-row" style="align-items:flex-end">
        <div class="form-group">
          <label class="form-label">Job Number <span class="text-xs text-muted" style="font-weight:400">(type to auto-fill machine & client)</span></label>
          <input type="text" id="fIntJobNumber" class="form-input" placeholder="e.g. 481203" maxlength="6" style="font-family:monospace;letter-spacing:0.08em">
        </div>
        <div class="form-group" style="flex:0 0 auto;padding-bottom:0">
          <div id="fIntJobFeedback" style="font-size:0.786rem;padding:6px 10px;border-radius:6px;min-height:32px"></div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--gray-200);margin:4px 0 8px">
      ` : ''}
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

  _bindClientMachineDropdown() {
    const clientSel  = document.getElementById('fIntClient');
    const machineSel = document.getElementById('fIntMachine');
    if (!clientSel || !machineSel) return;

    clientSel.addEventListener('change', () => {
      const clientId = clientSel.value;
      const machines = clientId ? appState.machines.filter(m => m.clientId === clientId) : appState.machines;
      machineSel.innerHTML = '<option value="">— Select machine —</option>' +
        machines.map(m => `<option value="${m.id}">${Utils.escapeHtml(m.model)} (${m.serialNumber})</option>`).join('');
    });

    // Job number auto-fill (create form only)
    const jobInput  = document.getElementById('fIntJobNumber');
    const feedback  = document.getElementById('fIntJobFeedback');
    if (!jobInput || !feedback) return;

    jobInput.addEventListener('input', () => {
      const val = jobInput.value.trim();
      if (val.length < 6) {
        feedback.textContent = '';
        feedback.style.background = '';
        feedback.style.color = '';
        return;
      }
      const machine = appState.machines.find(m => m.jobNumber === val);
      if (!machine) {
        feedback.textContent = '✗ Job number not found';
        feedback.style.background = 'var(--red-light)';
        feedback.style.color = 'var(--red)';
        return;
      }
      const client = appState.clients.find(c => c.id === machine.clientId);

      // Set client dropdown
      clientSel.value = machine.clientId || '';

      // Rebuild machine dropdown for this client, then select the machine
      const clientMachines = appState.machines.filter(m => m.clientId === machine.clientId);
      machineSel.innerHTML = '<option value="">— Select machine —</option>' +
        clientMachines.map(m => `<option value="${m.id}">${Utils.escapeHtml(m.model)} (${m.serialNumber})</option>`).join('');
      machineSel.value = machine.id;

      // Warn if machine already has an open intervention
      const openIntv = appState.interventions.find(i =>
        i.machineId === machine.id && CONFIG.OPEN_STATUSES.includes(i.status)
      );
      if (openIntv) {
        feedback.innerHTML = `⚠ <strong>${Utils.escapeHtml(machine.model)}</strong> already has an open intervention (${CONFIG.STATUSES[openIntv.status]?.label || openIntv.status}) — cannot create a duplicate.`;
        feedback.style.background = 'var(--yellow-light)';
        feedback.style.color = 'var(--yellow)';
      } else {
        feedback.innerHTML = `✓ <strong>${Utils.escapeHtml(machine.model)}</strong> &nbsp;·&nbsp; ${Utils.escapeHtml(client?.name || '—')} &nbsp;·&nbsp; S/N: ${Utils.escapeHtml(machine.serialNumber || '—')}`;
        feedback.style.background = 'var(--green-light)';
        feedback.style.color = 'var(--green)';
      }
    });
  },

  _openCreateModal() {
    Modals.open('New Intervention', this._interventionFormHTML(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitCreate()">Create Intervention</button>
    `, { size: 'lg', onOpen: () => this._bindClientMachineDropdown() });
  },

  _submitCreate() {
    const clientId  = document.getElementById('fIntClient')?.value;
    const machineId = document.getElementById('fIntMachine')?.value;
    const type      = document.getElementById('fIntType')?.value;

    if (!clientId)  { Toast.error('Please select a client'); return; }
    if (!machineId) { Toast.error('Please select a machine'); return; }
    if (!type)      { Toast.error('Please select a type'); return; }

    // Prevent duplicate: block if this machine already has an open intervention
    const existing = appState.interventions.find(i =>
      i.machineId === machineId && CONFIG.OPEN_STATUSES.includes(i.status)
    );
    if (existing) {
      const machine = appState.machines.find(m => m.id === machineId);
      Toast.error(`Machine "${machine?.model || machineId}" already has an open intervention (status: ${CONFIG.STATUSES[existing.status]?.label || existing.status}). Close it before creating a new one.`);
      return;
    }

    const dateVal = document.getElementById('fIntDate')?.value;
    const timeVal = document.getElementById('fIntTime')?.value || '08:00';
    const scheduledDate = dateVal ? new Date(`${dateVal}T${timeVal}`).toISOString() : null;

    const user = appState.currentUser;
    Storage.createIntervention({
      clientId, machineId, type,
      priority:    document.getElementById('fIntPriority')?.value || 'medium',
      status:      document.getElementById('fIntStatus')?.value || 'new',
      technicianId: document.getElementById('fIntTech')?.value || null,
      location:    document.getElementById('fIntLocation')?.value || 'client',
      scheduledDate,
      description: document.getElementById('fIntDesc')?.value.trim() || '',
      createdBy:   user?.name || 'Admin'
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

    const notesHTML = (i.notes || []).length === 0
      ? '<p class="text-sm text-muted">No notes added yet.</p>'
      : `<div class="notes-list">${(i.notes || []).map(n => `
          <div class="note-item">
            <p class="note-text">${Utils.escapeHtml(n.text)}</p>
            <p class="note-meta">${Utils.escapeHtml(n.author)} · ${Utils.formatDateTime(n.createdAt)}</p>
          </div>
        `).join('')}</div>`;

    const partsHTML = (i.parts || []).length === 0
      ? '<p class="text-sm text-muted">No parts recorded.</p>'
      : `<table class="parts-table">
          <thead><tr><th>Reference</th><th>Description</th><th>Qty</th><th>Added</th></tr></thead>
          <tbody>${(i.parts || []).map(p => `
            <tr>
              <td style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
              <td>${Utils.escapeHtml(p.description)}</td>
              <td>${p.quantity}</td>
              <td>${Utils.formatDate(p.addedAt)}</td>
            </tr>
          `).join('')}</tbody>
        </table>`;

    const auditHTML = (i.auditTrail || []).length === 0
      ? '<p class="text-sm text-muted">No audit entries.</p>'
      : `<div class="audit-trail">${[...(i.auditTrail || [])].reverse().map(a => `
          <div class="audit-item">
            <div class="audit-line"><div class="audit-dot"></div><div class="audit-connector"></div></div>
            <div class="audit-content">
              <div class="audit-action">${Utils.escapeHtml(a.action)}</div>
              <div class="audit-meta">${Utils.escapeHtml(a.user)} · ${Utils.formatDateTime(a.timestamp)}${a.details ? ` — ${Utils.escapeHtml(a.details)}` : ''}</div>
            </div>
          </div>
        `).join('')}</div>`;

    const canAddNote = isAdmin || isTech;
    const canAddPart = isAdmin || isTech;

    const body = `
      <div class="detail-section">
        <div class="detail-section-label">Intervention Details</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-field-label">Client</div><div class="detail-field-value">${Utils.escapeHtml(client?.name || '—')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Machine</div><div class="detail-field-value">${Utils.escapeHtml(machine?.model || '—')} <span class="text-xs text-muted">(${Utils.escapeHtml(machine?.serialNumber || '')})</span></div></div>
          <div class="detail-field"><div class="detail-field-label">Type</div><div class="detail-field-value">${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</div></div>
          <div class="detail-field"><div class="detail-field-label">Location</div><div class="detail-field-value">${i.location === 'workshop' ? 'Workshop' : 'Client Premises'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Technician</div><div class="detail-field-value">${Utils.escapeHtml(tech?.name || 'Unassigned')}</div></div>
          <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value">${Utils.getStatusBadge(i.status)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Priority</div><div class="detail-field-value">${Utils.getPriorityBadge(i.priority)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Scheduled</div><div class="detail-field-value">${Utils.formatDateTime(i.scheduledDate)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Created</div><div class="detail-field-value">${Utils.formatDateTime(i.createdAt)}</div></div>
        </div>
      </div>

      ${i.description ? `
        <div class="detail-section">
          <div class="detail-section-label">Description</div>
          <p class="text-sm" style="white-space:pre-wrap;color:var(--gray-700)">${Utils.escapeHtml(i.description)}</p>
        </div>
      ` : ''}

      <div class="detail-section">
        <div class="detail-section-label" style="display:flex;align-items:center;justify-content:space-between">
          Notes
          ${canAddNote ? `<button class="btn btn-ghost btn-sm" onclick="Views.Interventions._openAddNoteModal('${i.id}')">+ Add Note</button>` : ''}
        </div>
        ${notesHTML}
      </div>

      <div class="detail-section">
        <div class="detail-section-label" style="display:flex;align-items:center;justify-content:space-between">
          Parts Used
          ${canAddPart ? `<button class="btn btn-ghost btn-sm" onclick="Views.Interventions._openAddPartModal('${i.id}')">+ Add Part</button>` : ''}
        </div>
        ${partsHTML}
      </div>

      <div class="detail-section">
        <div class="detail-section-label">Audit Trail</div>
        ${auditHTML}
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
      <button class="btn btn-secondary" onclick="Modals.close(); Views.Interventions._openEditModal('${i.id}')">Edit</button>
    `;

    Modals.open(`Intervention #${i.id.slice(-6)}`, body, footer, { size: 'lg' });
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
