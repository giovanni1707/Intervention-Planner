/* ============================================================
   views/maintenance-contracts.js — Maintenance Contracts Management
   ============================================================ */

window.Views = window.Views || {};

Views.MaintenanceContracts = {

  _sortCol: null,
  _sortDir: 'asc',
  _manageParts_contractId: null,
  _manageParts_rows: [],
  _manageParts_pendingLog: [],

  /* ── SORT HELPERS ────────────────────────────────────────── */
  _thHTML(col, label) {
    const isActive = this._sortCol === col;
    const arrow = isActive ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : '';
    const style = `cursor:pointer;user-select:none;white-space:nowrap${isActive ? ';color:var(--blue)' : ''}`;
    return `<th style="${style}" onclick="Views.MaintenanceContracts._onSort('${col}')">${label}${arrow}</th>`;
  },

  _onSort(col) {
    if (this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    this._sortAndRender();
  },

  _sortValue(contract, col) {
    const clients    = appState.clients;
    const machines   = appState.machines;
    const client   = clients.find(c => c.id === contract.clientId);
    const machine  = machines.find(m => m.id === contract.machineId);
    const stats    = this._visitStats(contract);
    const allInterventions = appState.interventions;
    switch (col) {
      case 'job':      return (machine?.jobNumber || '').toLowerCase();
      case 'client':   return (client?.name || '').toLowerCase();
      case 'machine':  return (machine?.model || '').toLowerCase();
      case 'district': return (machine?.district || '').toLowerCase();
      case 'location': return (machine?.location || '').toLowerCase();
      case 'freq':     return contract.visitsPerYear || 0;
      case 'assigned': {
        const schedule = contract.schedule || [];
        const assigned = schedule.filter((date, idx) =>
          allInterventions.some(i =>
            i.type === 'pmc' && i.maintenanceContractId === contract.id && Utils.getTechIds(i).length > 0 &&
            (i.maintenanceVisitIndex === idx || (i.scheduledDate && i.scheduledDate.startsWith(date)))
          )
        ).length;
        return assigned;
      }
      case 'progress': return stats.total > 0 ? stats.completed / stats.total : 0;
      case 'start':    return contract.startDate || '';
      case 'end':      return contract.endDate || '';
      case 'status':   return this._contractStatus(contract.endDate);
      default:         return '';
    }
  },

  _sortAndRender() {
    const contracts = appState.maintenanceContracts;
    const clients    = appState.clients;
    const machines   = appState.machines;
    const allInterventions = appState.interventions;

    // Sort
    const sorted = [...contracts].sort((a, b) => {
      const va = this._sortValue(a, this._sortCol);
      const vb = this._sortValue(b, this._sortCol);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va) < String(vb) ? -1 : String(va) > String(vb) ? 1 : 0;
      }
      return this._sortDir === 'desc' ? -cmp : cmp;
    });

    // Re-build rows
    const isAdmin = Auth.isAdmin();
    const _assignedCount = (contract) => {
      const schedule = contract.schedule || [];
      return schedule.filter((date, idx) =>
        allInterventions.some(i =>
          i.type === 'pmc' && i.maintenanceContractId === contract.id && Utils.getTechIds(i).length > 0 &&
          (i.maintenanceVisitIndex === idx || (i.scheduledDate && i.scheduledDate.startsWith(date)))
        )
      ).length;
    };

    const tbody = document.getElementById('mcTableBody');
    if (tbody) {
      tbody.innerHTML = sorted.map(contract => {
        const client  = clients.find(c => c.id === contract.clientId);
        const machine = machines.find(m => m.id === contract.machineId);
        const stats   = this._visitStats(contract);
        const status  = this._contractStatus(contract.endDate);
        const progPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const progColor = progPct >= 80 ? '#10B981' : progPct >= 40 ? '#F59E0B' : '#3B82F6';
        const assigned = _assignedCount(contract);
        const total    = stats.total;
        const assignedStyle = assigned >= total && total > 0
          ? 'background:#D1FAE5;color:#065F46'
          : assigned > 0 ? 'background:#DBEAFE;color:#1E40AF' : 'background:var(--gray-100);color:var(--gray-500)';
        const progBucket = progPct >= 80 ? 'high' : progPct >= 40 ? 'mid' : 'low';
        const assignedBucket = assigned >= total && total > 0 ? 'full' : assigned > 0 ? 'partial' : 'none';

        return `<tr data-job="${Utils.escapeHtml((machine?.jobNumber || '').toLowerCase())}"
                    data-district="${Utils.escapeHtml((machine?.district || '').toLowerCase())}"
                    data-client="${Utils.escapeHtml((client?.id || '').toLowerCase())}"
                    data-location="${Utils.escapeHtml((machine?.location || '').toLowerCase())}"
                    data-freq="${contract.visitsPerYear || ''}"
                    data-assigned="${assignedBucket}"
                    data-total="${total}"
                    data-progress="${progBucket}">
          <td style="font-family:monospace;font-size:0.786rem;color:var(--gray-500)">${Utils.escapeHtml(machine?.jobNumber || '—')}</td>
          <td><div style="font-weight:600">${Utils.escapeHtml(client?.name || '—')}</div><div style="font-size:0.8rem;color:var(--gray-500)">${Utils.escapeHtml(client?.region || '')}</div></td>
          <td><div style="font-weight:500">${Utils.escapeHtml(machine?.model || '—')}</div><div style="font-size:0.8rem;color:var(--gray-500)">${Utils.escapeHtml(contract.serialNumber || machine?.serialNumber || '—')}</div></td>
          <td style="font-size:0.786rem;color:${machine?.district ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(machine?.district || '—')}</td>
          <td style="font-size:0.786rem;color:${machine?.location ? 'inherit' : 'var(--gray-400)'}">${Utils.escapeHtml(machine?.location || '—')}</td>
          <td style="text-align:center;font-weight:600">${contract.visitsPerYear}×/yr</td>
          <td><span style="padding:2px 10px;border-radius:12px;font-size:0.786rem;font-weight:600;${assignedStyle}">${assigned} / ${total}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px;min-width:60px"><div style="width:${progPct}%;background:${progColor};height:6px;border-radius:4px"></div></div>
              <span style="font-size:0.8rem;white-space:nowrap;color:var(--gray-600)">${stats.completed}/${stats.total}</span>
            </div>
            ${stats.overdue > 0 ? `<div style="font-size:0.75rem;color:var(--red);margin-top:2px">${stats.overdue} overdue</div>` : ''}
          </td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.startDate)}</td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.endDate)}</td>
          <td>${this._statusBadge(status)}</td>
          <td>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details" onclick="Views.MaintenanceContracts.openDetailModal('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${isAdmin ? `<button class="btn btn-ghost btn-sm btn-icon" title="Delete Contract" style="color:var(--red)" onclick="Views.MaintenanceContracts._confirmDelete('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    // Update header indicators
    const sortRow = document.getElementById('mcSortRow');
    if (sortRow) {
      sortRow.innerHTML = `
        ${this._thHTML('job',      'Job No.')}
        ${this._thHTML('client',   'Client')}
        ${this._thHTML('machine',  'Machine / Serial')}
        ${this._thHTML('district', 'District')}
        ${this._thHTML('location', 'Location')}
        ${this._thHTML('freq',     'Freq.')}
        ${this._thHTML('assigned', 'Assigned')}
        ${this._thHTML('progress', 'Progress')}
        ${this._thHTML('start',    'Start')}
        ${this._thHTML('end',      'End')}
        ${this._thHTML('status',   'Status')}
        <th style="text-align:right">Actions</th>
      `;
    }

    // Re-apply DOM filters so hidden rows stay hidden after sort
    const jobInput    = document.getElementById('mcJobFilter');
    const distSelect  = document.getElementById('mcDistrictFilter');
    const clientSel   = document.getElementById('mcClientFilter');
    const locationSel = document.getElementById('mcLocationFilter');
    const freqSel     = document.getElementById('mcFreqFilter');
    const assignedSel = document.getElementById('mcAssignedFilter');
    const progressSel = document.getElementById('mcProgressFilter');
    const jobTerm      = (jobInput?.value || '').trim().toLowerCase();
    const distTerm     = (distSelect?.value  || '').toLowerCase();
    const clientTerm   = (clientSel?.value   || '').toLowerCase();
    const locationTerm = (locationSel?.value || '').toLowerCase();
    const freqTerm     = (freqSel?.value     || '');
    const assignedTerm = (assignedSel?.value || '');
    const progressTerm = (progressSel?.value || '');
    if (jobTerm || distTerm || clientTerm || locationTerm || freqTerm || assignedTerm || progressTerm) {
      Array.from(document.querySelectorAll('#mcTableBody tr[data-job]')).forEach(row => {
        const jobMatch      = !jobTerm      || row.dataset.job.includes(jobTerm);
        const distMatch     = !distTerm     || row.dataset.district.toLowerCase().includes(distTerm);
        const clientMatch   = !clientTerm   || row.dataset.client === clientTerm;
        const locationMatch = !locationTerm || row.dataset.location === locationTerm;
        const freqMatch     = !freqTerm     || row.dataset.freq === freqTerm;
        const assignedMatch = !assignedTerm || row.dataset.assigned === assignedTerm;
        const progressMatch = !progressTerm || row.dataset.progress === progressTerm;
        row.style.display = (jobMatch && distMatch && clientMatch && locationMatch && freqMatch && assignedMatch && progressMatch) ? '' : 'none';
      });
    }
  },

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
    let current = new Date(startDate);
    while (dates.length < visitsPerYear) {
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
    this._sortCol = null;
    this._sortDir = 'asc';
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
    this._checkNotifications();
  },

  /* ── TEMPLATE ────────────────────────────────────────────── */
  _template() {
    const contracts  = appState.maintenanceContracts;
    const clients    = appState.clients;
    const machines   = appState.machines;

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

    /* Assigned visits per contract — count interventions with a technicianId */
    const allInterventions = appState.interventions;
    const _assignedCount = (contract) => {
      const schedule = contract.schedule || [];
      return schedule.filter((date, idx) =>
        allInterventions.some(i =>
          i.type === 'pmc' &&
          i.maintenanceContractId === contract.id &&
          Utils.getTechIds(i).length > 0 &&
          (i.maintenanceVisitIndex === idx || (i.scheduledDate && i.scheduledDate.startsWith(date)))
        )
      ).length;
    };

    /* Build row HTML for a given contract list */
    const _buildRow = (contract) => {
      const client  = clients.find(c => c.id === contract.clientId);
      const machine = machines.find(m => m.id === contract.machineId);
      const stats   = this._visitStats(contract);
      const status  = this._contractStatus(contract.endDate);
      const progPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const progColor = progPct >= 80 ? '#10B981' : progPct >= 40 ? '#F59E0B' : '#3B82F6';

      const assigned = _assignedCount(contract);
      const total    = stats.total;
      const assignedStyle = assigned >= total && total > 0
        ? 'background:#D1FAE5;color:#065F46'
        : assigned > 0
          ? 'background:#DBEAFE;color:#1E40AF'
          : 'background:var(--gray-100);color:var(--gray-500)';

      const progBucket = progPct >= 80 ? 'high' : progPct >= 40 ? 'mid' : 'low';
      const assignedBucket = assigned >= total && total > 0 ? 'full' : assigned > 0 ? 'partial' : 'none';

      return `
        <tr data-job="${Utils.escapeHtml((machine?.jobNumber || '').toLowerCase())}"
            data-district="${Utils.escapeHtml((machine?.district || '').toLowerCase())}"
            data-client="${Utils.escapeHtml((client?.id || '').toLowerCase())}"
            data-location="${Utils.escapeHtml((machine?.location || '').toLowerCase())}"
            data-freq="${contract.visitsPerYear || ''}"
            data-assigned="${assignedBucket}"
            data-total="${total}"
            data-progress="${progBucket}">
          <td style="font-family:monospace;font-size:0.786rem;color:var(--gray-500)">${Utils.escapeHtml(machine?.jobNumber || '—')}</td>
          <td>
            <div style="font-weight:600">${Utils.escapeHtml(client ? client.name : '—')}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${client ? Utils.escapeHtml(client.region || '') : ''}</div>
          </td>
          <td>
            <div style="font-weight:500">${Utils.escapeHtml(machine ? machine.model : '—')}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${Utils.escapeHtml(contract.serialNumber || (machine ? machine.serialNumber : '—'))}</div>
          </td>
          <td style="font-size:0.786rem;color:${machine?.district ? 'inherit' : 'var(--gray-400)'}">
            ${Utils.escapeHtml(machine?.district || '—')}
          </td>
          <td style="font-size:0.786rem;color:${machine?.location ? 'inherit' : 'var(--gray-400)'}">
            ${Utils.escapeHtml(machine?.location || '—')}
          </td>
          <td style="text-align:center;font-weight:600">${contract.visitsPerYear}×/yr</td>
          <td>
            <span style="padding:2px 10px;border-radius:12px;font-size:0.786rem;font-weight:600;${assignedStyle}">${assigned} / ${total}</span>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px;min-width:60px">
                <div style="width:${progPct}%;background:${progColor};height:6px;border-radius:4px"></div>
              </div>
              <span style="font-size:0.8rem;white-space:nowrap;color:var(--gray-600)">${stats.completed}/${stats.total}</span>
            </div>
            ${stats.overdue > 0 ? `<div style="font-size:0.75rem;color:var(--red);margin-top:2px">${stats.overdue} overdue</div>` : ''}
          </td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.startDate)}</td>
          <td style="font-size:0.857rem">${Utils.formatDate(contract.endDate)}</td>
          <td>${this._statusBadge(status)}</td>
          <td>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm btn-icon" title="View Details"
                      onclick="Views.MaintenanceContracts.openDetailModal('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${isAdmin ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete Contract" style="color:var(--red)"
                      onclick="Views.MaintenanceContracts._confirmDelete('${contract.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    };

    const rows = contracts.length === 0 ? `
      <tr><td colspan="12">
        <div class="table-empty">
          <p class="table-empty-text">No maintenance contracts found</p>
          ${isAdmin ? `<p style="font-size:0.8rem;color:var(--gray-400);margin-top:4px">Click "Add Contract" to register the first one.</p>` : ''}
        </div>
      </td></tr>
    ` : contracts.map(_buildRow).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Maintenance Contracts</h1>
          <p class="page-subtitle">Manage and track yearly equipment maintenance agreements</p>
        </div>
        <div></div>
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
        <!-- Filters bar -->
        <div style="padding:10px 16px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;flex-wrap:wrap;gap:8px">
          <div style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"
                 style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--gray-400);pointer-events:none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input id="mcJobFilter" type="text" placeholder="Job Number…"
                   style="padding:5px 10px 5px 28px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);width:140px">
          </div>
          <select id="mcClientFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Clients</option>
            ${[...new Map(contracts.filter(c => clients.find(cl => cl.id === c.clientId)).map(c => {
              const cl = clients.find(cl => cl.id === c.clientId);
              return [cl.id, cl];
            })).values()].sort((a,b) => a.name.localeCompare(b.name)).map(cl => `<option value="${Utils.escapeHtml(cl.id.toLowerCase())}">${Utils.escapeHtml(cl.name)}</option>`).join('')}
          </select>
          <select id="mcDistrictFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Districts</option>
            ${CONFIG.DISTRICTS.map(d => `<option value="${d.toLowerCase()}">${d}</option>`).join('')}
          </select>
          <select id="mcLocationFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Locations</option>
            ${[...new Set(contracts.map(c => machines.find(m => m.id === c.machineId)?.location).filter(Boolean))].sort().map(l => `<option value="${Utils.escapeHtml(l.toLowerCase())}">${Utils.escapeHtml(l)}</option>`).join('')}
          </select>
          <select id="mcFreqFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Frequencies</option>
            <option value="1">1×/yr</option>
            <option value="2">2×/yr</option>
            <option value="3">3×/yr</option>
            <option value="4">4×/yr</option>
          </select>
          <select id="mcAssignedFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Assigned</option>
            <option value="full">Fully Assigned</option>
            <option value="partial">Partially Assigned</option>
            <option value="none">Not Assigned</option>
          </select>
          <select id="mcProgressFilter" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
            <option value="">All Progress</option>
            <option value="high">High (≥80%)</option>
            <option value="mid">Mid (40–79%)</option>
            <option value="low">Low (&lt;40%)</option>
          </select>
          <button id="mcFilterClear" class="btn btn-ghost btn-sm" style="display:none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table" id="mcTable">
              <thead>
                <tr id="mcSortRow">
                  ${this._thHTML('job',      'Job No.')}
                  ${this._thHTML('client',   'Client')}
                  ${this._thHTML('machine',  'Machine / Serial')}
                  ${this._thHTML('district', 'District')}
                  ${this._thHTML('location', 'Location')}
                  ${this._thHTML('freq',     'Freq.')}
                  ${this._thHTML('assigned', 'Assigned')}
                  ${this._thHTML('progress', 'Progress')}
                  ${this._thHTML('start',    'Start')}
                  ${this._thHTML('end',      'End')}
                  ${this._thHTML('status',   'Status')}
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody id="mcTableBody">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ── BIND EVENTS ─────────────────────────────────────────── */
  _bindEvents() {
    const jobInput    = document.getElementById('mcJobFilter');
    const distSelect  = document.getElementById('mcDistrictFilter');
    const clientSel   = document.getElementById('mcClientFilter');
    const locationSel = document.getElementById('mcLocationFilter');
    const freqSel     = document.getElementById('mcFreqFilter');
    const assignedSel = document.getElementById('mcAssignedFilter');
    const progressSel = document.getElementById('mcProgressFilter');
    const clearBtn    = document.getElementById('mcFilterClear');
    const tbody       = document.getElementById('mcTableBody');
    if (!tbody) return;

    const applyFilters = () => {
      const jobTerm      = (jobInput?.value    || '').trim().toLowerCase();
      const distTerm     = (distSelect?.value  || '').toLowerCase();
      const clientTerm   = (clientSel?.value   || '').toLowerCase();
      const locationTerm = (locationSel?.value || '').toLowerCase();
      const freqTerm     = (freqSel?.value     || '');
      const assignedTerm = (assignedSel?.value || '');
      const progressTerm = (progressSel?.value || '');
      const active = jobTerm || distTerm || clientTerm || locationTerm || freqTerm || assignedTerm || progressTerm;
      if (clearBtn) clearBtn.style.display = active ? '' : 'none';
      Array.from(tbody.querySelectorAll('tr[data-job]')).forEach(row => {
        const jobMatch      = !jobTerm      || row.dataset.job.includes(jobTerm);
        const distMatch     = !distTerm     || row.dataset.district.toLowerCase().includes(distTerm);
        const clientMatch   = !clientTerm   || row.dataset.client === clientTerm;
        const locationMatch = !locationTerm || row.dataset.location === locationTerm;
        const freqMatch     = !freqTerm     || row.dataset.freq === freqTerm;
        const assignedMatch = !assignedTerm || row.dataset.assigned === assignedTerm;
        const progressMatch = !progressTerm || row.dataset.progress === progressTerm;
        row.style.display = (jobMatch && distMatch && clientMatch && locationMatch && freqMatch && assignedMatch && progressMatch) ? '' : 'none';
      });
    };

    if (jobInput)    jobInput.addEventListener('input', applyFilters);
    if (distSelect)  distSelect.addEventListener('change', applyFilters);
    if (clientSel)   clientSel.addEventListener('change', applyFilters);
    if (locationSel) locationSel.addEventListener('change', applyFilters);
    if (freqSel)     freqSel.addEventListener('change', applyFilters);
    if (assignedSel) assignedSel.addEventListener('change', applyFilters);
    if (progressSel) progressSel.addEventListener('change', applyFilters);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (jobInput)    jobInput.value = '';
        if (distSelect)  distSelect.value = '';
        if (clientSel)   clientSel.value = '';
        if (locationSel) locationSel.value = '';
        if (freqSel)     freqSel.value = '';
        if (assignedSel) assignedSel.value = '';
        if (progressSel) progressSel.value = '';
        applyFilters();
      });
    }
  },

  /* ── NOTIFICATIONS ───────────────────────────────────────── */
  _checkNotifications() {
    if (!Auth.isAdmin()) return;
    const contracts = appState.maintenanceContracts;
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    contracts.forEach(contract => {
      const clients    = appState.clients;
      const machines   = appState.machines;
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

      // Upcoming maintenance notifications (7 & 1 day before) + auto-create intervention
      const nextV = this._nextVisit(contract);
      if (nextV) {
        const visitDiff = Math.ceil((new Date(nextV) - today) / 86400000);
        if (visitDiff >= 0 && visitDiff <= 7) {
          // Auto-create PMC intervention if one doesn't already exist for this machine+date
          this._ensurePmcIntervention(contract, nextV, client, machine);

          if (visitDiff === 1 && !notified.visit1) {
            Toast.warning(`Maintenance due tomorrow: ${label}`);
            notified.visit1 = true;
            sessionStorage.setItem(notifKey, JSON.stringify(notified));
          } else if (visitDiff > 1 && visitDiff <= 7 && !notified.visit7) {
            Toast.warning(`Maintenance due in ${visitDiff} days: ${label}`);
            notified.visit7 = true;
            sessionStorage.setItem(notifKey, JSON.stringify(notified));
          } else if (visitDiff === 0 && !notified.visit0) {
            Toast.warning(`Maintenance due today: ${label}`);
            notified.visit0 = true;
            sessionStorage.setItem(notifKey, JSON.stringify(notified));
          }
        }
      }
    });
  },

  // Auto-creates one PMC intervention per scheduled visit if none exists yet.
  // Each intervention is tagged with maintenanceVisitIndex so technicians are
  // assigned independently per visit rather than shared across the contract.
  async _ensurePmcIntervention(contract, scheduledDate, client, machine) {
    const interventions  = appState.interventions;
    const schedule      = contract.schedule || [];
    const visitIndex    = schedule.indexOf(scheduledDate);
    const ordinals      = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    const visitLabel    = visitIndex >= 0 ? (ordinals[visitIndex] || `${visitIndex + 1}th`) : '';

    // Check if a PMC intervention already exists for this contract+visitIndex
    const alreadyExists = interventions.some(i =>
      i.type === 'pmc' &&
      i.maintenanceContractId === contract.id &&
      i.maintenanceVisitIndex === visitIndex &&
      !['cancelled'].includes(i.status)
    );
    if (alreadyExists) return;

    await Storage.createIntervention({
      clientId:              contract.clientId,
      machineId:             contract.machineId,
      type:                  'pmc',
      priority:              'medium',
      status:                'new',
      scheduledDate,
      description:           `${visitLabel} Scheduled PMC visit — ${contract.visitsPerYear}×/yr contract` +
                             (machine ? ` for ${machine.model}` : '') +
                             (client  ? ` (${client.name})`    : ''),
      technicianId:          null,
      location:              'client',
      maintenanceContractId: contract.id,
      maintenanceVisitIndex: visitIndex,
      createdBy:             'System (Auto-scheduled)'
    });
  },

  /* ── CREATE MODAL ────────────────────────────────────────── */
  openCreateModal() {
    const clients    = appState.clients;
    const machines   = appState.machines;

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
    const machines = appState.machines.filter(m => m.clientId === clientId);
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
      const m = appState.machines.find(m => m.id === machSel.value);
      const s = document.getElementById('mcSerial') || document.getElementById('ecSerial');
      if (m && s) s.value = m.serialNumber || '';
    });
  },

  async _submitCreate() {
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

    await Storage.createMaintenanceContract({
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
  async openEditModal(contractId) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;

    const clients    = appState.clients;
    const machines   = appState.machines.filter(m => m.clientId === contract.clientId);

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

  async _submitEdit(contractId) {
    const contract    = appState.maintenanceContracts.find(c => c.id === contractId);
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

    await Storage.updateMaintenanceContract(contractId, {
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
  async _confirmDelete(contractId) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;
    const clients    = appState.clients;
    const machines   = appState.machines;
    const client   = clients.find(c => c.id === contract.clientId);
    const machine  = machines.find(m => m.id === contract.machineId);
    const shortId  = contractId.slice(-8).toUpperCase();

    Modals.open('Confirm Contract Deletion', `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.857rem;color:#991B1B">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>This action is <strong>permanent and irreversible</strong>. The maintenance contract and all its schedule data will be permanently removed.</span>
      </div>
      <div style="padding:8px 12px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.8rem">
        <strong>Contract:</strong> ${Utils.escapeHtml(client ? client.name : '—')} — ${Utils.escapeHtml(machine ? machine.model : '—')}<br>
        <strong>Contract ID:</strong> <span style="font-family:monospace">${shortId}</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contract ID <span class="required">*</span></label>
          <input type="text" id="dcContractId" class="form-input" placeholder="${shortId}">
        </div>
        <div class="form-group">
          <label class="form-label">Your Email <span class="required">*</span></label>
          <input type="email" id="dcEmail" class="form-input" placeholder="admin@example.com">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Your Password <span class="required">*</span></label>
          <input type="password" id="dcPassword" class="form-input" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Type <strong>delete</strong> to confirm <span class="required">*</span></label>
          <input type="text" id="dcConfirmWord" class="form-input" placeholder="delete">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Deletion <span class="required">*</span></label>
        <textarea id="dcReason" class="form-textarea" rows="3" placeholder="Explain why this contract is being deleted…"></textarea>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-danger" onclick="Views.MaintenanceContracts._submitDelete('${contractId}','${shortId}')">Delete Contract</button>
    `);
  },

  async _submitDelete(contractId, expectedShortId) {
    const contractIdInput = document.getElementById('dcContractId')?.value.trim().toUpperCase();
    const email           = document.getElementById('dcEmail')?.value.trim();
    const password        = document.getElementById('dcPassword')?.value;
    const confirmWord     = document.getElementById('dcConfirmWord')?.value.trim().toLowerCase();
    const reason          = document.getElementById('dcReason')?.value.trim();

    if (!contractIdInput || !email || !password || !confirmWord || !reason) {
      Toast.error('All fields are required.'); return;
    }
    if (contractIdInput !== expectedShortId) {
      Toast.error('Contract ID does not match.'); return;
    }
    if (confirmWord !== 'delete') {
      Toast.error('You must type "delete" exactly to confirm.'); return;
    }

    const users      = appState.users;
    const admin = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      (u.role === 'admin' || u.role === 'superadmin')
    );
    if (!admin) {
      Toast.error('Admin email or password is incorrect.'); return;
    }

    await Storage.logAction({
      action:   'Delete Maintenance Contract',
      user:     admin.name,
      role:     admin.role,
      targetId: contractId,
      reason
    });

    await Storage.deleteMaintenanceContract(contractId);
    Modals.close();
    Toast.success('Maintenance contract permanently deleted.');
    this.mount();
  },

  /* ── DETAIL MODAL ────────────────────────────────────────── */
  async openDetailModal(contractId, activeTab) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;

    const clients    = appState.clients;
    const machines   = appState.machines;
    const client   = clients.find(c => c.id === contract.clientId);
    const machine  = machines.find(m => m.id === contract.machineId);
    const stats    = this._visitStats(contract);
    const status   = this._contractStatus(contract.endDate);
    const isAdmin  = Auth.isAdmin();
    const progPct  = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const progColor = progPct >= 80 ? '#10B981' : progPct >= 40 ? '#F59E0B' : '#3B82F6';

    // Schedule table — look up linked interventions per visit index
    const allInterventions = appState.interventions;
    const ordinals         = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    const scheduleRows = (contract.schedule || []).map((date, idx) => {
      const isCompleted = (contract.completedVisits || []).includes(date);
      const isPast      = new Date(date) < new Date();
      const isOverdue   = isPast && !isCompleted;
      const rowClass    = isCompleted ? 'mc-visit-row-completed' : isOverdue ? 'mc-visit-row-overdue' : '';
      const visitLabel  = ordinals[idx] || `${idx + 1}th`;
      const linkedIntervention = allInterventions.find(i =>
        i.type === 'pmc' &&
        i.maintenanceContractId === contract.id &&
        i.maintenanceVisitIndex === idx &&
        !['cancelled'].includes(i.status)
      ) || allInterventions.find(i =>
        i.type === 'pmc' &&
        i.machineId === contract.machineId &&
        i.scheduledDate === date &&
        !['cancelled'].includes(i.status)
      );
      const techName = linkedIntervention ? Utils.getTechnicianNames(linkedIntervention) : '—';

      // Parts consumed in this visit
      const visitParts = linkedIntervention ? (linkedIntervention.parts || []) : [];
      const partsCell = visitParts.length > 0
        ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:999px;padding:1px 8px;font-size:0.75rem;font-weight:600;cursor:pointer"
                onclick="Views.MaintenanceContracts._showVisitPartsDetail('${contractId}',${idx})"
                title="View parts used">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v4h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
             ${visitParts.length} part${visitParts.length !== 1 ? 's' : ''}
           </span>`
        : `<span style="color:var(--gray-300);font-size:0.75rem">—</span>`;

      let actionCell = '';
      if (!isCompleted) {
        if (!linkedIntervention && isAdmin) {
          actionCell = `<button class="btn btn-ghost btn-sm" style="color:var(--blue);font-size:0.8rem"
            onclick="Views.MaintenanceContracts._openPlanVisitModal('${contractId}',${idx})">Plan Visit</button>`;
        } else if (linkedIntervention && isAdmin && Utils.getTechIds(linkedIntervention).length === 0) {
          actionCell = `<button class="btn btn-ghost btn-sm" style="color:var(--blue);font-size:0.8rem"
            onclick="Views.MaintenanceContracts._openPlanVisitModal('${contractId}',${idx})">Assign Technician</button>`;
        }
      }

      return `
        <tr class="${rowClass}">
          <td style="font-weight:500">${visitLabel} Visit</td>
          <td>${Utils.formatDate(date)}</td>
          <td>
            ${isCompleted
              ? `<span class="mc-visit-status-completed">&#10003; Completed</span>`
              : isOverdue
              ? `<span style="color:var(--red);font-size:0.857rem">Overdue</span>`
              : `<span style="color:var(--gray-500);font-size:0.857rem">Scheduled</span>`
            }
          </td>
          <td style="font-size:0.857rem;color:${techName === '—' ? 'var(--gray-400)' : 'var(--gray-700)'}">
            ${Utils.escapeHtml(techName)}
          </td>
          <td>${partsCell}</td>
          <td>
            ${linkedIntervention ? `
              <a href="javascript:void(0)" style="color:var(--blue);font-size:0.8rem;text-decoration:underline"
                 onclick="Modals.close();setTimeout(()=>Views.Interventions.openDetailModal('${linkedIntervention.id}'),80)">
                View Intervention
              </a>` : ''}
          </td>
          <td>${actionCell}</td>
        </tr>
      `;
    }).join('');

    const intervalMonths = this._intervalMonths(contract.visitsPerYear);
    const intervalLabel  = `Every ${intervalMonths} month${intervalMonths > 1 ? 's' : ''}`;
    const nextV          = this._nextVisit(contract);
    const creatorUser    = appState.users.find(u => u.name === contract.createdBy);
    const creatorRole    = creatorUser ? (CONFIG.ROLES?.[creatorUser.role] || creatorUser.role) : null;

    // Build spare parts tab content
    const sparePartsContent = this._buildSparePartsTabContent(contract, contractId, isAdmin);

    // Spare parts alert badge for tab
    const { alerts } = this._computePartsConsumption(contract);
    const partsAlertBadge = alerts > 0
      ? `<span style="margin-left:6px;background:#FEE2E2;color:#991B1B;border-radius:999px;padding:1px 7px;font-size:0.72rem;font-weight:700">${alerts}</span>`
      : '';

    const tab = activeTab || 'overview';

    const body = `
      <!-- Tab Bar -->
      <div id="contractDetailTabs" style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:20px">
        <button onclick="Views.MaintenanceContracts._switchDetailTab('${contractId}','overview')"
          id="cdTab_overview"
          style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:0.857rem;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;color:${tab==='overview'?'var(--primary)':'var(--gray-500)'}; border-bottom-color:${tab==='overview'?'var(--primary)':'transparent'}">
          Overview
        </button>
        <button onclick="Views.MaintenanceContracts._switchDetailTab('${contractId}','schedule')"
          id="cdTab_schedule"
          style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:0.857rem;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;color:${tab==='schedule'?'var(--primary)':'var(--gray-500)'}; border-bottom-color:${tab==='schedule'?'var(--primary)':'transparent'}">
          Visit Schedule
        </button>
        <button onclick="Views.MaintenanceContracts._switchDetailTab('${contractId}','parts')"
          id="cdTab_parts"
          style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:0.857rem;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;color:${tab==='parts'?'var(--primary)':'var(--gray-500)'}; border-bottom-color:${tab==='parts'?'var(--primary)':'transparent'}">
          Spare Parts${partsAlertBadge}
        </button>
      </div>

      <!-- Overview Tab -->
      <div id="cdPanel_overview" style="display:${tab==='overview'?'block':'none'}">
        <div class="detail-section">
          <div class="detail-section-label">Contract Details</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-field-label">Client</div>
              <div class="detail-field-value">${Utils.escapeHtml(client ? client.name : '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Region</div>
              <div class="detail-field-value" style="${!client?.region ? 'color:var(--gray-400)' : ''}">${Utils.escapeHtml(client?.region || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Machine</div>
              <div class="detail-field-value">${Utils.escapeHtml(machine ? machine.model : '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Machine Type</div>
              <div class="detail-field-value" style="${!machine?.type ? 'color:var(--gray-400)' : ''}">${Utils.escapeHtml(machine?.type || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Job Number</div>
              <div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(machine?.jobNumber || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Serial Number</div>
              <div class="detail-field-value" style="font-family:monospace">${Utils.escapeHtml(contract.serialNumber || machine?.serialNumber || '—')}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Status</div>
              <div class="detail-field-value">${this._statusBadge(status)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Start Date</div>
              <div class="detail-field-value">${Utils.formatDate(contract.startDate)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">End Date</div>
              <div class="detail-field-value">${Utils.formatDate(contract.endDate)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Maintenances / Year</div>
              <div class="detail-field-value">${contract.visitsPerYear}×/yr</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Maintenance Interval</div>
              <div class="detail-field-value">${intervalLabel}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Created By</div>
              <div class="detail-field-value">${contract.createdBy
                ? `${Utils.escapeHtml(contract.createdBy)}${creatorRole ? `<span class="creator-role-tag">${Utils.escapeHtml(creatorRole)}</span>` : ''}`
                : '<span style="color:var(--gray-400)">—</span>'}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Created</div>
              <div class="detail-field-value">${Utils.formatDateTime(contract.createdAt)}</div>
            </div>
          </div>
          ${contract.notes ? `
          <div class="detail-field detail-field-full" style="margin-top:10px">
            <div class="detail-field-label">Notes / Special Conditions</div>
            <div class="detail-field-value" style="white-space:pre-wrap;line-height:1.6">${Utils.escapeHtml(contract.notes)}</div>
          </div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-label">Maintenance Tracking</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-field-label">Total Planned</div>
              <div class="detail-field-value" style="font-weight:700;font-size:1.1rem">${stats.total}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Completed</div>
              <div class="detail-field-value" style="font-weight:700;font-size:1.1rem;color:#059669">${stats.completed}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Remaining</div>
              <div class="detail-field-value" style="font-weight:700;font-size:1.1rem">${stats.remaining}</div>
            </div>
            <div class="detail-field">
              <div class="detail-field-label">Overdue</div>
              <div class="detail-field-value" style="font-weight:700;font-size:1.1rem;${stats.overdue > 0 ? 'color:var(--red)' : 'color:var(--gray-400)'}">${stats.overdue || '—'}</div>
            </div>
            <div class="detail-field detail-field-full">
              <div class="detail-field-label">Next Scheduled Visit</div>
              <div class="detail-field-value" style="${!nextV ? 'color:var(--gray-400)' : 'font-weight:600'}">${nextV ? Utils.formatDate(nextV) : '—'}</div>
            </div>
          </div>
          <div style="margin-top:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:0.8rem;font-weight:600;color:var(--gray-600)">Completion Progress</span>
              <span style="font-size:0.8rem;color:var(--gray-500)">${stats.completed} / ${stats.total} (${progPct}%)</span>
            </div>
            <div style="background:var(--gray-200);border-radius:6px;height:8px">
              <div style="width:${progPct}%;background:${progColor};height:8px;border-radius:6px;transition:width 0.3s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visit Schedule Tab -->
      <div id="cdPanel_schedule" style="display:${tab==='schedule'?'block':'none'}">
        <div class="detail-section">
          <div class="detail-section-label">Maintenance Schedule</div>
          <div class="table-wrapper" style="max-height:360px;overflow-y:auto">
            <table class="data-table" id="scheduleTable_${contractId}">
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Parts Used</th>
                  <th>Intervention</th>
                  ${isAdmin ? '<th>Action</th>' : ''}
                </tr>
              </thead>
              <tbody>${scheduleRows || `<tr><td colspan="${isAdmin ? 7 : 6}" style="text-align:center;color:var(--gray-400)">No schedule generated</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Spare Parts Tab -->
      <div id="cdPanel_parts" style="display:${tab==='parts'?'block':'none'}">
        ${sparePartsContent}
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="Modals.close()">Close</button>
    `;

    Modals.open(`Contract — ${client ? Utils.escapeHtml(client.name) : ''}`, body, footer, { size: 'lg' });
  },

  _switchDetailTab(contractId, tab) {
    ['overview','schedule','parts'].forEach(t => {
      const panel = document.getElementById(`cdPanel_${t}`);
      const btn   = document.getElementById(`cdTab_${t}`);
      if (!panel || !btn) return;
      const active = t === tab;
      panel.style.display = active ? 'block' : 'none';
      btn.style.color = active ? 'var(--primary)' : 'var(--gray-500)';
      btn.style.borderBottomColor = active ? 'var(--primary)' : 'transparent';
    });
  },

  /* ── SPARE PARTS — CONSUMPTION CALCULATION ───────────────── */
  _computePartsConsumption(contract) {
    const contractParts   = contract.contractParts || [];
    const allInterventions = appState.interventions;
    const schedule        = contract.schedule || [];

    // Collect all parts consumed across all linked PMC interventions
    const consumedMap = {}; // reference → total qty consumed
    const consumedByVisit = {}; // visitIndex → [{reference, description, qty}]

    schedule.forEach((date, idx) => {
      const linked = allInterventions.find(i =>
        i.type === 'pmc' &&
        i.maintenanceContractId === contract.id &&
        i.maintenanceVisitIndex === idx &&
        !['cancelled'].includes(i.status)
      ) || allInterventions.find(i =>
        i.type === 'pmc' &&
        i.machineId === contract.machineId &&
        i.scheduledDate === date &&
        !['cancelled'].includes(i.status)
      );

      const parts = linked ? (linked.parts || []) : [];
      consumedByVisit[idx] = parts;
      parts.forEach(p => {
        const ref = (p.reference || '').trim().toUpperCase();
        consumedMap[ref] = (consumedMap[ref] || 0) + (Number(p.quantity) || 1);
      });
    });

    // Build enriched parts list
    let alerts = 0;
    const parts = contractParts.map(p => {
      const ref       = (p.reference || '').trim().toUpperCase();
      const allocated = Number(p.quantity) || 0;
      const consumed  = consumedMap[ref] || 0;
      const remaining = Math.max(0, allocated - consumed);
      const pct       = allocated > 0 ? Math.round((consumed / allocated) * 100) : 0;
      let stockStatus, stockClass;
      if (allocated === 0) {
        stockStatus = 'N/A';       stockClass = 'mc-stock-na';
      } else if (remaining === 0) {
        stockStatus = 'Depleted';  stockClass = 'mc-stock-depleted'; alerts++;
      } else if (pct >= 75) {
        stockStatus = 'Low Stock'; stockClass = 'mc-stock-low'; alerts++;
      } else {
        stockStatus = 'OK';        stockClass = 'mc-stock-ok';
      }
      return { ...p, ref, allocated, consumed, remaining, pct, stockStatus, stockClass };
    });

    // Also find parts consumed in visits that are NOT in the catalog
    const uncataloged = [];
    Object.values(consumedByVisit).flat().forEach(p => {
      const ref = (p.reference || '').trim().toUpperCase();
      const inCatalog = contractParts.some(cp => (cp.reference || '').trim().toUpperCase() === ref);
      if (!inCatalog && ref) {
        const existing = uncataloged.find(u => u.ref === ref);
        if (existing) { existing.consumed += (Number(p.quantity) || 1); }
        else uncataloged.push({ ref, description: p.description || '', consumed: Number(p.quantity) || 1 });
      }
    });

    return { parts, uncataloged, consumedByVisit, alerts };
  },

  _buildSparePartsTabContent(contract, contractId, isAdmin) {
    const { parts, uncataloged } = this._computePartsConsumption(contract);
    const totalAllocated  = parts.reduce((s, p) => s + p.allocated, 0);
    const totalConsumed   = parts.reduce((s, p) => s + p.consumed, 0);
    const depleted        = parts.filter(p => p.stockStatus === 'Depleted').length;
    const lowStock        = parts.filter(p => p.stockStatus === 'Low Stock').length;

    // KPI strip
    const kpiStrip = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:14px 16px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${parts.length}</div>
          <div style="font-size:0.75rem;color:var(--gray-500);margin-top:2px">Part Types</div>
        </div>
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:14px 16px;text-align:center">
          <div style="font-size:1.4rem;font-weight:700;color:#1D4ED8">${totalConsumed}<span style="font-size:0.9rem;color:var(--gray-400);font-weight:400"> / ${totalAllocated}</span></div>
          <div style="font-size:0.75rem;color:var(--gray-500);margin-top:2px">Units Consumed</div>
        </div>
        <div class="mc-parts-kpi ${lowStock > 0 ? 'mc-parts-kpi-warn' : ''}">
          <div class="mc-parts-kpi-value" style="color:${lowStock > 0 ? '' : 'var(--gray-400)'}">${lowStock}</div>
          <div class="mc-parts-kpi-label">Low Stock</div>
        </div>
        <div class="mc-parts-kpi ${depleted > 0 ? 'mc-parts-kpi-danger' : ''}">
          <div class="mc-parts-kpi-value" style="color:${depleted > 0 ? '' : 'var(--gray-400)'}">${depleted}</div>
          <div class="mc-parts-kpi-label">Depleted</div>
        </div>
      </div>`;

    // Parts catalog table
    let catalogRows = '';
    if (parts.length === 0) {
      catalogRows = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-400)">
        <div style="font-size:0.857rem">No spare parts allocated to this contract yet.</div>
        ${isAdmin ? `<div style="margin-top:8px"><button class="btn btn-primary btn-sm" onclick="Views.MaintenanceContracts._openManagePartsModal('${contractId}')">Add Parts</button></div>` : ''}
      </td></tr>`;
    } else {
      catalogRows = parts.map((p, i) => {
        const barColor = p.stockStatus === 'Depleted' ? '#EF4444' : p.stockStatus === 'Low Stock' ? '#F59E0B' : '#10B981';
        return `<tr>
          <td style="font-family:monospace;font-size:0.8rem;font-weight:600;color:var(--gray-600)">${Utils.escapeHtml(p.reference || '—')}</td>
          <td style="font-size:0.857rem">${Utils.escapeHtml(p.description || '—')}</td>
          <td style="text-align:center;font-size:0.857rem;color:var(--gray-600)">${Utils.escapeHtml(p.unit || 'pcs')}</td>
          <td style="text-align:center;font-weight:600">${p.allocated}</td>
          <td style="text-align:center;color:#1D4ED8;font-weight:600">${p.consumed}</td>
          <td style="text-align:center;font-weight:700;color:${p.remaining === 0 ? '#991B1B' : 'var(--text)'}">${p.remaining}</td>
          <td style="min-width:160px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px">
                <div style="width:${Math.min(p.pct,100)}%;background:${barColor};height:6px;border-radius:4px;transition:width 0.3s"></div>
              </div>
              <span style="min-width:64px;text-align:right">
                <span class="mc-stock-badge ${p.stockClass}">${p.stockStatus}</span>
              </span>
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    // Uncataloged parts alert
    const uncatalogedSection = uncataloged.length > 0 ? `
      <div style="margin-top:16px;padding:12px 16px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px">
        <div style="font-size:0.8rem;font-weight:700;color:#92400E;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Parts used in visits but not in the contract catalog
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${uncataloged.map(u => `<span style="display:inline-flex;align-items:center;gap:4px;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:6px;padding:3px 10px;font-size:0.786rem">
            <strong>${Utils.escapeHtml(u.ref)}</strong> — ${Utils.escapeHtml(u.description)} × ${u.consumed}
          </span>`).join('')}
        </div>
      </div>` : '';

    // Consumption by visit breakdown (collapsible)
    const visitBreakdown = this._buildVisitConsumptionBreakdown(contract, contractId);

    return `
      ${kpiStrip}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:0.857rem;font-weight:700;color:var(--text)">Contract Parts Catalog</div>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="Views.MaintenanceContracts._openManagePartsModal('${contractId}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Manage Parts
        </button>` : ''}
      </div>
      <div class="table-wrapper" style="margin-bottom:4px">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Description</th>
              <th style="text-align:center">Unit</th>
              <th style="text-align:center">Allocated</th>
              <th style="text-align:center">Consumed</th>
              <th style="text-align:center">Remaining</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>${catalogRows}</tbody>
        </table>
      </div>
      ${uncatalogedSection}
      ${visitBreakdown}
    `;
  },

  _buildVisitConsumptionBreakdown(contract, contractId) {
    const { consumedByVisit } = this._computePartsConsumption(contract);
    const schedule  = contract.schedule || [];
    const ordinals  = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

    const hasAnyParts = Object.values(consumedByVisit).some(p => p.length > 0);
    if (!hasAnyParts) return '';

    const rows = schedule.map((date, idx) => {
      const parts = consumedByVisit[idx] || [];
      if (!parts.length) return '';
      const label = ordinals[idx] || `${idx+1}th`;
      return `<tr>
        <td style="font-weight:600;font-size:0.8rem;white-space:nowrap">${label} Visit<br><span style="font-weight:400;color:var(--gray-400)">${Utils.formatDate(date)}</span></td>
        <td>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${parts.map(p => `<span style="display:inline-flex;align-items:center;gap:3px;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:6px;padding:2px 8px;font-size:0.75rem">
              <strong>${Utils.escapeHtml(p.reference || '?')}</strong>
              ${Utils.escapeHtml(p.description ? '— ' + Utils.truncate(p.description, 30) : '')}
              <span style="color:var(--gray-400)">×${p.quantity || 1}</span>
            </span>`).join('')}
          </div>
        </td>
      </tr>`;
    }).filter(Boolean).join('');

    if (!rows) return '';

    return `
      <div style="margin-top:20px">
        <div style="font-size:0.857rem;font-weight:700;color:var(--text);margin-bottom:10px">Parts Consumption by Visit</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th style="width:130px">Visit</th><th>Parts Used</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  },

  /* ── VISIT PARTS DETAIL POPUP ────────────────────────────── */
  _showVisitPartsDetail(contractId, visitIdx) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;
    const schedule = contract.schedule || [];
    const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    const visitLabel = ordinals[visitIdx] || `${visitIdx+1}th`;
    const date = schedule[visitIdx] || '';

    const linked = appState.interventions.find(i =>
      i.type === 'pmc' && i.maintenanceContractId === contractId &&
      i.maintenanceVisitIndex === visitIdx && !['cancelled'].includes(i.status)
    );
    const parts = linked ? (linked.parts || []) : [];

    const rows = parts.length
      ? parts.map(p => `<tr>
          <td style="font-family:monospace;font-size:0.8rem">${Utils.escapeHtml(p.reference || '—')}</td>
          <td>${Utils.escapeHtml(p.description || '—')}</td>
          <td style="text-align:center">${p.quantity || 1}</td>
          <td style="text-align:center;color:var(--gray-500)">${Utils.escapeHtml(p.unit || 'pcs')}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;color:var(--gray-400)">No parts recorded</td></tr>`;

    Modals.open(`${visitLabel} Visit — Parts Used (${Utils.formatDate(date)})`, `
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Reference</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `, `<button class="btn btn-ghost" onclick="Modals.close()">Close</button>`);
  },

  /* ── MANAGE PARTS MODAL ──────────────────────────────────── */
  _openManagePartsModal(contractId) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;
    const clients  = appState.clients;
    const machines = appState.machines;
    const client   = clients.find(c => c.id === contract.clientId);
    const machine  = machines.find(m => m.id === contract.machineId);

    this._manageParts_contractId = contractId;
    this._manageParts_rows = JSON.parse(JSON.stringify(contract.contractParts || []));
    this._manageParts_pendingLog = [];

    Modals.open(
      `Spare Parts Catalog — ${client ? Utils.escapeHtml(client.name) : ''} / ${machine ? Utils.escapeHtml(machine.model) : ''}`,
      this._renderManagePartsBody(),
      `<button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
       <button class="btn btn-primary" onclick="Views.MaintenanceContracts._submitManageParts()">Save Parts Catalog</button>`,
      { size: 'lg' }
    );
  },

  _renderManagePartsBody() {
    const rows = this._manageParts_rows;

    const tableRows = rows.length === 0
      ? `<tr id="mpEmptyRow"><td colspan="5" style="text-align:center;padding:20px;color:var(--gray-400);font-size:0.857rem">No parts added yet. Use the form below to add parts.</td></tr>`
      : rows.map((p, i) => `
        <tr id="mpRow_${i}">
          <td><input type="text" value="${Utils.escapeHtml(p.reference || '')}" oninput="Views.MaintenanceContracts._mpUpdateRow(${i},'reference',this.value)"
            style="width:100%;padding:5px 8px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;font-family:monospace;background:var(--surface);color:var(--text)"></td>
          <td><input type="text" value="${Utils.escapeHtml(p.description || '')}" oninput="Views.MaintenanceContracts._mpUpdateRow(${i},'description',this.value)"
            style="width:100%;padding:5px 8px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text)"></td>
          <td style="width:90px"><input type="number" value="${p.quantity || 1}"
            min="${['litre','m'].includes(p.unit||'pcs') ? '0.01' : '1'}"
            step="${['litre','m'].includes(p.unit||'pcs') ? '0.01' : '1'}"
            oninput="Views.MaintenanceContracts._mpUpdateRow(${i},'quantity',this.value)"
            id="mpQtyInput_${i}"
            style="width:100%;padding:5px 8px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;text-align:center;background:var(--surface);color:var(--text)"></td>
          <td style="width:80px">
            <select oninput="Views.MaintenanceContracts._mpUpdateRow(${i},'unit',this.value);Views.MaintenanceContracts._mpSyncQtyInput(${i},this.value)"
              style="width:100%;padding:5px 6px;border:1px solid var(--gray-300);border-radius:var(--radius-sm);font-size:0.8rem;background:var(--surface);color:var(--text);cursor:pointer">
              ${['pcs','litre','m'].map(u => `<option value="${u}" ${(p.unit||'pcs')===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </td>
          <td style="text-align:center;width:48px">
            <button class="btn btn-ghost btn-sm btn-icon" title="Remove" style="color:var(--red)" onclick="Views.MaintenanceContracts._mpRemoveRow(${i})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </td>
        </tr>`).join('');

    return `
      <div style="margin-bottom:4px;font-size:0.8rem;color:var(--gray-500)">
        Define the spare parts allocated for the entire contract period. Consumption is tracked automatically from each visit's recorded parts.
      </div>
      <div class="table-wrapper" style="margin-bottom:16px;max-height:320px;overflow-y:auto">
        <table class="data-table" id="mpTable">
          <thead>
            <tr>
              <th>Part Reference</th>
              <th>Description</th>
              <th style="text-align:center">Qty Allocated</th>
              <th style="text-align:center">Unit</th>
              <th style="text-align:center"></th>
            </tr>
          </thead>
          <tbody id="mpTableBody">${tableRows}</tbody>
        </table>
      </div>

      <!-- Add Row Form -->
      <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:14px 16px">
        <div style="font-size:0.8rem;font-weight:700;color:var(--gray-700);margin-bottom:10px">Add New Part</div>
        <div style="display:grid;grid-template-columns:1fr 2fr 80px 80px auto;gap:8px;align-items:end">
          <div>
            <label style="font-size:0.75rem;font-weight:600;color:var(--gray-500);display:block;margin-bottom:3px">Reference <span style="color:var(--red)">*</span></label>
            <input id="mpNewRef" type="text" placeholder="e.g. BLD-001" class="form-input" style="font-family:monospace">
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:600;color:var(--gray-500);display:block;margin-bottom:3px">Description</label>
            <input id="mpNewDesc" type="text" placeholder="e.g. Blade assembly" class="form-input">
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:600;color:var(--gray-500);display:block;margin-bottom:3px">Unit</label>
            <select id="mpNewUnit" class="form-select" onchange="Views.MaintenanceContracts._mpSyncNewQtyInput()">
              ${['pcs','litre','m'].map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:600;color:var(--gray-500);display:block;margin-bottom:3px">Qty</label>
            <input id="mpNewQty" type="number" value="1" min="1" step="1" class="form-input" style="text-align:center">
          </div>
          <button class="btn btn-primary btn-sm" style="align-self:end" onclick="Views.MaintenanceContracts._mpAddRow()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>
        <div id="mpAddError" style="color:var(--red);font-size:0.786rem;margin-top:6px;display:none"></div>
      </div>
    `;
  },

  _mpParseQty(value, unit) {
    const decimal = ['litre','m'].includes(unit);
    const parsed  = decimal ? parseFloat(value) : parseInt(value);
    const min     = decimal ? 0.01 : 1;
    return isNaN(parsed) || parsed < min ? min : parsed;
  },

  _mpSyncQtyInput(idx, unit) {
    const input = document.getElementById(`mpQtyInput_${idx}`);
    if (!input) return;
    const decimal = ['litre','m'].includes(unit);
    input.min  = decimal ? '0.01' : '1';
    input.step = decimal ? '0.01' : '1';
    // Re-parse current value with new unit rules
    const current = parseFloat(input.value) || 1;
    input.value = decimal ? current : Math.max(1, Math.round(current));
    this._manageParts_rows[idx].quantity = parseFloat(input.value);
  },

  _mpSyncNewQtyInput() {
    const unit  = document.getElementById('mpNewUnit')?.value || 'pcs';
    const input = document.getElementById('mpNewQty');
    if (!input) return;
    const decimal = ['litre','m'].includes(unit);
    input.min  = decimal ? '0.01' : '1';
    input.step = decimal ? '0.01' : '1';
    const current = parseFloat(input.value) || 1;
    input.value = decimal ? current : Math.max(1, Math.round(current));
  },

  _mpUpdateRow(idx, field, value) {
    if (this._manageParts_rows[idx]) {
      if (field === 'quantity') {
        const unit = this._manageParts_rows[idx].unit || 'pcs';
        this._manageParts_rows[idx][field] = this._mpParseQty(value, unit);
      } else {
        this._manageParts_rows[idx][field] = value;
      }
    }
  },

  _mpRemoveRow(idx) {
    const removed = this._manageParts_rows.splice(idx, 1)[0];
    this._manageParts_pendingLog = this._manageParts_pendingLog || [];
    if (removed?.reference) {
      this._manageParts_pendingLog.push({ action: 'DELETE_CONTRACT_PART', before: removed, after: null });
    }
    const body = document.getElementById('modalBody');
    if (body) body.innerHTML = this._renderManagePartsBody();
  },

  _mpAddRow() {
    const ref    = (document.getElementById('mpNewRef')?.value || '').trim();
    const desc   = (document.getElementById('mpNewDesc')?.value || '').trim();
    const unit   = document.getElementById('mpNewUnit')?.value || 'pcs';
    const qty    = this._mpParseQty(document.getElementById('mpNewQty')?.value, unit);
    const errEl  = document.getElementById('mpAddError');

    if (!ref) {
      if (errEl) { errEl.textContent = 'Part reference is required.'; errEl.style.display = 'block'; }
      return;
    }
    // Duplicate check
    const dup = this._manageParts_rows.some(p => (p.reference || '').trim().toUpperCase() === ref.toUpperCase());
    if (dup) {
      if (errEl) { errEl.textContent = `Reference "${ref}" already exists in the catalog.`; errEl.style.display = 'block'; }
      return;
    }
    if (errEl) errEl.style.display = 'none';

    const newPart = { id: Utils.generateId(), reference: ref, description: desc, quantity: qty, unit };
    this._manageParts_rows.push(newPart);
    this._manageParts_pendingLog = this._manageParts_pendingLog || [];
    this._manageParts_pendingLog.push({ action: 'ADD_CONTRACT_PART', before: null, after: newPart });
    const body = document.getElementById('modalBody');
    if (body) body.innerHTML = this._renderManagePartsBody();
  },

  async _submitManageParts() {
    const contractId = this._manageParts_contractId;
    if (!contractId) return;

    const originalParts = appState.maintenanceContracts.find(c => c.id === contractId)?.contractParts || [];

    const parts = this._manageParts_rows.map(p => ({
      id:          p.id || Utils.generateId(),
      reference:   (p.reference || '').trim(),
      description: (p.description || '').trim(),
      quantity:    this._mpParseQty(p.quantity, p.unit || 'pcs'),
      unit:        p.unit || 'pcs'
    })).filter(p => p.reference);

    // Detect edits (rows that existed before and have changed)
    const editLogs = [];
    parts.forEach(newP => {
      const orig = originalParts.find(o => o.id === newP.id);
      if (orig) {
        const changed = orig.reference !== newP.reference ||
          orig.description !== newP.description ||
          String(orig.quantity) !== String(newP.quantity) ||
          orig.unit !== newP.unit;
        if (changed) editLogs.push({ action: 'EDIT_CONTRACT_PART', before: orig, after: newP });
      }
    });

    await Storage.updateContractParts(contractId, parts);

    // Write audit log entries
    const user       = appState.currentUser;
    const contract   = appState.maintenanceContracts.find(c => c.id === contractId);
    const clients    = appState.clients;
    const machines   = appState.machines;
    const client     = clients.find(c => c.id === contract?.clientId);
    const machine    = machines.find(m => m.id === contract?.machineId);
    const targetLabel = `${client?.name || '?'} / ${machine?.model || '?'} (Contract)`;

    const pendingLog = this._manageParts_pendingLog || [];
    const allLogs    = [...pendingLog, ...editLogs];

    for (const entry of allLogs) {
      let details = '';
      if (entry.action === 'ADD_CONTRACT_PART') {
        details = `Added: ${entry.after.reference} — ${entry.after.description || 'no description'} | Qty: ${entry.after.quantity} ${entry.after.unit}`;
      } else if (entry.action === 'EDIT_CONTRACT_PART') {
        const b = entry.before, a = entry.after;
        const diffs = [];
        if (b.reference   !== a.reference)   diffs.push(`Reference: "${b.reference}" → "${a.reference}"`);
        if (b.description !== a.description) diffs.push(`Description: "${b.description}" → "${a.description}"`);
        if (String(b.quantity) !== String(a.quantity) || b.unit !== a.unit)
          diffs.push(`Qty: ${b.quantity} ${b.unit} → ${a.quantity} ${a.unit}`);
        details = diffs.join(' | ');
      } else if (entry.action === 'DELETE_CONTRACT_PART') {
        details = `Deleted: ${entry.before.reference} — ${entry.before.description || 'no description'} | Qty: ${entry.before.quantity} ${entry.before.unit}`;
      }

      if (details) {
        await Storage.logAction({
          action:    entry.action,
          actor:     user?.name || 'Admin',
          role:      user?.role || 'admin',
          target:    targetLabel,
          targetId:  contractId,
          details
        });
      }
    }

    this._manageParts_pendingLog = [];
    Toast.success('Spare parts catalog saved successfully.');
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId, 'parts'), 80);
  },

  /* ── PLAN VISIT MODAL ───────────────────────────────────── */
  async _openPlanVisitModal(contractId, visitIndex) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;

    const schedule    = contract.schedule || [];
    const visitDate   = schedule[visitIndex];
    if (!visitDate) return;

    const ordinals    = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    const visitLabel  = ordinals[visitIndex] || `${visitIndex + 1}th`;
    const clients    = appState.clients;
    const machines   = appState.machines;
    const client      = clients.find(c => c.id === contract.clientId);
    const machine     = machines.find(m => m.id === contract.machineId);

    // Check if an intervention already exists for this visit
    const existing = appState.interventions.find(i =>
      i.type === 'pmc' &&
      i.maintenanceContractId === contractId &&
      i.maintenanceVisitIndex === visitIndex &&
      !['cancelled'].includes(i.status)
    );

    const technicians = appState.users.filter(u => u.role === 'technician');
    const existingTechIds = existing ? Utils.getTechIds(existing) : [];
    const techCheckboxes = technicians.map(u => `
      <label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--gray-200);border-radius:var(--radius-sm);cursor:pointer;font-size:0.857rem;transition:background 0.15s"
             onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background=''">
        <input type="checkbox" class="pvTechCheck" value="${u.id}" ${existingTechIds.includes(u.id) ? 'checked' : ''}
               style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary)">
        ${Utils.escapeHtml(u.name)}
      </label>`).join('');

    const currentDate = existing?.scheduledDate
      ? new Date(existing.scheduledDate).toISOString().split('T')[0]
      : visitDate;
    const currentTime = existing?.scheduledDate
      ? new Date(existing.scheduledDate).toTimeString().slice(0, 5)
      : '08:00';

    Modals.open(`Plan ${visitLabel} Visit — ${client ? Utils.escapeHtml(client.name) : ''}`, `
      <div style="padding:10px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.857rem;color:#1E40AF">
        <strong>${visitLabel} Scheduled Maintenance</strong> for
        ${Utils.escapeHtml(machine?.model || '—')}
        — Contract date: <strong>${Utils.formatDate(visitDate)}</strong>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Scheduled Date <span class="required">*</span></label>
          <input type="date" id="pvDate" class="form-input" value="${currentDate}">
        </div>
        <div class="form-group">
          <label class="form-label">Scheduled Time <span class="required">*</span></label>
          <input type="time" id="pvTime" class="form-input" value="${currentTime}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assign Technician(s)</label>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;padding:2px">
          ${techCheckboxes || '<span style="color:var(--gray-400);font-size:0.857rem">No technicians registered</span>'}
        </div>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Views.MaintenanceContracts._submitPlanVisit('${contractId}',${visitIndex},'${existing?.id || ''}')">
        ${existing ? 'Update Assignment' : 'Create Intervention'}
      </button>
    `);
  },

  async _submitPlanVisit(contractId, visitIndex, existingId) {
    const dateVal = document.getElementById('pvDate')?.value;
    const timeVal = document.getElementById('pvTime')?.value || '08:00';
    const techIds = Array.from(document.querySelectorAll('.pvTechCheck:checked')).map(cb => cb.value);
    const techId  = techIds[0] || null;

    if (!dateVal) { Toast.error('Scheduled date is required.'); return; }

    const contract  = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;

    const schedule   = contract.schedule || [];
    const visitDate  = schedule[visitIndex];
    const ordinals   = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    const visitLabel = ordinals[visitIndex] || `${visitIndex + 1}th`;
    const clients    = appState.clients;
    const machines   = appState.machines;
    const client     = clients.find(c => c.id === contract.clientId);
    const machine    = machines.find(m => m.id === contract.machineId);
    const scheduledDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    const user = appState.currentUser;

    if (existingId) {
      // Update existing intervention
    await Storage.updateIntervention(existingId, {
        scheduledDate,
        technicianIds: techIds,
        technicianId:  techId,
        status: techIds.length > 0 ? 'assigned' : 'new'
      }, {
        action: 'Visit Planned',
        user: user?.name || 'Admin',
        details: `${visitLabel} visit scheduled for ${Utils.formatDate(dateVal)}${techId ? ' with technician assigned' : ''}`
      });
      Toast.success(`${visitLabel} visit updated.`);
    } else {
      // Create new intervention for this visit
    await Storage.createIntervention({
        clientId:              contract.clientId,
        machineId:             contract.machineId,
        type:                  'pmc',
        priority:              'medium',
        status:                techIds.length > 0 ? 'assigned' : 'new',
        scheduledDate,
        technicianIds:         techIds,
        technicianId:          techId,
        location:              'client',
        description:           `${visitLabel} Scheduled PMC visit — ${contract.visitsPerYear}×/yr contract` +
                               (machine ? ` for ${machine.model}` : '') +
                               (client  ? ` (${client.name})`    : ''),
        maintenanceContractId: contractId,
        maintenanceVisitIndex: visitIndex,
        createdBy:             user?.name || 'Admin'
      });
      Toast.success(`${visitLabel} visit intervention created${techId ? ' and technician assigned' : ''}.`);
    }

    refreshInterventions();
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId), 80);
  },

  /* ── VISIT COMPLETION ────────────────────────────────────── */
  async _markVisitDone(contractId, date) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;
    const completed = [...(contract.completedVisits || [])];
    if (!completed.includes(date)) completed.push(date);
    await Storage.updateMaintenanceContract(contractId, { completedVisits: completed });
    Toast.success(`Visit on ${Utils.formatDate(date)} marked as completed.`);
    // Refresh the detail modal in place
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId), 80);
    // Refresh main list in background
    setTimeout(() => {
      if (Router.getCurrent() === 'maintenance-contracts') this.mount();
    }, 200);
  },

  async _unmarkVisit(contractId, date) {
    const contract = appState.maintenanceContracts.find(c => c.id === contractId);
    if (!contract) return;
    const completed = (contract.completedVisits || []).filter(d => d !== date);
    await Storage.updateMaintenanceContract(contractId, { completedVisits: completed });
    Toast.success(`Visit on ${Utils.formatDate(date)} marked as pending.`);
    Modals.close();
    setTimeout(() => this.openDetailModal(contractId), 80);
    setTimeout(() => {
      if (Router.getCurrent() === 'maintenance-contracts') this.mount();
    }, 200);
  }
};
