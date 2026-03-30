/* ============================================================
   views/pmc.js — PMC Preventive Maintenance Contract Section
   ============================================================ */

window.Views = window.Views || {};

Views.PMC = {

  _charts: {},
  _allRows: [],
  _sortCol: null,
  _sortDir: 'asc',
  _selectedYear: 'all',

  /* ── SORT HELPERS ────────────────────────────────────────── */
  _thHTML(col, label) {
    const isActive = this._sortCol === col;
    const arrow = isActive ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : '';
    const style = `cursor:pointer;user-select:none;white-space:nowrap${isActive ? ';color:var(--blue)' : ''}`;
    return `<th style="${style}" onclick="Views.PMC._onSort('${col}')">${label}${arrow}</th>`;
  },

  _onSort(col) {
    if (this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    this._refreshTable();
  },

  _sortRows(rows) {
    if (!this._sortCol) return rows;
    const col = this._sortCol;
    const visitOrder = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
    return [...rows].sort((a, b) => {
      let va, vb;
      if (col === 'visit') {
        va = visitOrder.indexOf(a.visitNumber);
        vb = visitOrder.indexOf(b.visitNumber);
      } else if (col === 'date') {
        va = a.visitDate;
        vb = b.visitDate;
      } else if (col === 'progress') {
        va = a.total > 0 ? a.doneCount / a.total : 0;
        vb = b.total > 0 ? b.doneCount / b.total : 0;
      } else if (col === 'status') {
        const order = { completed: 0, overdue: 1, ongoing: 2, assigned: 3, tentative: 4, planned: 5 };
        va = order[a.statusKey] ?? 99;
        vb = order[b.statusKey] ?? 99;
      } else {
        va = (a[col] || '').toLowerCase();
        vb = (b[col] || '').toLowerCase();
      }
      const cmp = typeof va === 'number' ? va - vb : (va < vb ? -1 : va > vb ? 1 : 0);
      return this._sortDir === 'desc' ? -cmp : cmp;
    });
  },

  _updateSortHeader() {
    const thead = document.querySelector('#pmcTable thead tr');
    if (!thead) return;
    thead.innerHTML = `
      ${this._thHTML('jobNumber',       'Job Number')}
      ${this._thHTML('clientName',      'Client')}
      ${this._thHTML('machineName',     'Machine')}
      ${this._thHTML('serialNumber',    'Serial Number')}
      ${this._thHTML('district',        'District')}
      ${this._thHTML('locationAddress', 'Location Address')}
      ${this._thHTML('visit',           'Visit #')}
      ${this._thHTML('techName',        'Technician')}
      ${this._thHTML('date',            'Scheduled Date')}
      ${this._thHTML('progress',        'Progress')}
      ${this._thHTML('status',          'Status')}
      <th>Action</th>
    `;
  },

  /* ── DATA BUILDER ────────────────────────────────────────── */
  async _buildData() {
    const interventions = appState.interventions;
    const contracts     = appState.maintenanceContracts;
    const clients       = appState.clients;
    const machines      = appState.machines;
    const users         = appState.users;

    const clientMap  = Object.fromEntries(clients.map(c  => [c.id, c]));
    const machineMap = Object.fromEntries(machines.map(m => [m.id, m]));
    const userMap    = Object.fromEntries(users.map(u    => [u.id, u]));

    const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

    const rows = [];
    contracts.forEach(contract => {
      const schedule  = contract.schedule || [];
      const completed = contract.completedVisits || [];
      const total     = schedule.length;
      const doneCount = completed.length;
      const machine   = machineMap[contract.machineId];
      const client    = clientMap[contract.clientId];

      schedule.forEach((date, idx) => {
        const isCompleted = completed.includes(date);
        const today = new Date(); today.setHours(0,0,0,0);
        const isOverdue = !isCompleted && new Date(date + 'T00:00:00') < today;

        const intervention = interventions.find(i =>
          i.type === 'pmc' &&
          i.maintenanceContractId === contract.id &&
          (i.maintenanceVisitIndex === idx ||
           (i.scheduledDate && i.scheduledDate.startsWith(date)))
        ) || null;

        const techName = intervention ? Utils.getTechnicianNames(intervention) : '—';

        const progress = doneCount >= total
          ? `${total} / ${total} Completed`
          : `${doneCount} / ${total} Done`;

        // Derive a canonical status string for filtering
        let statusKey;
        if (isCompleted)                                        statusKey = 'completed';
        else if (isOverdue)                                     statusKey = 'overdue';
        else if (intervention?.status === 'assigned')          statusKey = 'assigned';
        else if (intervention?.status === 'tentative')         statusKey = 'tentative';
        else if (intervention?.status === 'ongoing')           statusKey = 'ongoing';
        else                                                    statusKey = 'planned';

        rows.push({
          contractId:      contract.id,
          interventionId:  intervention?.id || null,
          jobNumber:       machine?.jobNumber || '—',
          clientName:      client?.name || '—',
          machineName:     machine?.model || '—',
          machineType:     machine?.type  || '—',
          serialNumber:    contract.serialNumber || machine?.serialNumber || '—',
          district:        machine?.district || '—',
          locationAddress: intervention?.locationAddress || '—',
          visitNumber:     ordinals[idx] || `${idx + 1}th`,
          visitIndex:      idx,
          visitDate:       date,
          techName,
          progress,
          doneCount,
          total,
          isCompleted,
          isOverdue,
          statusKey,
          contractStart:   contract.startDate,
          contractEnd:     contract.endDate,
        });
      });
    });

    return { rows, contracts, clientMap, machineMap, userMap };
  },

  /* ── ANALYTICS ───────────────────────────────────────────── */
  _buildAnalytics(rows) {
    const totalVisits    = rows.length;
    const completedCount = rows.filter(r => r.isCompleted).length;
    const overdueCount   = rows.filter(r => r.isOverdue).length;
    const pendingCount   = rows.filter(r => !r.isCompleted && !r.isOverdue).length;

    const today = new Date(); today.setHours(0,0,0,0);
    const monthMap = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      monthMap[key] = { label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), count: 0 };
    }
    rows.filter(r => !r.isCompleted).forEach(r => {
      const key = r.visitDate.substring(0, 7);
      if (monthMap[key]) monthMap[key].count++;
    });

    const techWorkload = {};
    rows.filter(r => !r.isCompleted).forEach(r => {
      const name = r.techName === '—' ? 'Unassigned' : r.techName;
      techWorkload[name] = (techWorkload[name] || 0) + 1;
    });

    return { totalVisits, completedCount, overdueCount, pendingCount, monthMap, techWorkload };
  },

  /* ── FILTER LOGIC ────────────────────────────────────────── */
  _applyFilters(rows) {
    const get = id => (document.getElementById(id)?.value || '').trim().toLowerCase();
    const fJob      = get('pmcFJob');
    const fClient   = get('pmcFClient');
    const fMachine  = get('pmcFMachine');
    const fVisit    = get('pmcFVisit');
    const fTech     = get('pmcFTech');
    const fDateFrom = get('pmcFDateFrom');
    const fDateTo   = get('pmcFDateTo');
    const fProgress = get('pmcFProgress');
    const fStatus   = get('pmcFStatus');
    const fDistrict  = get('pmcFDistrict');
    const fLocation  = get('pmcFLocation');

    return rows.filter(r => {
      if (fJob      && !r.jobNumber.toLowerCase().includes(fJob))          return false;
      if (fClient   && !r.clientName.toLowerCase().includes(fClient))       return false;
      if (fMachine  && r.machineName.toLowerCase() !== fMachine)             return false;
      if (fVisit    && r.visitNumber.toLowerCase() !== fVisit)              return false;
      if (fTech     && !r.techName.toLowerCase().includes(fTech))           return false;
      if (fDateFrom && r.visitDate < fDateFrom)                             return false;
      if (fDateTo   && r.visitDate > fDateTo)                               return false;
      if (fProgress && !r.progress.toLowerCase().includes(fProgress))       return false;
      if (fStatus   && r.statusKey !== fStatus)                             return false;
      if (fDistrict && r.district.toLowerCase() !== fDistrict)              return false;
      if (fLocation && !r.locationAddress.toLowerCase().includes(fLocation)) return false;
      return true;
    });
  },

  _hasActiveFilters() {
    const ids = ['pmcFJob','pmcFClient','pmcFMachine','pmcFVisit',
                 'pmcFTech','pmcFDateFrom','pmcFDateTo','pmcFProgress','pmcFStatus','pmcFDistrict','pmcFLocation'];
    return ids.some(id => (document.getElementById(id)?.value || '') !== '');
  },

  _refreshTable() {
    const yearRows = this._filterByYear(this._allRows);
    const filtered = this._sortRows(this._applyFilters(yearRows));
    const tbody = document.querySelector('#pmcTable tbody');
    if (tbody) tbody.innerHTML = this._buildRows(filtered);

    this._updateSortHeader();

    const counter = document.getElementById('pmcRowCount');
    if (counter) counter.textContent = `${filtered.length} of ${yearRows.length} visit${yearRows.length !== 1 ? 's' : ''}`;

  },

  _refreshYear() {
    const yearRows  = this._filterByYear(this._allRows);
    const analytics = this._buildAnalytics(yearRows);

    // Update KPI values
    const completionRate = yearRows.length > 0 ? Math.round((analytics.completedCount / yearRows.length) * 100) : 0;
    const kpis = {
      pmcKpiTotalVisits:    yearRows.length,
      pmcKpiCompleted:      analytics.completedCount,
      pmcKpiOverdue:        analytics.overdueCount,
      pmcKpiCompletion:     completionRate + '%',
    };
    Object.entries(kpis).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // Rebuild table rows (clear other filters too when year changes)
    this._refreshTable();

    // Rebuild charts
    this._destroyCharts();
    this._renderCharts(analytics);
  },

  _filterByYear(rows) {
    if (this._selectedYear === 'all') return rows;
    return rows.filter(r => r.visitDate.startsWith(this._selectedYear));
  },

  /* ── MOUNT ───────────────────────────────────────────────── */
  async mount() {
    this._destroyCharts();
    this._sortCol = null;
    this._sortDir = 'asc';
    this._selectedYear = 'all';
    const { rows, contracts } = await this._buildData();
    this._allRows = rows;
    const years = [...new Set(rows.map(r => r.visitDate.substring(0, 4)))].sort();
    const yearRows = this._filterByYear(rows);
    const analytics = this._buildAnalytics(yearRows);
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template(yearRows, analytics, contracts.length, years);
    this._renderCharts(analytics);
    this._bindEvents();
  },

  _destroyCharts() {
    Object.values(this._charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this._charts = {};
  },

  /* ── TEMPLATE ────────────────────────────────────────────── */
  _template(rows, analytics, contractCount, years = []) {
    const { totalVisits, completedCount, overdueCount, pendingCount } = analytics;
    const completionRate = totalVisits > 0 ? Math.round((completedCount / totalVisits) * 100) : 0;
    const yearOpts = years.map(y => `<option value="${y}" ${this._selectedYear === y ? 'selected' : ''}>${y}</option>`).join('');

    // Build unique option lists
    const clients  = [...new Set(rows.map(r => r.clientName))].filter(v => v !== '—').sort();
    const techs    = [...new Set(rows.map(r => r.techName))].sort();
    const visits   = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']
                       .filter(v => rows.some(r => r.visitNumber === v));
    const statuses = ['planned','assigned','tentative','ongoing','overdue','completed'];

    const machines = [...new Set(rows.map(r => r.machineName))].filter(v => v !== '—').sort();
    const clientOpts  = clients.map(v  => `<option value="${v}">${Utils.escapeHtml(v)}</option>`).join('');
    const machineOpts = machines.map(v => `<option value="${v.toLowerCase()}">${Utils.escapeHtml(v)}</option>`).join('');
    const techOpts    = techs.map(v    => `<option value="${v}">${Utils.escapeHtml(v)}</option>`).join('');
    const visitOpts   = visits.map(v   => `<option value="${v.toLowerCase()}">${v}</option>`).join('');
    const statusOpts  = statuses.map(v => `<option value="${v}">${v.charAt(0).toUpperCase() + v.slice(1)}</option>`).join('');
    const progressOpts = [...new Set(rows.map(r => r.progress))].sort()
                          .map(v => `<option value="${v.toLowerCase()}">${Utils.escapeHtml(v)}</option>`).join('');

    const inputStyle = '';
    const selectStyle = '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">PMC – Preventive Maintenance</h1>
          <p class="page-subtitle">Monitor and track all preventive maintenance contract visits</p>
        </div>
        <div class="page-actions">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.857rem;color:var(--gray-500)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Year:</span>
            <select id="pmcYearFilter" class="pmc-filter-select" style="font-weight:600">
              <option value="all" ${this._selectedYear === 'all' ? 'selected' : ''}>All Years</option>
              ${yearOpts}
            </select>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-5" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-label">Total Contracts</div>
          <div class="kpi-value">${contractCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Visits</div>
          <div class="kpi-value" id="pmcKpiTotalVisits">${totalVisits}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Visits Completed</div>
          <div class="kpi-value" id="pmcKpiCompleted" style="color:#059669">${completedCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Overdue</div>
          <div class="kpi-value" id="pmcKpiOverdue" style="color:var(--red)">${overdueCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Completion Rate</div>
          <div class="kpi-value" id="pmcKpiCompletion">${completionRate}%</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
        <div class="card" style="padding:20px">
          <div class="card-title" style="margin-bottom:16px">Maintenance Progress</div>
          <div style="position:relative;height:180px;display:flex;align-items:center;justify-content:center">
            <canvas id="pmcProgressChart"></canvas>
          </div>
          <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:0.786rem">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#059669;display:inline-block"></span>Completed (${completedCount})</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#F59E0B;display:inline-block"></span>Pending (${pendingCount})</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#EF4444;display:inline-block"></span>Overdue (${overdueCount})</span>
          </div>
        </div>
        <div class="card" style="padding:20px">
          <div class="card-title" style="margin-bottom:16px">Monthly PMC Visits (Next 12 Mo.)</div>
          <div style="position:relative;height:180px"><canvas id="pmcMonthlyChart"></canvas></div>
        </div>
        <div class="card" style="padding:20px">
          <div class="card-title" style="margin-bottom:16px">Technician Workload</div>
          <div style="position:relative;height:180px"><canvas id="pmcTechChart"></canvas></div>
        </div>
      </div>

      <!-- PMC Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">PMC Visit Schedule</span>
          <span class="text-sm text-muted" id="pmcRowCount">${rows.length} visit${rows.length !== 1 ? 's' : ''} across ${contractCount} contract${contractCount !== 1 ? 's' : ''}</span>
        </div>

        <!-- Search + Filters -->
        <div style="padding:14px 16px;border-bottom:1px solid var(--gray-200);display:flex;flex-direction:column;gap:10px">

          <!-- Filter row -->
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <input  id="pmcFJob"      type="text"   placeholder="Job Number" class="pmc-filter-input" style="width:120px">
            <select id="pmcFClient"   class="pmc-filter-select" style="width:140px"><option value="">All Clients</option>${clientOpts}</select>
            <select id="pmcFMachine"  class="pmc-filter-select" style="width:140px"><option value="">All Machines</option>${machineOpts}</select>
            <select id="pmcFVisit"    class="pmc-filter-select" style="width:100px"><option value="">All Visits</option>${visitOpts}</select>
            <select id="pmcFTech"     class="pmc-filter-select" style="width:140px"><option value="">All Technicians</option>${techOpts}</select>
            <input  id="pmcFDateFrom" type="date"   title="Date from" class="pmc-filter-input" style="width:130px">
            <input  id="pmcFDateTo"   type="date"   title="Date to"   class="pmc-filter-input" style="width:130px">
            <select id="pmcFProgress" class="pmc-filter-select" style="width:140px"><option value="">All Progress</option>${progressOpts}</select>
            <select id="pmcFStatus"   class="pmc-filter-select" style="width:120px"><option value="">All Statuses</option>${statusOpts}</select>
            <select id="pmcFDistrict" class="pmc-filter-select" style="width:160px">
              <option value="">All Districts</option>
              ${CONFIG.DISTRICTS.map(d => `<option value="${d.toLowerCase()}">${d}</option>`).join('')}
            </select>
            <select id="pmcFLocation" class="pmc-filter-select" style="width:180px">
              <option value="">All Locations</option>
              ${[...new Set(rows.map(r => r.locationAddress).filter(v => v && v !== '—'))].sort().map(v => `<option value="${Utils.escapeHtml(v.toLowerCase())}">${Utils.escapeHtml(v)}</option>`).join('')}
            </select>
            <button id="pmcClearFilters" class="btn btn-ghost btn-sm" style="white-space:nowrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear
            </button>
          </div>
        </div>

        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table" id="pmcTable">
              <thead>
                <tr>
                  ${this._thHTML('jobNumber',       'Job Number')}
                  ${this._thHTML('clientName',      'Client')}
                  ${this._thHTML('machineName',     'Machine')}
                  ${this._thHTML('serialNumber',    'Serial Number')}
                  ${this._thHTML('district',        'District')}
                  ${this._thHTML('locationAddress', 'Location Address')}
                  ${this._thHTML('visit',           'Visit #')}
                  ${this._thHTML('techName',        'Technician')}
                  ${this._thHTML('date',            'Scheduled Date')}
                  ${this._thHTML('progress',        'Progress')}
                  ${this._thHTML('status',          'Status')}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>${this._buildRows(rows)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ── TABLE ROWS ──────────────────────────────────────────── */
  _buildRows(rows) {
    if (!rows.length) {
      return `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--gray-400)">No PMC visits match the current filters.</td></tr>`;
    }

    return rows.map(r => {
      const statusKeyMap = {
        completed: 'completed', overdue: 'overdue',
        assigned: 'assigned', tentative: 'tentative', ongoing: 'ongoing', planned: 'planned'
      };
      const statusLabelMap = {
        completed: 'Completed', overdue: 'Overdue',
        assigned: 'Assigned', tentative: 'Tentative', ongoing: 'On Going', planned: 'Planned'
      };
      const sKey = statusKeyMap[r.statusKey] || 'planned';
      const statusBadge = `<span class="pmc-status-badge pmc-status-${sKey}">${statusLabelMap[sKey]}</span>`;

      const progressCls = r.doneCount >= r.total ? 'done' : r.doneCount > 0 ? 'partial' : 'none';
      const progressBadge = `<span class="fc-progress-badge fc-progress-${progressCls}">${r.progress}</span>`;

      const dateStyle = r.isOverdue ? 'color:var(--red);font-weight:600' : '';

      const viewBtn = r.interventionId
        ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="Views.Interventions.openDetailModal('${r.interventionId}')" title="View Intervention">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
           </button>`
        : `<button class="btn btn-ghost btn-sm btn-icon" onclick="Router.go('maintenance-contracts');setTimeout(()=>Views.MaintenanceContracts.openDetailModal('${r.contractId}'),300)" title="View Contract">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
           </button>`;

      return `<tr>
        <td style="font-family:monospace;font-weight:600;font-size:0.857rem">${Utils.escapeHtml(r.jobNumber)}</td>
        <td>${Utils.escapeHtml(r.clientName)}</td>
        <td>
          <div style="font-weight:500">${Utils.escapeHtml(r.machineName)}</div>
          <div style="font-size:0.786rem;color:var(--gray-400)">${Utils.escapeHtml(r.machineType)}</div>
        </td>
        <td style="font-family:monospace;font-size:0.786rem;color:${r.serialNumber === '—' ? 'var(--gray-400)' : 'var(--gray-500)'}">${Utils.escapeHtml(r.serialNumber)}</td>
        <td style="font-size:0.786rem;color:${r.district === '—' ? 'var(--gray-400)' : 'inherit'}">${Utils.escapeHtml(r.district)}</td>
        <td style="font-size:0.786rem;color:${r.locationAddress === '—' ? 'var(--gray-400)' : 'inherit'}">${Utils.escapeHtml(r.locationAddress)}</td>
        <td><span style="font-weight:600">${r.visitNumber}</span></td>
        <td style="color:${r.techName === '—' ? 'var(--gray-400)' : 'inherit'}">${Utils.escapeHtml(r.techName)}</td>
        <td style="${dateStyle}">${Utils.formatDate(r.visitDate)}</td>
        <td>${progressBadge}</td>
        <td>${statusBadge}</td>
        <td>${viewBtn}</td>
      </tr>`;
    }).join('');
  },

  /* ── CHARTS ──────────────────────────────────────────────── */
  _renderCharts(analytics) {
    const { completedCount, overdueCount, pendingCount, monthMap, techWorkload } = analytics;

    const progCtx = document.getElementById('pmcProgressChart');
    if (progCtx) {
      this._charts.progress = new Chart(progCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending', 'Overdue'],
          datasets: [{ data: [completedCount, pendingCount, overdueCount],
            backgroundColor: ['#059669', '#F59E0B', '#EF4444'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: { cutout: '65%', plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
      });
    }

    const monthCtx = document.getElementById('pmcMonthlyChart');
    if (monthCtx) {
      const entries = Object.values(monthMap);
      this._charts.monthly = new Chart(monthCtx, {
        type: 'bar',
        data: { labels: entries.map(e => e.label),
          datasets: [{ label: 'PMC Visits', data: entries.map(e => e.count), backgroundColor: '#3B82F6', borderRadius: 4 }] },
        options: { plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#F3F4F6' } },
                    x: { ticks: { font: { size: 9 } }, grid: { display: false } } },
          responsive: true, maintainAspectRatio: false }
      });
    }

    const techCtx = document.getElementById('pmcTechChart');
    if (techCtx) {
      const techEntries = Object.entries(techWorkload).sort((a, b) => b[1] - a[1]);
      this._charts.tech = new Chart(techCtx, {
        type: 'bar',
        data: { labels: techEntries.map(([n]) => n),
          datasets: [{ label: 'Pending Visits', data: techEntries.map(([, c]) => c),
            backgroundColor: techEntries.map(([n]) => n === 'Unassigned' ? '#D1D5DB' : '#8B5CF6'), borderRadius: 4 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#F3F4F6' } },
                    y: { ticks: { font: { size: 10 } }, grid: { display: false } } },
          responsive: true, maintainAspectRatio: false }
      });
    }
  },

  /* ── EVENTS ──────────────────────────────────────────────── */
  _bindEvents() {
    const yearSel = document.getElementById('pmcYearFilter');
    if (yearSel) {
      yearSel.addEventListener('change', () => {
        this._selectedYear = yearSel.value;
        this._refreshYear();
      });
    }

    const filterIds = ['pmcFJob','pmcFClient','pmcFMachine','pmcFVisit',
                       'pmcFTech','pmcFDateFrom','pmcFDateTo','pmcFProgress','pmcFStatus','pmcFDistrict','pmcFLocation'];

    filterIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this._refreshTable());
    });

    const clearBtn = document.getElementById('pmcClearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        filterIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        this._refreshTable();
      });
    }
  }
};
