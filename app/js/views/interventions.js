/* ============================================================
   views/interventions.js — Interventions View (Table + Kanban)
   ============================================================ */

Views.Interventions = {
  _effectCleanup: null,
  _sortKey: 'createdAt',
  _sortDir: 'desc',
  _page: 1,
  _createDraft: null,

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
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

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

    const clientOptions = [
      '<option value="all">All Clients</option>',
      ...appState.clients.map(c =>
        `<option value="${c.id}" ${appState.filters.clientId === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`)
    ].join('');

    const districtOptions = [
      '<option value="all">All Districts</option>',
      ...CONFIG.DISTRICTS.map(d =>
        `<option value="${d}" ${appState.filters.district === d ? 'selected' : ''}>${d}</option>`)
    ].join('');

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
            Add Machine
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
          <select id="intTech" class="toolbar-select">${techOptions}</select>
          <select id="intClient" class="toolbar-select">${clientOptions}</select>
          <input type="date" id="intDateFrom" class="toolbar-select" value="${appState.filters.dateFrom}" title="From date" style="min-width:120px">
          <input type="date" id="intDateTo" class="toolbar-select" value="${appState.filters.dateTo}" title="To date" style="min-width:120px">
          <select id="intDistrict" class="toolbar-select">${districtOptions}</select>
          <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._resetFilters()">Clear</button>
        </div>
        <span id="intCount"></span>
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
    bind('intDistrict', 'district');

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

    if (countEl) countEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-50,#EFF6FF);color:var(--primary-700,#1D4ED8);border:1px solid var(--primary-200,#BFDBFE);border-radius:999px;padding:2px 10px;font-size:0.78rem;font-weight:600">${interventions.length} <span style="font-weight:400;opacity:.75">result${interventions.length !== 1 ? 's' : ''}</span></span>`;
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
        va = Utils.getTechnicianNames(a).toLowerCase();
        vb = Utils.getTechnicianNames(b).toLowerCase();
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
          <td>${(() => {
            const FINAL = ['completed', 'cancelled'];
            if (!FINAL.includes(i.status)) {
              const n = (i.scheduledHistory || []).filter(s => s.status === i.status).length;
              if (n >= 1) {
                const cfg = CONFIG.STATUSES[i.status];
                return `<span class="badge ${cfg.color}">${cfg.label} ${n}</span>`;
              }
            }
            return Utils.getStatusBadge(i.status, i);
          })()}</td>
          <td style="font-size:0.786rem;color:${Utils.getTechIds(i).length ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(Utils.getTechnicianNames(i))}</td>
          <td style="white-space:nowrap;font-size:0.786rem;color:${i.statusUpdatedAt ? 'inherit' : 'var(--gray-400)'}">${i.statusUpdatedAt ? Utils.formatDateTime(i.statusUpdatedAt) : '—'}</td>
          <td style="white-space:nowrap;font-size:0.786rem">${Utils.formatDateTime(i.createdAt)}</td>
          <td style="font-size:0.786rem;color:${machine?.district ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(machine?.district || '—')}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Detail" onclick="Views.Interventions.openDetailModal('${i.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${(() => {
                const cu = appState.currentUser;
                const isTech = cu?.role === 'technician';
                const techIds = Utils.getTechIds(i);
                const assignedToOther = isTech && techIds.length > 0 && !techIds.includes(cu.id);
                if (assignedToOther) {
                  return `<button class="btn btn-ghost btn-sm btn-icon" title="Assigned to another technician" style="opacity:0.35;cursor:not-allowed" disabled>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>`;
                }
                return `<button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Views.Interventions._openEditModal('${i.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>`;
              })()}
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
              <th>District</th>
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
    if (countEl) countEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-50,#EFF6FF);color:var(--primary-700,#1D4ED8);border:1px solid var(--primary-200,#BFDBFE);border-radius:999px;padding:2px 10px;font-size:0.78rem;font-weight:600">${interventions.length} <span style="font-weight:400;opacity:.75">result${interventions.length !== 1 ? 's' : ''}</span></span>`;

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
              <span class="text-xs text-muted">${Utils.escapeHtml(Utils.getTechnicianNames(i))}</span>
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

    // Role-based status access:
    // Admin & Head Administrator: can only set Assigned, Tentative, Cancelled
    // Technician: can set all statuses except 'new', 'assigned', 'tentative', 'cancelled'
    const isCurrentlyNew = !intervention.status || intervention.status === 'new';
    const isSuperAdmin = appState.currentUser?.role === 'superadmin';
    const isAdmin = appState.currentUser?.role === 'admin' || isSuperAdmin;
    const ADMIN_STATUSES = ['tentative', 'assigned', 'cancelled'];
    const TECH_RESTRICTED_STATUSES = ['tentative', 'assigned', 'cancelled'];

    // PMC sequential status options for technicians.
    // Each PMC intervention is tied to a specific visit via maintenanceVisitIndex.
    // The technician can only complete their own visit, not any other.
    const isPmcIntervention = isEdit && intervention.type === 'pmc' && intervention.maintenanceContractId && !isAdmin;
    let pmcStatusOptions = '';
    if (isPmcIntervention) {
      const contract = appState.maintenanceContracts.find(c => c.id === intervention.maintenanceContractId);
      if (contract) {
        const schedule   = contract.schedule || [];
        const completed  = contract.completedVisits || [];
        const ordinals   = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
        // Use the visit index stored on this intervention; fall back to schedule scan
        const visitIndex = intervention.maintenanceVisitIndex ?? schedule.findIndex(d => !completed.includes(d));
        const alreadyDone = visitIndex >= 0 && completed.includes(schedule[visitIndex]);

        if (alreadyDone) {
          pmcStatusOptions = `<option value="pmc_all_done" disabled selected>Visit Already Completed</option>`;
        } else if (visitIndex >= 0) {
          const total = schedule.length;
          const label = total === 1
            ? 'Contract Maintenance – Completed'
            : `${ordinals[visitIndex] || `${visitIndex + 1}th`} Maintenance – Completed`;
          pmcStatusOptions = `<option value="pmc_visit_${visitIndex}" selected>${label}</option>`;
        } else {
          pmcStatusOptions = `<option value="pmc_all_done" disabled selected>All Maintenances Completed</option>`;
        }
      }
    }

    const statusOptions = isPmcIntervention ? pmcStatusOptions : Object.entries(CONFIG.STATUSES)
      .filter(([k]) => {
        if (k === 'new') return false;
        if (isAdmin && !ADMIN_STATUSES.includes(k)) return false;
        if (!isAdmin && TECH_RESTRICTED_STATUSES.includes(k)) return false;
        return true;
      })
      .map(([k, v]) =>
        `<option value="${k}" ${intervention.status === k ? 'selected' : ''}>${v.label}</option>`
      ).join('');

    const currentTechIds = Utils.getTechIds(intervention);
    const techCheckboxes = appState.users.filter(u => u.role === 'technician').map(u => `
      <label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--gray-200);border-radius:var(--radius-sm);cursor:pointer;font-size:0.857rem;transition:background 0.15s"
             onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
        <input type="checkbox" class="fIntTechCheck" value="${u.id}" ${currentTechIds.includes(u.id) ? 'checked' : ''}
               style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary)">
        ${Utils.escapeHtml(u.name)}
      </label>`).join('');

    const techReadOnly = isEdit && !isAdmin && !isSuperAdmin;

    // PMC draft values — needed in outer template scope
    const dPmcStart  = intervention.pmcStartDate ?? '';
    const dPmcEnd    = intervention.pmcEndDate   ?? '';
    const dPmcVisits = intervention.pmcVisits    ?? '2';

    // Machine section — register new on create, dropdowns on edit
    const machineSection = isEdit ? `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client</label>
          <select id="fIntClient" class="form-select" ${techReadOnly ? 'disabled' : ''}>
            <option value="">— Select client —</option>
            ${clientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Machine</label>
          <select id="fIntMachine" class="form-select" ${techReadOnly ? 'disabled' : ''}>
            <option value="">— Select machine —</option>
            ${machineOptions}
          </select>
        </div>
      </div>
    ` : (() => {
      const d = intervention; // draft values (may be empty {})
      const dName     = d.machineName    ?? 'MULTIVAC';
      const dModel    = d.model          ?? '';
      const dSerial   = d.serial         ?? '';
      const dMType    = d.machineType    ?? '';
      const dClient   = d.clientId       ?? '';
      const dLocation  = d.machineLocation ?? '';
      const dDistrict  = d.machineDistrict ?? '';
      const draftClientOptions = appState.clients.map(c =>
        `<option value="${c.id}" ${dClient === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`
      ).join('');
      return `
      <div style="background:var(--blue-light);border:1px solid var(--blue);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;font-size:0.786rem;color:var(--blue)">
        A new machine will be registered automatically with a unique Job # and status <strong>New</strong>.
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Name</label>
          <input type="text" id="fNewMachineName" class="form-input" value="${Utils.escapeHtml(dName)}" placeholder="MULTIVAC">
        </div>
        <div class="form-group">
          <label class="form-label">Model <span class="required">*</span></label>
          <input type="text" id="fNewMachineModel" class="form-input" value="${Utils.escapeHtml(dModel)}" placeholder="e.g. R230">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Serial Number <span class="required">*</span></label>
          <input type="text" id="fNewMachineSerial" class="form-input" value="${Utils.escapeHtml(dSerial)}" placeholder="MV-XXXX-YYYY-NNN">
        </div>
        <div class="form-group"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Machine Type</label>
          <select id="fNewMachineType" class="form-select">
            <option value="">— Select type —</option>
            ${[
              'Thermoforming',
              'Vacuum Chamber Machines',
              'Chamber Belt Machines',
              'Tray Sealers',
              'Labelling Machines',
              'Shrink & Drying Units',
              'Inspection Systems',
              'Pouch Loading Systems',
              'Slicer',
              'Flowpack'
            ].map(t => `<option value="${t}" ${dMType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Client <span class="required">*</span></label>
          <select id="fNewMachineClient" class="form-select">
            <option value="">— Select client —</option>
            ${draftClientOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">District</label>
          <select id="fNewMachineDistrict" class="form-select">
            <option value="">— Select district —</option>
            ${CONFIG.DISTRICTS.map(d => `<option value="${d}" ${dDistrict === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"></div>
      </div>
      <hr style="border:none;border-top:1px solid var(--gray-200);margin:8px 0 12px">
    `;})();

    return `
      ${techReadOnly ? `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-sm);margin-bottom:12px;font-size:0.786rem;color:var(--gray-600)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Client, Machine, Type, Priority, Location, Scheduled Date and Time are managed by Administrators.
      </div>` : ''}
      ${machineSection}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type${!techReadOnly ? ' <span class="required">*</span>' : ''}</label>
          <select id="fIntType" class="form-select" ${techReadOnly ? 'disabled' : ''}
            ${!isEdit ? `onchange="Views.Interventions._onTypeChange(this.value)"` : ''}>${typeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority${!techReadOnly ? ' <span class="required">*</span>' : ''}</label>
          <select id="fIntPriority" class="form-select" ${techReadOnly ? 'disabled' : ''}>${priorityOptions}</select>
        </div>
      </div>
      ${!isEdit ? `
      <div id="fPmcFields" style="display:${(intervention.type || 'breakdown') === 'pmc' ? '' : 'none'}">
        <div style="padding:10px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-sm);margin-bottom:12px;font-size:0.786rem;color:#1E40AF">
          <strong>Maintenance Contract</strong> — A contract will be automatically created and linked to this machine.
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Contract Start Date <span class="required">*</span></label>
            <input type="date" id="fPmcStart" class="form-input" value="${dPmcStart}">
          </div>
          <div class="form-group">
            <label class="form-label">Contract End Date</label>
            <input type="text" class="form-input" disabled placeholder="Auto: 1 year from start date" style="color:var(--gray-400);background:var(--gray-50)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Maintenances per Year <span class="required">*</span></label>
            <select id="fPmcVisits" class="form-select">
              <option value="1" ${dPmcVisits === '1' ? 'selected' : ''}>1 per year</option>
              <option value="2" ${dPmcVisits === '2' ? 'selected' : ''}>2 per year</option>
              <option value="3" ${dPmcVisits === '3' ? 'selected' : ''}>3 per year</option>
              <option value="4" ${dPmcVisits === '4' ? 'selected' : ''}>4 per year</option>
            </select>
          </div>
          <div class="form-group"></div>
        </div>
      </div>` : ''}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Intervention Location</label>
          <select id="fIntLocation" class="form-select" ${techReadOnly ? 'disabled' : ''}>
            <option value="client" ${(intervention.location || 'client') === 'client' ? 'selected' : ''}>Client Premises</option>
            <option value="workshop" ${intervention.location === 'workshop' ? 'selected' : ''}>Workshop</option>
          </select>
        </div>
        ${isEdit ? `
        <div class="form-group">
          <label class="form-label">Status</label>
          ${!isAdmin && isCurrentlyNew ? `
          <select id="fIntStatus" class="form-select" disabled style="opacity:0.55;cursor:not-allowed">
            <option value="new">New</option>
          </select>
          <div style="display:flex;align-items:flex-start;gap:6px;margin-top:6px;padding:8px 10px;background:var(--yellow-light);border:1px solid #FCD34D;border-radius:var(--radius-sm);font-size:0.786rem;color:#92400E;line-height:1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Status cannot be updated yet. This intervention must first be scheduled or assigned by an Administrator.
          </div>` : `
          <select id="fIntStatus" class="form-select">${statusOptions}</select>`}
        </div>` : '<div class="form-group"></div>'}
      </div>
      ${isEdit ? `
      <div class="form-group">
        <label class="form-label">Status Note <span style="font-weight:400;color:var(--gray-400);font-size:0.786rem">(optional — explain this status change)</span></label>
        <textarea id="fIntStatusNote" class="form-textarea" rows="2" placeholder="e.g. Rescheduled due to technician unavailability…"></textarea>
      </div>
      ${isAdmin ? `
      <div class="form-group">
        <label class="form-label">Assigned Technician(s) <span class="required" id="fIntTechRequired" style="${isCurrentlyNew ? 'display:none' : ''}">*</span></label>
        <div id="fIntTechList" style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;padding:2px">
          ${techCheckboxes || '<span style="color:var(--gray-400);font-size:0.857rem">No technicians registered</span>'}
        </div>
      </div>` : ''}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Scheduled Date${!techReadOnly ? ` <span class="required" id="fIntDateRequired" style="${isCurrentlyNew ? 'display:none' : ''}">*</span>` : ''}</label>
          <input type="date" id="fIntDate" class="form-input" value="${intervention.scheduledDate ? intervention.scheduledDate.slice(0, 10) : ''}" ${techReadOnly ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label">Scheduled Time${!techReadOnly ? ` <span class="required" id="fIntTimeRequired" style="${isCurrentlyNew ? 'display:none' : ''}">*</span>` : ''}</label>
          <input type="time" id="fIntTime" class="form-input" value="${intervention.scheduledDate ? new Date(intervention.scheduledDate).toTimeString().slice(0,5) : '08:00'}" ${techReadOnly ? 'disabled' : ''}>
        </div>
      </div>` : ''}
      ${!isEdit ? `
      <div class="form-group">
        <label class="form-label">Description <span class="required">*</span></label>
        <textarea id="fIntDesc" class="form-textarea" rows="3" placeholder="Describe the issue or work to be done…"></textarea>
      </div>` : ''}
    `;
  },

  _onTypeChange(type) {
    const pmcFields = document.getElementById('fPmcFields');
    if (pmcFields) pmcFields.style.display = type === 'pmc' ? '' : 'none';
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

  _bindEditStatusChange() {
    const statusSel = document.getElementById('fIntStatus');
    if (!statusSel) return;
    const toggle = () => {
      const isNew = !statusSel.value || statusSel.value === 'new';
      const display = isNew ? 'none' : '';
      ['fIntTechRequired', 'fIntDateRequired', 'fIntTimeRequired'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = display;
      });
    };
    statusSel.addEventListener('change', toggle);
    toggle(); // run on open
  },

  _openCreateModal() {
    const draft = this._createDraft || {};
    Modals.open('Add Machine', this._interventionFormHTML(draft), `
      <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._clearCreateDraft()" title="Clear all fields">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.75"/></svg>
        Clear Form
      </button>
      <div style="flex:1"></div>
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitCreate()">Add Machine</button>
    `, { size: 'lg', onClose: () => Views.Interventions._saveCreateDraft() });
  },

  _saveCreateDraft() {
    // Read all create-form fields and persist them in memory
    const get = id => document.getElementById(id)?.value ?? null;
    this._createDraft = {
      machineName:     get('fNewMachineName'),
      model:           get('fNewMachineModel'),
      serial:          get('fNewMachineSerial'),
      machineType:     get('fNewMachineType'),
      clientId:         get('fNewMachineClient'),
      machineLocation:  get('fNewMachineLocation'),
      machineDistrict:  get('fNewMachineDistrict'),
      type:            get('fIntType'),
      priority:        get('fIntPriority'),
      location:        get('fIntLocation'),
      description:     get('fIntDesc'),
      pmcStartDate:    get('fPmcStart'),
      pmcVisits:       get('fPmcVisits'),
    };
    // Discard if every meaningful field is empty / default
    const meaningful = ['model','serial','machineType','machineLocation','description','pmcStartDate','pmcEndDate'];
    const hasData = meaningful.some(k => this._createDraft[k]);
    const nonDefaultClient = this._createDraft.clientId;
    const nonDefaultName   = this._createDraft.machineName && this._createDraft.machineName !== 'MULTIVAC';
    if (!hasData && !nonDefaultClient && !nonDefaultName) this._createDraft = null;
  },

  _clearCreateDraft() {
    this._createDraft = null;
    // Re-render the modal body with a blank form
    const bodyEl = document.getElementById('modalBody');
    if (bodyEl) bodyEl.innerHTML = this._interventionFormHTML({});
    // Re-apply PMC fields visibility
    const typeEl = document.getElementById('fIntType');
    if (typeEl) this._onTypeChange(typeEl.value);
  },

  async _submitCreate() {
    const type = document.getElementById('fIntType')?.value;
    if (!type) { Toast.error('Please select an intervention type'); return; }

    const user = appState.currentUser;

    const machineName = document.getElementById('fNewMachineName')?.value.trim() || 'MULTIVAC';
    const model    = document.getElementById('fNewMachineModel')?.value.trim();
    const serial   = document.getElementById('fNewMachineSerial')?.value.trim();
    const clientId = document.getElementById('fNewMachineClient')?.value;

    const description = document.getElementById('fIntDesc')?.value.trim();

    if (!model)       { Toast.error('Machine model is required'); return; }
    if (!serial)      { Toast.error('Serial number is required'); return; }
    if (!clientId)    { Toast.error('Please select a client for the machine'); return; }
    if (!description) { Toast.error('Description is required'); return; }

    // If type is PMC, validate and collect contract fields
    if (type === 'pmc') {
      const pmcStart = document.getElementById('fPmcStart')?.value;
      if (!pmcStart) { Toast.error('Contract Start Date is required for PMC'); return; }
    }

    const newMachine = await Storage.createMachine({
      name: machineName, model, serialNumber: serial, clientId,
      type: document.getElementById('fNewMachineType')?.value || '',
      location: document.getElementById('fNewMachineLocation')?.value.trim() || '',
      district: document.getElementById('fNewMachineDistrict')?.value || '',
    });
    const machineId = newMachine.id;

    // Auto-create maintenance contract for PMC type
    let pmcContractId = null;
    let pmcStartDate  = null;
    if (type === 'pmc') {
      const pmcStart  = document.getElementById('fPmcStart')?.value;
      const pmcVisits = parseInt(document.getElementById('fPmcVisits')?.value, 10) || 2;
      // Auto-calculate end date as exactly 1 year after start date
      const endDateObj = new Date(pmcStart);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      const pmcEnd = endDateObj.toISOString().split('T')[0];
      const schedule  = Views.MaintenanceContracts._generateSchedule(pmcStart, pmcEnd, pmcVisits);
      const contract  = await Storage.createMaintenanceContract({
        clientId, machineId,
        serialNumber: serial,
        startDate:    pmcStart,
        endDate:      pmcEnd,
        visitsPerYear: pmcVisits,
        schedule,
        completedVisits: [],
        notes: '',
        createdBy: user?.name || 'Admin'
      });
      pmcContractId = contract.id;
      pmcStartDate  = pmcStart;
    }

    await Storage.createIntervention({
      clientId, machineId, type,
      priority:     document.getElementById('fIntPriority')?.value || 'medium',
      status:       'new',
      technicianId: null,
      location:     document.getElementById('fIntLocation')?.value || 'client',
      scheduledDate: pmcStartDate ? new Date(`${pmcStartDate}T08:00`).toISOString() : null,
      description,
      createdBy:    user?.name || 'Admin',
      ...(pmcContractId ? { maintenanceContractId: pmcContractId, maintenanceVisitIndex: 0 } : {})
    });

    this._createDraft = null;
    Modals.close();
    Toast.success('Machine added successfully');
  },

  _openEditModal(interventionId) {
    const intervention = appState.interventions.find(i => i.id === interventionId);
    if (!intervention) return;

    // Clear queued notes/parts only on a fresh open (not when returning from a sub-modal)
    if (!this._editDraft) {
      this._queuedNotes = [];
      this._queuedParts = [];
    }

    if (intervention.status === 'completed') {
      Toast.error('This intervention is completed. No further changes are allowed.');
      return;
    }
    if (intervention.status === 'cancelled') {
      Toast.error('This intervention is cancelled. No further changes are allowed.');
      return;
    }

    const user = appState.currentUser;

    // Block technicians from editing jobs not assigned to them
    if (user?.role === 'technician') {
      const techIds = Utils.getTechIds(intervention);
      if (techIds.length > 0 && !techIds.includes(user.id)) {
        Toast.error('You are not authorized to update this job because it is assigned to another technician.');
        return;
      }
    }

    const isTechOnNew = user?.role === 'technician' && (!intervention.status || intervention.status === 'new');

    const queuedCount = this._queuedNotes.length + this._queuedParts.length;
    const noteLabel  = this._queuedNotes.length > 0 ? `${this._queuedNotes.length} note${this._queuedNotes.length > 1 ? 's' : ''}` : '';
    const partLabel  = this._queuedParts.length > 0 ? `${this._queuedParts.length} part${this._queuedParts.length > 1 ? 's' : ''}` : '';
    const joinLabel  = noteLabel && partLabel ? ' &amp; ' : '';
    const queuedBadge = queuedCount > 0
      ? `<button onclick="Views.Interventions._openQueueReviewModal('${interventionId}')"
           style="font-size:0.786rem;color:#065F46;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:var(--radius-sm);padding:5px 10px;display:flex;align-items:center;gap:6px;cursor:pointer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
          ${noteLabel}${joinLabel}${partLabel} pending
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="opacity:0.6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>`
      : '';

    Modals.open(`Edit Intervention`, this._interventionFormHTML(intervention), `
      <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._openAddNoteModal('${interventionId}','edit')" style="margin-right:4px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Add Note
      </button>
      <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._openAddPartModal('${interventionId}','edit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        Add Part
      </button>
      ${queuedBadge}
      <div style="flex:1"></div>
      ${isTechOnNew ? `
      <span style="font-size:0.786rem;color:#92400E;background:var(--yellow-light);border:1px solid #FCD34D;border-radius:var(--radius-sm);padding:6px 10px;display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Must be scheduled or assigned by an Admin first.
      </span>` : ''}
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitEdit('${interventionId}')" ${isTechOnNew ? 'disabled title="This intervention must first be scheduled or assigned by an Administrator."' : ''}>Save Changes</button>
    `, { size: 'lg', onOpen: () => { this._bindClientMachineDropdown(); this._bindEditStatusChange(); this._restoreEditDraft(); } });
  },

  _openQueueReviewModal(interventionId) {
    this._captureEditDraft();

    const notesHTML = this._queuedNotes.length === 0
      ? `<p style="color:var(--gray-400);font-size:0.857rem;padding:10px 0">No notes queued.</p>`
      : this._queuedNotes.map((n, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px">
            <div style="flex:1;font-size:0.857rem;line-height:1.5;white-space:pre-wrap">${Utils.escapeHtml(n.text)}</div>
            <button class="btn btn-ghost btn-sm btn-icon" title="Remove note" style="color:var(--red);flex-shrink:0"
              onclick="Views.Interventions._removeQueuedNote(${i},'${interventionId}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>`).join('');

    const partsHTML = this._queuedParts.length === 0
      ? `<p style="color:var(--gray-400);font-size:0.857rem;padding:10px 0">No parts queued.</p>`
      : `<table class="data-table" style="margin-top:4px">
          <thead>
            <tr><th>Reference</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th><th></th></tr>
          </thead>
          <tbody>
            ${this._queuedParts.map((p, i) => `
              <tr>
                <td style="font-family:monospace;font-size:0.857rem;font-weight:600">${Utils.escapeHtml(p.reference)}</td>
                <td style="font-size:0.857rem">${Utils.escapeHtml(p.description || '—')}</td>
                <td style="text-align:center;font-weight:600">${p.quantity}</td>
                <td style="text-align:center"><span class="part-unit-tag">${Utils.escapeHtml(p.unit || 'pcs')}</span></td>
                <td style="text-align:right">
                  <button class="btn btn-ghost btn-sm btn-icon" title="Remove part" style="color:var(--red)"
                    onclick="Views.Interventions._removeQueuedPart(${i},'${interventionId}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    const body = `
      <div style="font-size:0.786rem;color:var(--gray-500);margin-bottom:16px;padding:8px 12px;background:#FEF9C3;border:1px solid #FDE68A;border-radius:6px">
        These notes and parts are <strong>queued</strong> and will be saved when you click <strong>Save Changes</strong> in the edit form. You can remove any item here before saving.
      </div>

      <div style="margin-bottom:20px">
        <div style="font-size:0.8rem;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Notes
          <span style="background:var(--gray-200);color:var(--gray-600);border-radius:999px;padding:1px 8px;font-size:0.75rem">${this._queuedNotes.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">${notesHTML}</div>
      </div>

      <div>
        <div style="font-size:0.8rem;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          Parts
          <span style="background:var(--gray-200);color:var(--gray-600);border-radius:999px;padding:1px 8px;font-size:0.75rem">${this._queuedParts.length}</span>
        </div>
        ${partsHTML}
      </div>`;

    Modals.open('Pending Notes &amp; Parts', body, `
      <button class="btn btn-ghost" onclick="Modals.close();setTimeout(()=>Views.Interventions._openEditModal('${interventionId}'),80)">Back to Edit</button>
    `);
  },

  _removeQueuedNote(idx, interventionId) {
    this._queuedNotes.splice(idx, 1);
    Modals.close();
    setTimeout(() => this._openQueueReviewModal(interventionId), 80);
  },

  _removeQueuedPart(idx, interventionId) {
    this._queuedParts.splice(idx, 1);
    Modals.close();
    setTimeout(() => this._openQueueReviewModal(interventionId), 80);
  },

  async _submitEdit(interventionId) {
    const original   = appState.interventions.find(i => i.id === interventionId);

    if (original.status === 'completed') {
      Toast.error('This intervention is completed. No further changes are allowed.');
      return;
    }
    if (original.status === 'cancelled') {
      Toast.error('This intervention is cancelled. No further changes are allowed.');
      return;
    }

    const currentUser = appState.currentUser;
    const userIsSuperAdmin = currentUser?.role === 'superadmin';
    const userIsAdmin = currentUser?.role === 'admin' || userIsSuperAdmin;

    // Block technicians from submitting edits on jobs not assigned to them
    if (!userIsAdmin) {
      const techIds = Utils.getTechIds(original);
      if (techIds.length > 0 && !techIds.includes(currentUser?.id)) {
        Toast.error('You are not authorized to update this job because it is assigned to another technician.');
        return;
      }
    }

    // Block technicians from editing a 'new' intervention
    if (!userIsAdmin && (!original.status || original.status === 'new')) {
      Toast.error('This intervention must first be scheduled or assigned by an Administrator.');
      return;
    }

    // For technicians, locked fields always retain original values
    const clientId  = userIsAdmin ? document.getElementById('fIntClient')?.value  : original.clientId;
    const machineId = userIsAdmin ? document.getElementById('fIntMachine')?.value : original.machineId;

    if (!clientId)  { Toast.error('Please select a client'); return; }
    if (!machineId) { Toast.error('Please select a machine'); return; }

    const rawStatus = document.getElementById('fIntStatus')?.value || original.status;

    if (rawStatus === 'pmc_all_done') {
      Toast.error('All maintenance visits for this contract are already completed.');
      return;
    }

    // Handle PMC visit completion statuses (pmc_visit_N)
    const isPmcCompletion = rawStatus.startsWith('pmc_visit_');
    let newStatus    = rawStatus;
    let pmcProgress  = null; // human-readable cumulative progress label
    if (isPmcCompletion && original.maintenanceContractId) {
      const visitIndex = parseInt(rawStatus.replace('pmc_visit_', ''), 10);
      const contract   = appState.maintenanceContracts.find(c => c.id === original.maintenanceContractId);
      if (contract) {
        const schedule  = contract.schedule || [];
        const visitDate = schedule[visitIndex];
        if (visitDate) {
          const completed = [...(contract.completedVisits || [])];
          if (!completed.includes(visitDate)) completed.push(visitDate);
          await Storage.updateMaintenanceContract(original.maintenanceContractId, { completedVisits: completed });

          const total     = schedule.length;
          const doneCount = completed.length;
          const allDone   = doneCount >= total;

          // Format: "1 / 4 Done", "2 / 4 Done", "4 / 4 Completed"
          pmcProgress = allDone
            ? `${doneCount} / ${total} Completed`
            : `${doneCount} / ${total} Done`;

          if (allDone) {
            Toast.success(`${doneCount} / ${total} — All contract visits completed!`);
          } else {
            const remaining = total - doneCount;
            Toast.success(`${doneCount} / ${total} visits done. ${remaining} remaining.`);
          }

          newStatus = 'completed';
        }
      } else {
        newStatus = 'completed';
      }
    }

    // Role-based status guard
    // Admin & Head Administrator: Assigned, Tentative, Cancelled only
    // Technician: cannot set Assigned, Tentative, or Cancelled
    const ADMIN_ALLOWED_STATUSES = ['tentative', 'assigned', 'cancelled'];
    const currentIsAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (!isPmcCompletion) {
      if (currentIsAdmin && !ADMIN_ALLOWED_STATUSES.includes(newStatus)) {
        Toast.error('Admins can only set status to Assigned, Tentative, or Cancelled.');
        return;
      }
      if (!currentIsAdmin && ADMIN_ALLOWED_STATUSES.includes(newStatus)) {
        Toast.error('You do not have permission to set this status.');
        return;
      }
    }

    // Enforce max 5 updates per non-final status
    const FINAL_STATUSES = ['completed', 'cancelled', 'new'];
    if (!FINAL_STATUSES.includes(newStatus)) {
      const existingCount = (original.scheduledHistory || []).filter(s => s.status === newStatus).length;
      if (existingCount >= 5) {
        const statusLabel = CONFIG.STATUSES[newStatus]?.label || newStatus;
        Toast.error(`"${statusLabel}" has reached the maximum of 5 updates. Change the status to proceed.`);
        return;
      }
    }

    // When status is anything other than 'new', admin must assign a technician + date + time
    if (newStatus !== 'new' && userIsAdmin) {
      const techVal = Array.from(document.querySelectorAll('.fIntTechCheck:checked')).length > 0;
      if (!techVal) {
        Toast.error('A technician must be assigned before saving with this status.');
        return;
      }
      const dateCheck = document.getElementById('fIntDate')?.value;
      if (!dateCheck) {
        Toast.error('Scheduled Date is required when a status is set.');
        return;
      }
      const timeCheck = document.getElementById('fIntTime')?.value;
      if (!timeCheck) {
        Toast.error('Scheduled Time is required when a status is set.');
        return;
      }
    }

    const dateVal = userIsAdmin ? document.getElementById('fIntDate')?.value : (original.scheduledDate ? original.scheduledDate.slice(0, 10) : '');
    const timeVal = userIsAdmin ? (document.getElementById('fIntTime')?.value || '08:00') : (original.scheduledDate ? new Date(original.scheduledDate).toTimeString().slice(0, 5) : '08:00');
    const scheduledDate = dateVal ? new Date(`${dateVal}T${timeVal}`).toISOString() : null;
    const statusNote = document.getElementById('fIntStatusNote')?.value.trim() || '';
    const user = currentUser;

    const auditEntry = newStatus !== original.status ? {
      action: 'Status Changed',
      user: user?.name || 'Admin',
      details: `${original.status} → ${newStatus}`,
      statusNote
    } : {
      action: 'Updated',
      user: user?.name || 'Admin',
      details: 'Intervention details updated',
      statusNote
    };

    await Storage.updateIntervention(interventionId, {
      clientId, machineId,
      type:         userIsAdmin ? document.getElementById('fIntType')?.value     : original.type,
      priority:     userIsAdmin ? document.getElementById('fIntPriority')?.value : original.priority,
      status:       newStatus,
      technicianIds: userIsAdmin
        ? Array.from(document.querySelectorAll('.fIntTechCheck:checked')).map(cb => cb.value)
        : Utils.getTechIds(original),
      technicianId: userIsAdmin
        ? (Array.from(document.querySelectorAll('.fIntTechCheck:checked')).map(cb => cb.value)[0] || null)
        : original.technicianId,
      location:     userIsAdmin ? (document.getElementById('fIntLocation')?.value || 'client') : original.location,
      scheduledDate,
      ...(pmcProgress !== null ? { pmcProgress } : {})
    }, auditEntry);

    // Flush queued notes
    if (this._queuedNotes.length > 0) {
      for (const note of this._queuedNotes) await Storage.addInterventionNote(interventionId, note);
      this._queuedNotes = [];
    }

    // Flush queued parts
    if (this._queuedParts.length > 0) {
      for (const p of this._queuedParts) await Storage.addInterventionPart(interventionId, p);
      this._queuedParts = [];
    }

    Modals.close();
    if (!isPmcCompletion) Toast.success('Intervention updated');
  },

  _deleteIntervention(interventionId) {
    const intervention = appState.interventions.find(i => i.id === interventionId);
    if (!intervention) return;

    const machine = appState.machines.find(m => m.id === intervention.machineId);
    const jobNumber = machine?.jobNumber || '—';

    Modals.open('Confirm Job Deletion', `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.857rem;color:#991B1B">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>This action is <strong>permanent and irreversible</strong>. The job will be archived in the Deleted Jobs log.</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Job Number <span class="required">*</span></label>
          <input type="text" id="dJobNumber" class="form-input" placeholder="${jobNumber}">
        </div>
        <div class="form-group">
          <label class="form-label">Your Email <span class="required">*</span></label>
          <input type="email" id="dAdminEmail" class="form-input" placeholder="admin@example.com">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Your Password <span class="required">*</span></label>
          <input type="password" id="dAdminPassword" class="form-input" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Type <strong>delete</strong> to confirm <span class="required">*</span></label>
          <input type="text" id="dConfirmWord" class="form-input" placeholder="delete">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Deletion <span class="required">*</span></label>
        <textarea id="dReason" class="form-textarea" rows="3" placeholder="Explain why this job is being deleted…"></textarea>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-danger" onclick="Views.Interventions._confirmDeleteIntervention('${interventionId}','${jobNumber}')">Delete Job</button>
    `);
  },

  async _confirmDeleteIntervention(interventionId, expectedJobNumber) {
    const jobNumberInput = document.getElementById('dJobNumber')?.value.trim();
    const email          = document.getElementById('dAdminEmail')?.value.trim();
    const password       = document.getElementById('dAdminPassword')?.value;
    const confirmWord    = document.getElementById('dConfirmWord')?.value.trim();
    const reason         = document.getElementById('dReason')?.value.trim();

    if (!jobNumberInput || !email || !password || !confirmWord || !reason) {
      Toast.error('All fields are required.'); return;
    }
    if (jobNumberInput !== expectedJobNumber) {
      Toast.error('Job Number does not match.'); return;
    }
    if (confirmWord !== 'delete') {
      Toast.error('You must type "delete" exactly to confirm.'); return;
    }

    const users = appState.users;
    const admin = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      (u.role === 'admin' || u.role === 'superadmin')
    );
    if (!admin) {
      Toast.error('Admin email or password is incorrect.'); return;
    }

    const intervention = appState.interventions.find(i => i.id === interventionId);
    const machine = appState.machines.find(m => m.id === intervention?.machineId);
    const client  = appState.clients.find(c => c.id === intervention?.clientId);
    await Storage.archiveDeletedJob({
      id:           interventionId,
      jobNumber:    machine?.jobNumber || '—',
      clientName:   client?.name || '—',
      machineModel: machine?.model || '—',
      type:         intervention?.type || '—',
      status:       intervention?.status || '—',
      createdAt:    intervention?.createdAt || null,
      deletedAt:    new Date().toISOString(),
      deletedBy:    admin.name,
      reason
    });

    await Storage.deleteIntervention(interventionId);
    Modals.close();
    Toast.success('Job deleted and archived in Deleted Jobs log.');
  },

  // ── DETAIL MODAL ──────────────────────────────────────────
  openDetailModal(interventionId) {
    const i = appState.interventions.find(iv => iv.id === interventionId);
    if (!i) return;

    const client    = appState.clients.find(c => c.id === i.clientId);
    const machine   = appState.machines.find(m => m.id === i.machineId);
    const user      = appState.currentUser;
    const isAdmin   = user && (user.role === 'admin' || user.role === 'superadmin');
    const isTech    = user && Utils.getTechIds(i).includes(user.id);
    const creatorUser = appState.users.find(u => u.name === i.createdBy);
    const creatorRole = creatorUser ? (CONFIG.ROLES[creatorUser.role] || creatorUser.role) : null;

    const canAddNote = false;
    const canAddPart = false;

    // ── Build scheduled history — indexed globally for sequence numbers ──
    const schedHistoryAll = [...(i.scheduledHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const FINAL_STATUSES = ['completed', 'cancelled'];
    const seqCounters = {};
    const schedHistoryIndexed = schedHistoryAll.map((s, globalIdx) => {
      const tracked = !FINAL_STATUSES.includes(s.status);
      let seq = null;
      if (tracked) {
        seqCounters[s.status] = (seqCounters[s.status] || 0) + 1;
        seq = seqCounters[s.status];
      }
      return { ...s, seq, globalIdx };
    });

    // Helper: render schedule entries for a given status window
    const renderSchedBlock = (windowStart, windowEnd) => {
      const entries = schedHistoryIndexed.filter(s => {
        const t = new Date(s.timestamp);
        return t >= windowStart && t < windowEnd;
      });
      if (entries.length === 0) return '';
      const lastGlobalIdx = schedHistoryIndexed.length - 1;
      return `
        <div class="stab-block">
          <div class="stab-block-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Schedule History
          </div>
          <div class="sched-history-timeline sched-history-inline">
            ${entries.map(s => {
              const isLatestEntry = s.globalIdx === lastGlobalIdx;
              const schedTechIds = s.technicianIds?.length
                ? s.technicianIds
                : (s.technicianId ? [s.technicianId] : (isLatestEntry ? Utils.getTechIds(i) : []));
              const schedTechName = schedTechIds.length
                ? schedTechIds.map(id => appState.users.find(u => u.id === id)?.name).filter(Boolean).join(', ')
                : null;
              const statusLabel = s.seq !== null
                ? `${CONFIG.STATUSES[s.status]?.label || s.status} ${s.seq}`
                : (CONFIG.STATUSES[s.status]?.label || s.status);
              const cfg = CONFIG.STATUSES[s.status];
              return `
                <div class="sched-history-item${isLatestEntry ? ' sched-history-item-current' : ''}">
                  <div class="sched-history-dot"></div>
                  <div class="sched-history-content">
                    <div class="sched-history-date">${Utils.formatDateTime(s.scheduledDate)}</div>
                    <div class="sched-history-row"><span class="badge ${cfg ? cfg.color : 'badge-gray'}">${statusLabel}</span>${isLatestEntry ? ' <span class="al-current-tag">Current</span>' : ''}</div>
                    <div class="sched-history-row sched-history-row-meta">Set by <strong>${Utils.escapeHtml(s.changedBy)}</strong></div>
                    ${schedTechName ? `<div class="sched-history-row sched-history-row-meta">Assigned to <strong>${Utils.escapeHtml(schedTechName)}</strong></div>` : ''}
                    <div class="sched-history-row sched-history-row-time">${Utils.formatDateTime(s.timestamp)}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    };

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
        windowStart,
        windowEnd,
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
      : statusTabs.map(({ s, isLatest, tabId, panelId, windowStart, windowEnd, cardNotes, cardParts }) => {

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
                <thead><tr><th>Reference</th><th>Description</th><th>Qty</th><th>Unit</th><th>Added</th></tr></thead>
                <tbody>${cardParts.map(p => `
                  <tr>
                    <td style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
                    <td>${Utils.escapeHtml(p.description)}</td>
                    <td style="text-align:center">${p.quantity}</td>
                    <td><span class="part-unit-tag">${Utils.escapeHtml(p.unit || 'pcs')}</span></td>
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
                ${s.note ? `<div class="stab-panel-note">${Utils.escapeHtml(s.note)}</div>` : ''}
              </div>

              ${renderSchedBlock(windowStart, windowEnd)}

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
          <div class="detail-field"><div class="detail-field-label">Technician</div><div class="detail-field-value" style="${!Utils.getTechIds(i).length ? 'color:var(--gray-400)' : ''}">${Utils.escapeHtml(Utils.getTechnicianNames(i))}</div></div>
          <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value">${Utils.getStatusBadge(i.status, i)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Priority</div><div class="detail-field-value">${Utils.getPriorityBadge(i.priority)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Scheduled</div><div class="detail-field-value">${Utils.formatDateTime(i.scheduledDate)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Created</div><div class="detail-field-value">${Utils.formatDateTime(i.createdAt)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Created By</div><div class="detail-field-value">${i.createdBy ? `${Utils.escapeHtml(i.createdBy)}${creatorRole ? `<span class="creator-role-tag">${Utils.escapeHtml(creatorRole)}</span>` : ''}` : '<span style="color:var(--gray-400)">—</span>'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Status Last Updated</div><div class="detail-field-value">${i.statusUpdatedAt ? Utils.formatDateTime(i.statusUpdatedAt) : '—'}</div></div>
          ${i.maintenanceContractId ? `<div class="detail-field detail-field-full"><div class="detail-field-label">PMC Contract</div><div class="detail-field-value"><a href="javascript:void(0)" style="color:var(--blue);text-decoration:underline;font-size:0.857rem" onclick="Modals.close();setTimeout(()=>{Router.go('maintenance-contracts');setTimeout(()=>Views.MaintenanceContracts.openDetailModal('${i.maintenanceContractId}'),300)},80)">View Maintenance Contract</a></div></div>` : ''}
        </div>
        ${i.description ? `
        <div class="detail-field detail-field-full" style="margin-top:10px">
          <div class="detail-field-label">Issue Description</div>
          <div class="detail-field-value" style="white-space:pre-wrap;line-height:1.6">${Utils.escapeHtml(i.description)}</div>
        </div>` : ''}
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

  _openAddNoteModal(interventionId, context = 'detail') {
    if (context === 'edit') this._captureEditDraft();
    Modals.open('Add Note', `
      <div class="form-group">
        <label class="form-label">Note <span class="required">*</span></label>
        <textarea id="fNoteText" class="form-textarea" rows="4" placeholder="Enter your note…"></textarea>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._submitNote('${interventionId}','${context}')">Add Note</button>
    `);
  },

  async _submitNote(interventionId, context = 'detail') {
    const text = document.getElementById('fNoteText')?.value.trim();
    if (!text) { Toast.error('Note text is required'); return; }

    const user = appState.currentUser;

    if (context === 'edit') {
      // Queue the note — it will be saved after the status update in _submitEdit
      this._queuedNotes.push({ text, author: user?.name || 'Admin' });
      Modals.close();
      Toast.success('Note queued — will be saved with this status update');
      setTimeout(() => this._openEditModal(interventionId), 100);
      return;
    }

    await Storage.addInterventionNote(interventionId, {
      text,
      author: user?.name || 'Admin'
    });

    await Storage.updateIntervention(interventionId, {}, {
      action: 'Note Added',
      user: user?.name || 'Admin',
      details: Utils.truncate(text, 60)
    });

    Modals.close();
    Toast.success('Note added');
    setTimeout(() => this.openDetailModal(interventionId), 100);
  },

  _editDraft: null,

  _captureEditDraft() {
    const get = id => document.getElementById(id)?.value ?? null;
    this._editDraft = {
      clientId:    get('fIntClient'),
      machineId:   get('fIntMachine'),
      type:        get('fIntType'),
      priority:    get('fIntPriority'),
      location:    get('fIntLocation'),
      status:      get('fIntStatus'),
      statusNote:  get('fIntStatusNote'),
      technicianIds: Array.from(document.querySelectorAll('.fIntTechCheck:checked')).map(cb => cb.value),
      scheduledDate: get('fIntDate'),
      scheduledTime: get('fIntTime'),
    };
  },

  _restoreEditDraft() {
    if (!this._editDraft) return;
    const d = this._editDraft;
    const set = (id, val) => { if (val === null) return; const el = document.getElementById(id); if (el) el.value = val; };
    set('fIntClient', d.clientId);
    set('fIntMachine', d.machineId);
    set('fIntType', d.type);
    set('fIntPriority', d.priority);
    set('fIntLocation', d.location);
    set('fIntStatus', d.status);
    set('fIntStatusNote', d.statusNote);
    if (d.technicianIds) {
      document.querySelectorAll('.fIntTechCheck').forEach(cb => {
        cb.checked = d.technicianIds.includes(cb.value);
      });
    }
    set('fIntDate', d.scheduledDate);
    set('fIntTime', d.scheduledTime);
    this._editDraft = null;
  },

  _pendingParts: [],
  _queuedNotes: [],
  _queuedParts: [],

  _openAddPartModal(interventionId, context = 'detail') {
    if (context === 'edit') this._captureEditDraft();
    this._pendingParts = [];
    this._addPartsMode = 'registered'; // default to registered parts mode

    // Look up the linked maintenance contract to get its registered parts catalog
    const intervention = appState.interventions.find(i => i.id === interventionId);
    const contractParts = intervention?.maintenanceContractId
      ? (appState.maintenanceContracts.find(c => c.id === intervention.maintenanceContractId)?.contractParts || [])
      : [];
    this._addPartsCatalog = contractParts;

    Modals.open('Add Parts Used', this._addPartModalBody(), `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.Interventions._commitParts('${interventionId}','${context}')" id="btnCommitParts" disabled>
        Save Parts
      </button>
    `);
    setTimeout(() => document.getElementById('fPartRef')?.focus(), 50);
  },

  _addPartsMode: 'registered',
  _addPartsCatalog: [],

  _switchAddPartsMode(mode) {
    this._addPartsMode = mode;
    const bodyEl = document.getElementById('modalBody');
    if (bodyEl) bodyEl.innerHTML = this._addPartModalBody();
    setTimeout(() => {
      if (mode === 'manual') document.getElementById('fPartRef')?.focus();
    }, 30);
  },

  _selectRegisteredPart(idx) {
    const part = this._addPartsCatalog[idx];
    if (!part) return;
    document.getElementById('fPartRef').value  = part.reference  || '';
    document.getElementById('fPartDesc').value = part.description || '';
    document.getElementById('fPartUnit').value = part.unit        || 'pcs';
    Views.Interventions._syncPartQtyInput();
    document.getElementById('fPartQty')?.focus();
    document.getElementById('fPartQty')?.select();
    // Highlight selected row
    document.querySelectorAll('.reg-part-row').forEach((r, i) => {
      r.style.background = i === idx ? 'var(--primary-50,#EFF6FF)' : '';
      r.style.borderColor = i === idx ? 'var(--primary-200,#BFDBFE)' : 'var(--gray-200)';
    });
  },

  _syncPartQtyInput() {
    const unit  = document.getElementById('fPartUnit')?.value || 'pcs';
    const input = document.getElementById('fPartQty');
    if (!input) return;
    const decimal = ['litre','m'].includes(unit);
    input.min  = decimal ? '0.01' : '1';
    input.step = decimal ? '0.01' : '1';
    if (!decimal) {
      const v = parseFloat(input.value);
      if (!isNaN(v)) input.value = Math.max(1, Math.round(v));
    }
  },

  _addPartModalBody() {
    const catalog = this._addPartsCatalog || [];
    const mode    = this._addPartsMode || 'registered';
    const hasCatalog = catalog.length > 0;

    // Shared pending queue table
    const queueHTML = this._pendingParts.length === 0
      ? `<p class="add-part-empty">No parts added yet. ${hasCatalog && mode === 'registered' ? 'Select a part above, enter quantity and click <strong>Add to list</strong>.' : 'Fill in the fields and click <strong>Add to list</strong>.'}</p>`
      : `<table class="parts-table add-part-queue-table">
          <thead><tr><th>Reference</th><th>Description</th><th>Qty</th><th></th></tr></thead>
          <tbody>
            ${this._pendingParts.map((p, idx) => `
              <tr>
                <td style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
                <td>${Utils.escapeHtml(p.description)}</td>
                <td style="text-align:center;white-space:nowrap">${p.quantity} <span class="part-unit-tag">${Utils.escapeHtml(p.unit)}</span></td>
                <td style="text-align:right">
                  <button class="btn btn-ghost btn-sm btn-icon" title="Remove" onclick="Views.Interventions._removePendingPart(${idx})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    // Mode switcher tabs (only show if a catalog exists)
    const tabBar = hasCatalog ? `
      <div style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:16px">
        <button onclick="Views.Interventions._switchAddPartsMode('registered')"
          style="padding:7px 16px;border:none;background:none;cursor:pointer;font-size:0.8rem;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;
                 color:${mode==='registered'?'var(--primary)':'var(--gray-500)'};border-bottom-color:${mode==='registered'?'var(--primary)':'transparent'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="margin-right:4px;vertical-align:-2px"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Registered Parts
        </button>
        <button onclick="Views.Interventions._switchAddPartsMode('manual')"
          style="padding:7px 16px;border:none;background:none;cursor:pointer;font-size:0.8rem;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;
                 color:${mode==='manual'?'var(--primary)':'var(--gray-500)'};border-bottom-color:${mode==='manual'?'var(--primary)':'transparent'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="margin-right:4px;vertical-align:-2px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Manual Entry
        </button>
      </div>` : '';

    // Registered parts panel — scrollable catalog list + quick qty entry
    const registeredPanel = (hasCatalog && mode === 'registered') ? `
      <div style="margin-bottom:14px">
        <div style="font-size:0.75rem;color:var(--gray-500);margin-bottom:8px">Click a part to select it, then enter quantity and click <strong>Add to list</strong>.</div>
        <div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding-right:2px">
          ${catalog.map((p, i) => `
            <div class="reg-part-row" onclick="Views.Interventions._selectRegisteredPart(${i})"
              style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--gray-200);border-radius:6px;cursor:pointer;transition:background 0.1s,border-color 0.1s"
              onmouseover="if(!this.style.background||this.style.background==='')this.style.background='var(--gray-50)'"
              onmouseout="if(this.style.background==='var(--gray-50)')this.style.background=''">
              <div style="flex:1;min-width:0">
                <span style="font-family:monospace;font-size:0.8rem;font-weight:700;color:var(--text)">${Utils.escapeHtml(p.reference)}</span>
                ${p.description ? `<span style="font-size:0.8rem;color:var(--gray-500);margin-left:8px">${Utils.escapeHtml(p.description)}</span>` : ''}
              </div>
              <span style="font-size:0.75rem;color:var(--gray-400);white-space:nowrap">${p.unit || 'pcs'}</span>
            </div>`).join('')}
        </div>
        <div class="form-row" style="margin-top:12px;align-items:flex-end">
          <div class="form-group" style="flex:2">
            <label class="form-label">Part Reference <span class="required">*</span></label>
            <input type="text" id="fPartRef" class="form-input" placeholder="Select above or type" style="font-family:monospace"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Description</label>
            <input type="text" id="fPartDesc" class="form-input" placeholder="Auto-filled"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
          <div class="form-group" style="flex:0;min-width:80px">
            <label class="form-label">Unit</label>
            <select id="fPartUnit" class="form-select" onchange="Views.Interventions._syncPartQtyInput()">
              ${['pcs','litre','m'].map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:0;min-width:80px">
            <label class="form-label">Qty <span class="required">*</span></label>
            <input type="number" id="fPartQty" class="form-input" value="1" min="1" step="1" style="text-align:center"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
          <div class="form-group" style="flex:0;align-self:flex-end">
            <button class="btn btn-secondary" onclick="Views.Interventions._queuePart()" style="white-space:nowrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add to list
            </button>
          </div>
        </div>
      </div>` : '';

    // Manual entry panel (original form, kept intact for unregistered parts, units restricted to pcs/litre/m)
    const manualPanel = (!hasCatalog || mode === 'manual') ? `
      <div class="add-part-form">
        ${!hasCatalog ? '' : `<div style="padding:8px 12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;font-size:0.786rem;color:#1E40AF;margin-bottom:12px">
          Use this form to add parts not listed in the contract catalog.
        </div>`}
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Part Reference <span class="required">*</span></label>
            <input type="text" id="fPartRef" class="form-input" placeholder="e.g. HE-R230-001" style="font-family:monospace"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Unit</label>
            <select id="fPartUnit" class="form-select" onchange="Views.Interventions._syncPartQtyInput()">
              ${['pcs','litre','m'].map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Quantity <span class="required">*</span></label>
            <input type="number" id="fPartQty" class="form-input" value="1" min="1" step="1" style="text-align:center"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Description</label>
            <input type="text" id="fPartDesc" class="form-input" placeholder="e.g. Heating Element 230V"
              onkeydown="if(event.key==='Enter'){event.preventDefault();Views.Interventions._queuePart();}">
          </div>
          <div class="form-group" style="flex:0;align-self:flex-end">
            <button class="btn btn-secondary" onclick="Views.Interventions._queuePart()" style="white-space:nowrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add to list
            </button>
          </div>
        </div>
      </div>` : '';

    return `
      ${tabBar}
      ${registeredPanel}
      ${manualPanel}
      <div class="add-part-queue">
        <div class="add-part-queue-label">
          Parts to save
          ${this._pendingParts.length > 0 ? `<span class="add-part-count">${this._pendingParts.length}</span>` : ''}
        </div>
        ${queueHTML}
      </div>`;
  },

  _queuePart() {
    const ref  = (document.getElementById('fPartRef')?.value  || '').trim();
    const desc = (document.getElementById('fPartDesc')?.value || '').trim();
    const unit = document.getElementById('fPartUnit')?.value  || 'pcs';
    const decimal = ['litre','m'].includes(unit);
    const raw  = parseFloat(document.getElementById('fPartQty')?.value);
    const qty  = isNaN(raw) || raw <= 0 ? (decimal ? 0.01 : 1) : (decimal ? raw : Math.max(1, Math.round(raw)));

    if (!ref) { Toast.error('Part reference is required'); document.getElementById('fPartRef')?.focus(); return; }

    this._pendingParts.push({ reference: ref, description: desc, quantity: qty, unit });

    // Refresh modal body in-place
    const bodyEl = document.getElementById('modalBody');
    if (bodyEl) bodyEl.innerHTML = this._addPartModalBody();

    // Enable Save button now that list has items
    const saveBtn = document.getElementById('btnCommitParts');
    if (saveBtn) saveBtn.disabled = false;

    // Clear & re-focus the reference field (keep unit selection)
    document.getElementById('fPartRef').value  = '';
    document.getElementById('fPartDesc').value = '';
    document.getElementById('fPartQty').value  = '1';
    document.getElementById('fPartRef').focus();
  },

  _removePendingPart(idx) {
    this._pendingParts.splice(idx, 1);
    const bodyEl = document.getElementById('modalBody');
    if (bodyEl) bodyEl.innerHTML = this._addPartModalBody();
    const saveBtn = document.getElementById('btnCommitParts');
    if (saveBtn) saveBtn.disabled = this._pendingParts.length === 0;
  },

  async _commitParts(interventionId, context = 'detail') {
    if (this._pendingParts.length === 0) return;
    const user = appState.currentUser;

    if (context === 'edit') {
      // Queue the parts — they will be saved after the status update in _submitEdit
      this._queuedParts.push(...this._pendingParts);
      const count = this._pendingParts.length;
      this._pendingParts = [];
      Modals.close();
      Toast.success(`${count} part${count > 1 ? 's' : ''} queued — will be saved with this status update`);
      setTimeout(() => this._openEditModal(interventionId), 100);
      return;
    }

    for (const p of this._pendingParts) await Storage.addInterventionPart(interventionId, p);

    await Storage.updateIntervention(interventionId, {}, {
      action: 'Parts Added',
      user: user?.name || 'Admin',
      details: `${this._pendingParts.length} part(s) added`
    });

    const count = this._pendingParts.length;
    this._pendingParts = [];
    Modals.close();
    Toast.success(`${count} part${count > 1 ? 's' : ''} saved successfully`);
    setTimeout(() => this.openDetailModal(interventionId), 100);
  }
};
