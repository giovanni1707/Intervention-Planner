/* ============================================================
   views/client-summary.js — Per-Client Summary Page
   Accessible via Router.go('client-summary') with
   Views.ClientSummary.open(clientId)
   ============================================================ */

window.Views = window.Views || {};

Views.ClientSummary = {
  _clientId: null,
  _tab: 'overview',  // 'overview' | 'machines' | 'interventions' | 'contracts'

  open(clientId) {
    this._clientId = clientId;
    this._tab      = 'overview';
    Router.go('client-summary');
  },

  mount() {
    // If navigated directly without a clientId, go back to clients
    if (!this._clientId) { Router.go('clients'); return; }

    const client = appState.clients.find(c => c.id === this._clientId);
    if (!client) { Router.go('clients'); return; }

    const content = document.getElementById('mainContent');
    content.innerHTML = this._template(client);
    this._bindEvents();
    this._renderTab();
  },

  _template(c) {
    const machines      = appState.machines.filter(m => m.clientId === c.id);
    const interventions = appState.interventions.filter(i => i.clientId === c.id);
    const contracts     = appState.maintenanceContracts.filter(mc => mc.clientId === c.id);
    const open          = interventions.filter(i => CONFIG.OPEN_STATUSES.includes(i.status));
    const completed     = interventions.filter(i => i.status === 'completed');
    const rate          = Utils.percent(completed.length, interventions.length);

    const phones = Array.isArray(c.phones) ? c.phones.filter(Boolean) : (c.phone ? [c.phone] : []);

    return `
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="Router.go('clients')" title="Back to Clients">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 class="page-title">${Utils.escapeHtml(c.name)}</h1>
            <p class="page-subtitle">${Utils.escapeHtml(c.clientNumber || '')}${c.region ? ' · ' + Utils.escapeHtml(c.region) : ''}</p>
          </div>
        </div>
        <div class="page-actions">
          ${Auth.isAdmin() ? `
          <button class="btn btn-ghost btn-sm" onclick="Views.Interventions._openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Intervention
          </button>` : ''}
        </div>
      </div>

      <!-- KPI strip -->
      <div class="grid-4" style="margin-bottom:20px">
        <div class="kpi-card kpi-blue">
          <div class="kpi-label">Machines</div>
          <div class="kpi-value">${machines.length}</div>
          <div class="kpi-meta">registered</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-label">Open Interventions</div>
          <div class="kpi-value">${open.length}</div>
          <div class="kpi-meta">active tickets</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-label">Completion Rate</div>
          <div class="kpi-value">${rate}%</div>
          <div class="kpi-meta">${completed.length} / ${interventions.length} jobs</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-label">MC Contracts</div>
          <div class="kpi-value">${contracts.length}</div>
          <div class="kpi-meta">maintenance agreements</div>
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg></div>
        </div>
      </div>

      <!-- Contact card + tabs side by side -->
      <div class="cs-layout">

        <!-- Contact info -->
        <div class="cs-contact-col">
          <div class="card">
            <div class="card-header"><span class="card-title">Contact Information</span></div>
            <div class="card-body cs-contact-body">
              <div class="cs-contact-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>${Utils.escapeHtml(c.contactPerson || '—')}</span>
              </div>
              ${phones.length ? phones.map(p => `
              <div class="cs-contact-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/></svg>
                <span>${Utils.escapeHtml(p)}</span>
              </div>`).join('') : ''}
              ${c.email ? `
              <div class="cs-contact-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href="mailto:${Utils.escapeHtml(c.email)}">${Utils.escapeHtml(c.email)}</a>
              </div>` : ''}
              ${c.address ? `
              <div class="cs-contact-row" style="align-items:flex-start">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-top:2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${Utils.escapeHtml(c.address)}</span>
              </div>` : ''}
              ${c.contractType ? `
              <div class="cs-contact-row" style="margin-top:8px">
                ${Utils.getContractBadge(c.contractType)}
              </div>` : ''}
              <div class="cs-contact-row" style="margin-top:4px;color:var(--gray-400);font-size:0.786rem">
                Client since ${Utils.formatDate(c.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <!-- Main content with tabs -->
        <div class="cs-main-col">
          <div class="cs-tabs">
            <button class="cs-tab${this._tab === 'overview'       ? ' active' : ''}" data-tab="overview">Overview</button>
            <button class="cs-tab${this._tab === 'machines'       ? ' active' : ''}" data-tab="machines">Machines <span class="cs-tab-count">${machines.length}</span></button>
            <button class="cs-tab${this._tab === 'interventions'  ? ' active' : ''}" data-tab="interventions">Interventions <span class="cs-tab-count">${interventions.length}</span></button>
            <button class="cs-tab${this._tab === 'contracts'      ? ' active' : ''}" data-tab="contracts">MC Contracts <span class="cs-tab-count">${contracts.length}</span></button>
          </div>
          <div id="csTabContent"></div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    document.querySelectorAll('.cs-tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cs-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._tab = btn.dataset.tab;
        this._renderTab();
      });
    });
  },

  _renderTab() {
    const container = document.getElementById('csTabContent');
    if (!container) return;

    const c             = appState.clients.find(c => c.id === this._clientId);
    const machines      = appState.machines.filter(m => m.clientId === this._clientId);
    const interventions = appState.interventions.filter(i => i.clientId === this._clientId);
    const contracts     = appState.maintenanceContracts.filter(mc => mc.clientId === this._clientId);

    if (this._tab === 'overview')       container.innerHTML = this._overviewTab(c, machines, interventions, contracts);
    else if (this._tab === 'machines')  container.innerHTML = this._machinesTab(machines);
    else if (this._tab === 'interventions') container.innerHTML = this._interventionsTab(interventions);
    else if (this._tab === 'contracts') container.innerHTML = this._contractsTab(contracts);
  },

  _overviewTab(c, machines, interventions, contracts) {
    const byStatus = {};
    interventions.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });

    const statusRows = Object.entries(CONFIG.STATUSES).map(([k, v]) => {
      const count = byStatus[k] || 0;
      if (!count) return '';
      return `<div class="cs-stat-row"><span>${Utils.getStatusBadge(k)}</span><span style="font-weight:600">${count}</span></div>`;
    }).filter(Boolean).join('');

    const recent = Utils.sortBy(interventions, 'createdAt', 'desc').slice(0, 5);
    const recentRows = recent.map(i => {
      const m = appState.machines.find(m => m.id === i.machineId);
      return `<div class="cs-stat-row">
        <span style="font-size:0.857rem">${Utils.escapeHtml(m?.model || '—')} · ${Utils.getStatusBadge(i.status, i)}</span>
        <span style="font-size:0.786rem;color:var(--gray-400)">${Utils.formatDate(i.scheduledDate)}</span>
      </div>`;
    }).join('');

    return `
      <div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0">
        <div class="card-body">
          <div class="grid-2" style="gap:24px">
            <div>
              <div style="font-weight:600;margin-bottom:10px;font-size:0.857rem;color:var(--gray-500)">INTERVENTION BREAKDOWN</div>
              ${statusRows || '<p style="color:var(--gray-400);font-size:0.857rem">No interventions yet</p>'}
            </div>
            <div>
              <div style="font-weight:600;margin-bottom:10px;font-size:0.857rem;color:var(--gray-500)">RECENT INTERVENTIONS</div>
              ${recentRows || '<p style="color:var(--gray-400);font-size:0.857rem">No interventions yet</p>'}
              ${interventions.length > 5 ? `<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="Views.ClientSummary._tab='interventions';Views.ClientSummary._renderTab();document.querySelectorAll('.cs-tab').forEach(b=>{b.classList.toggle('active',b.dataset.tab==='interventions')})">View all ${interventions.length} →</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  },

  _machinesTab(machines) {
    if (machines.length === 0) return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0"><div class="table-empty"><p class="table-empty-text">No machines registered for this client</p></div></div>`;

    const rows = machines.map(m => {
      const interventionCount = appState.interventions.filter(i => i.machineId === m.id).length;
      return `<tr>
        <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m.jobNumber || '—')}</td>
        <td class="td-primary">${Utils.escapeHtml(m.model || '—')}</td>
        <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m.serialNumber || '—')}</td>
        <td>${Utils.getMachineStatusBadge(m.status)}</td>
        <td>${Utils.escapeHtml(m.district || '—')}</td>
        <td>${Utils.escapeHtml(m.location || '—')}</td>
        <td style="text-align:center"><span class="badge badge-gray">${interventionCount}</span></td>
      </tr>`;
    }).join('');

    return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0">
      <table class="data-table">
        <thead><tr><th>Job No.</th><th>Model</th><th>Serial No.</th><th>Status</th><th>District</th><th>Location</th><th style="text-align:center">Interventions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  },

  _interventionsTab(interventions) {
    if (interventions.length === 0) return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0"><div class="table-empty"><p class="table-empty-text">No interventions for this client</p></div></div>`;

    const sorted = Utils.sortBy(interventions, 'createdAt', 'desc');
    const rows = sorted.map(i => {
      const m = appState.machines.find(m => m.id === i.machineId);
      return `<tr>
        <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m?.jobNumber || '—')}</td>
        <td>${Utils.escapeHtml(m?.model || '—')}</td>
        <td>${Utils.escapeHtml(Utils.getInterventionTypeLabel(i.type))}</td>
        <td>${Utils.getPriorityBadge(i.priority)}</td>
        <td>${Utils.getStatusBadge(i.status, i)}</td>
        <td>${Utils.escapeHtml(Utils.getTechnicianNames(i))}</td>
        <td style="white-space:nowrap">${Utils.formatDate(i.scheduledDate)}</td>
        <td><button class="btn btn-ghost btn-sm btn-icon" onclick="Views.Interventions.openDetailModal('${i.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
      </tr>`;
    }).join('');

    return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0">
      <table class="data-table">
        <thead><tr><th>Job No.</th><th>Machine</th><th>Type</th><th>Priority</th><th>Status</th><th>Technician</th><th>Scheduled</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  },

  _contractsTab(contracts) {
    if (contracts.length === 0) return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0"><div class="table-empty"><p class="table-empty-text">No maintenance contracts for this client</p></div></div>`;

    const rows = contracts.map(c => {
      const m       = appState.machines.find(m => m.id === c.machineId);
      const visits  = c.visits || [];
      const total   = c.totalVisits || 0;
      const done    = visits.filter(v => v.status === 'completed').length;
      const pct     = Utils.percent(done, total);
      return `<tr>
        <td>${Utils.escapeHtml(m?.model || '—')}</td>
        <td style="font-family:monospace;font-size:0.786rem">${Utils.escapeHtml(m?.jobNumber || '—')}</td>
        <td style="text-align:center">${c.visitsPerYear}×/yr</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px;min-width:60px"><div style="width:${pct}%;background:${pct===100?'var(--green)':pct>=50?'var(--orange)':'var(--red)'};height:6px;border-radius:4px"></div></div>
            <span style="font-size:0.786rem;white-space:nowrap">${done}/${total}</span>
          </div>
        </td>
        <td style="white-space:nowrap">${Utils.formatDate(c.startDate)}</td>
        <td style="white-space:nowrap">${Utils.formatDate(c.endDate)}</td>
        <td><button class="btn btn-ghost btn-sm btn-icon" onclick="Router.go('maintenance-contracts');setTimeout(()=>Views.MaintenanceContracts.openDetailModal('${c.id}'),300)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
      </tr>`;
    }).join('');

    return `<div class="card" style="border-top:none;border-top-left-radius:0;border-top-right-radius:0">
      <table class="data-table">
        <thead><tr><th>Machine</th><th>Job No.</th><th style="text-align:center">Freq</th><th>Progress</th><th>Start</th><th>End</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }
};
