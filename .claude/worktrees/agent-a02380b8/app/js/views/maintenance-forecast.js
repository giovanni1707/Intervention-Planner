/* ============================================================
   views/maintenance-forecast.js — Maintenance Forecast View
   ============================================================ */

window.Views = window.Views || {};

Views.MaintenanceForecast = {

  _selectedYear: null, // null = All years

  /* ── HELPERS ─────────────────────────────────────────────── */

  _buildForecastData() {
    const contracts    = Storage.getMaintenanceContracts();
    const clients      = Storage.getClients();
    const machines     = Storage.getMachines();
    const users        = Storage.getUsers();
    const interventions = Storage.getInterventions();

    const clientMap  = Object.fromEntries(clients.map(c => [c.id, c]));
    const machineMap = Object.fromEntries(machines.map(m => [m.id, m]));
    const userMap    = Object.fromEntries(users.map(u => [u.id, u]));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Build 18 month buckets starting from current month
    const buckets = [];
    for (let i = 0; i < 18; i++) {
      const d   = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const yr  = d.getFullYear();
      const mo  = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yr}-${mo}`;
      const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      buckets.push({ key, label, year: yr, visits: [], count: 0 });
    }

    const bucketMap = Object.fromEntries(buckets.map(b => [b.key, b]));
    const firstKey  = buckets[0].key;
    const lastKey   = buckets[buckets.length - 1].key;

    const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

    contracts.forEach(contract => {
      const completed  = contract.completedVisits || [];
      const machine    = machineMap[contract.machineId];
      const schedule   = contract.schedule || [];

      schedule.forEach((date, idx) => {
        if (completed.includes(date)) return;
        const key = date.substring(0, 7);
        if (key < firstKey || key > lastKey) return;
        const bucket = bucketMap[key];
        if (!bucket) return;

        // Look up the intervention for this specific visit index
        const visitIntervention = interventions.find(i =>
          i.type === 'pmc' &&
          i.maintenanceContractId === contract.id &&
          i.maintenanceVisitIndex === idx &&
          !['cancelled'].includes(i.status)
        ) || interventions.find(i =>
          // fallback for older entries without visitIndex
          i.type === 'pmc' &&
          i.machineId === contract.machineId &&
          i.scheduledDate === date &&
          !['cancelled'].includes(i.status)
        );
        const visitTechName = visitIntervention
          ? Utils.getTechnicianNames(visitIntervention)
          : '—';

        const doneCount = completed.length;
        const total     = schedule.length;
        const progress  = doneCount >= total
          ? `${total} / ${total} Completed`
          : `${doneCount} / ${total} Done`;

        const interventionStatus = visitIntervention?.status || null;
        let statusKey;
        if (interventionStatus === 'assigned')        statusKey = 'assigned';
        else if (interventionStatus === 'tentative')  statusKey = 'tentative';
        else if (interventionStatus === 'ongoing')    statusKey = 'ongoing';
        else                                          statusKey = 'planned';

        bucket.visits.push({
          contractId:        contract.id,
          clientName:        clientMap[contract.clientId]?.name || '—',
          machineName:       machine?.model || '—',
          jobNumber:         machine?.jobNumber || '—',
          district:          machine?.district || '—',
          scheduledDate:     date,
          visitsPerYear:     contract.visitsPerYear,
          visitNumber:       ordinals[idx] || `${idx + 1}th`,
          technicianName:    visitTechName,
          progress,
          statusKey
        });
      });
    });

    buckets.forEach(b => { b.count = b.visits.length; });
    return buckets;
  },

  _workloadLevel(count) {
    if (count === 0) return 'none';
    if (count <= 2)  return 'low';
    if (count <= 5)  return 'medium';
    return 'high';
  },

  _workloadBadge(level) {
    if (level === 'none') return '<span style="color:var(--gray-400)">—</span>';
    const styles = {
      low:    'background:#D1FAE5;color:#065F46',
      medium: 'background:#FEF3C7;color:#92400E',
      high:   'background:#FEE2E2;color:#991B1B'
    };
    const labels = { low: 'Low', medium: 'Medium', high: 'High' };
    return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;${styles[level]}">${labels[level]}</span>`;
  },

  /* ── MOUNT ───────────────────────────────────────────────── */
  mount() {
    // Reset year filter on fresh mount
    this._selectedYear = null;
    const allMonths = this._buildForecastData();
    const content   = document.getElementById('mainContent');
    content.innerHTML = this._template(allMonths);
    this._bindEvents(allMonths);
  },

  /* ── YEAR FILTER ─────────────────────────────────────────── */
  _setYear(year, allMonths) {
    this._selectedYear = year;
    const filtered = year === null ? allMonths : allMonths.filter(m => m.year === year);
    this._updateView(filtered, allMonths);
  },

  _updateView(filtered, allMonths) {
    const contracts = Storage.getMaintenanceContracts();
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    // Update year filter buttons
    const years = [...new Set(allMonths.map(m => m.year))];
    document.querySelectorAll('[data-year-btn]').forEach(btn => {
      const y = btn.dataset.yearBtn === 'all' ? null : parseInt(btn.dataset.yearBtn);
      const active = y === this._selectedYear;
      btn.style.background     = active ? 'var(--blue)'  : 'var(--gray-100)';
      btn.style.color          = active ? '#fff'          : 'var(--gray-700)';
      btn.style.borderColor    = active ? 'var(--blue)'  : 'var(--gray-300)';
    });

    // Update KPIs
    const totalPending    = filtered.reduce((s, m) => s + m.count, 0);
    const monthsWithWork  = filtered.filter(m => m.count > 0).length;
    const busiest         = filtered.length ? filtered.reduce((a, b) => b.count > a.count ? b : a, filtered[0]) : null;
    const activeContracts = contracts.filter(c => new Date(c.endDate) >= today).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
    set('fcKpiPending',  totalPending);
    set('fcKpiMonths',   monthsWithWork);
    set('fcKpiBusiest',  busiest && busiest.count > 0
      ? `${busiest.label} <span style="font-size:0.9rem;color:var(--gray-500)">(${busiest.count})</span>`
      : '—');
    set('fcKpiContracts', activeContracts);

    // Update card subtitle
    const sub = document.getElementById('fcCardSub');
    if (sub) sub.textContent = `${totalPending} visit${totalPending !== 1 ? 's' : ''} across ${monthsWithWork} month${monthsWithWork !== 1 ? 's' : ''}`;

    // Re-render table body
    const tbody = document.querySelector('#forecastTable tbody');
    if (tbody) tbody.innerHTML = this._buildRows(filtered);

    // Re-bind accordion on new rows
    this._bindAccordion();
  },

  /* ── BUILD TABLE ROWS ────────────────────────────────────── */
  _buildRows(months) {
    if (!months.length) return `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--gray-400)">No data for selected year</td></tr>`;

    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const maxCount = Math.max(1, ...months.map(m => m.count));

    return months.map(month => {
      const level    = this._workloadLevel(month.count);
      const barColor = level === 'high' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#10B981';
      const barWidth = month.count > 0 ? Math.round((month.count / maxCount) * 100) : 0;
      const rowBg    = level === 'high' ? 'background:#FEF2F2' : level === 'medium' ? 'background:#FFFBEB' : level === 'low' ? 'background:#F0FDF4' : '';

      const statusBadgeHTML = (statusKey) => {
        const map = {
          assigned:  { bg:'#DBEAFE', color:'#1E40AF', label:'Assigned' },
          tentative: { bg:'#FEF9C3', color:'#854D0E', label:'Tentative' },
          ongoing:   { bg:'#FEF3C7', color:'#92400E', label:'On Going' },
          planned:   { bg:'var(--gray-100)', color:'var(--gray-600)', label:'Planned' }
        };
        const s = map[statusKey] || map.planned;
        return `<span style="padding:2px 8px;border-radius:10px;font-size:0.786rem;font-weight:600;background:${s.bg};color:${s.color}">${s.label}</span>`;
      };

      const progressBadgeHTML = (progress, doneCount, total) => {
        const allDone = doneCount >= total;
        const hasSome = doneCount > 0;
        const bg    = allDone ? '#D1FAE5' : hasSome ? '#DBEAFE' : 'var(--gray-100)';
        const color = allDone ? '#065F46' : hasSome ? '#1E40AF' : 'var(--gray-600)';
        return `<span style="padding:2px 8px;border-radius:10px;font-size:0.786rem;font-weight:600;background:${bg};color:${color}">${progress}</span>`;
      };

      const detailRows = month.visits.length === 0
        ? `<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:10px;font-size:0.8rem">No visits scheduled</td></tr>`
        : month.visits.map(v => {
            const isPast = v.scheduledDate < todayStr;
            const doneCount = parseInt((v.progress || '').split('/')[0]) || 0;
            const total     = parseInt((v.progress || '').split('/')[1]) || 0;
            return `<tr>
              <td style="font-size:0.8rem;padding:6px 12px;font-family:monospace;font-weight:600">${Utils.escapeHtml(v.jobNumber)}</td>
              <td style="font-size:0.8rem;padding:6px 12px">${Utils.escapeHtml(v.clientName)}</td>
              <td style="font-size:0.8rem;padding:6px 12px">${Utils.escapeHtml(v.machineName)}</td>
              <td style="font-size:0.8rem;padding:6px 12px;color:${v.district === '—' ? 'var(--gray-400)' : 'inherit'}">${Utils.escapeHtml(v.district)}</td>
              <td style="font-size:0.8rem;padding:6px 12px;font-weight:600">${Utils.escapeHtml(v.visitNumber)}</td>
              <td style="font-size:0.8rem;padding:6px 12px;color:${v.technicianName === '—' ? 'var(--gray-400)' : 'var(--gray-600)'}">${Utils.escapeHtml(v.technicianName)}</td>
              <td style="font-size:0.8rem;padding:6px 12px;${isPast ? 'color:var(--red);font-weight:600' : ''}">${Utils.formatDate(v.scheduledDate)}</td>
              <td style="font-size:0.8rem;padding:6px 12px">${progressBadgeHTML(v.progress, doneCount, total)}</td>
              <td style="font-size:0.8rem;padding:6px 12px">${statusBadgeHTML(v.statusKey)}</td>
            </tr>`;
          }).join('');

      const toggleBtn = month.count > 0
        ? `<button class="btn btn-ghost btn-sm" data-toggle-month="${month.key}" style="display:flex;align-items:center;gap:4px;font-size:0.786rem">
             Details
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" style="transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
           </button>`
        : `<span style="color:var(--gray-400);font-size:0.786rem">—</span>`;

      return `
        <tr style="${rowBg}">
          <td style="font-weight:${month.count > 0 ? '600' : '400'};white-space:nowrap">${month.label}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-weight:700;font-size:1rem;min-width:24px">${month.count}</span>
              <div style="flex:1;background:var(--gray-200);border-radius:4px;height:6px;min-width:80px">
                <div style="width:${barWidth}%;background:${barColor};height:6px;border-radius:4px"></div>
              </div>
            </div>
          </td>
          <td>${this._workloadBadge(level)}</td>
          <td>${toggleBtn}</td>
        </tr>
        <tr class="forecast-detail-row" data-detail-key="${month.key}" style="display:none">
          <td colspan="4" style="padding:0;border-top:none">
            <div style="background:var(--gray-50);border-top:1px solid var(--gray-200);padding:12px 16px">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="font-size:0.75rem;font-weight:600;text-transform:uppercase;color:var(--gray-400);letter-spacing:.05em">
                    <th style="padding:4px 12px;text-align:left">Job No.</th>
                    <th style="padding:4px 12px;text-align:left">Client</th>
                    <th style="padding:4px 12px;text-align:left">Machine</th>
                    <th style="padding:4px 12px;text-align:left">District</th>
                    <th style="padding:4px 12px;text-align:left">Visit #</th>
                    <th style="padding:4px 12px;text-align:left">Technician</th>
                    <th style="padding:4px 12px;text-align:left">Scheduled Date</th>
                    <th style="padding:4px 12px;text-align:left">Progress</th>
                    <th style="padding:4px 12px;text-align:left">Status</th>
                  </tr>
                </thead>
                <tbody>${detailRows}</tbody>
              </table>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  /* ── TEMPLATE ────────────────────────────────────────────── */
  _template(allMonths) {
    const contracts = Storage.getMaintenanceContracts();
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPending    = allMonths.reduce((s, m) => s + m.count, 0);
    const monthsWithWork  = allMonths.filter(m => m.count > 0).length;
    const busiest         = allMonths.reduce((a, b) => b.count > a.count ? b : a, allMonths[0]);
    const activeContracts = contracts.filter(c => new Date(c.endDate) >= today).length;

    // Derive distinct years from the 18-month window
    const years = [...new Set(allMonths.map(m => m.year))].sort();
    const yearBtnStyle = (y) => {
      const active = y === null ? this._selectedYear === null : this._selectedYear === y;
      return `padding:5px 14px;border-radius:6px;border:1px solid;cursor:pointer;font-size:0.8rem;font-weight:600;transition:background 0.15s;
        background:${active ? 'var(--blue)' : 'var(--gray-100)'};
        color:${active ? '#fff' : 'var(--gray-700)'};
        border-color:${active ? 'var(--blue)' : 'var(--gray-300)'}`;
    };

    const yearButtons = [
      `<button data-year-btn="all" style="${yearBtnStyle(null)}">All</button>`,
      ...years.map(y => `<button data-year-btn="${y}" style="${yearBtnStyle(y)}">${y}</button>`)
    ].join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Maintenance Forecast</h1>
          <p class="page-subtitle">Upcoming planned visits across all active maintenance contracts — next 18 months</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-label">Pending Visits</div>
          <div class="kpi-value" id="fcKpiPending">${totalPending}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Months with Work</div>
          <div class="kpi-value" id="fcKpiMonths">${monthsWithWork}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Busiest Month</div>
          <div class="kpi-value" id="fcKpiBusiest" style="font-size:1.1rem">${busiest.count > 0 ? `${busiest.label} <span style="font-size:0.9rem;color:var(--gray-500)">(${busiest.count})</span>` : '—'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Contracts</div>
          <div class="kpi-value" id="fcKpiContracts" style="color:var(--green-dark,#059669)">${activeContracts}</div>
        </div>
      </div>

      <!-- Filter + Legend row -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:0.8rem;font-weight:600;color:var(--gray-500);margin-right:4px">Year:</span>
          ${yearButtons}
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:0.786rem">
          <span style="color:var(--gray-500);font-weight:600">Workload:</span>
          <span style="padding:2px 10px;border-radius:12px;background:#D1FAE5;color:#065F46;font-weight:600">Low (1–2)</span>
          <span style="padding:2px 10px;border-radius:12px;background:#FEF3C7;color:#92400E;font-weight:600">Medium (3–5)</span>
          <span style="padding:2px 10px;border-radius:12px;background:#FEE2E2;color:#991B1B;font-weight:600">High (6+)</span>
        </div>
      </div>

      <!-- Forecast Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">18-Month Forecast</span>
          <span class="text-sm text-muted" id="fcCardSub">${totalPending} visit${totalPending !== 1 ? 's' : ''} across ${monthsWithWork} month${monthsWithWork !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table class="data-table" id="forecastTable">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Scheduled Visits</th>
                  <th>Workload</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>${this._buildRows(allMonths)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ── BIND EVENTS ─────────────────────────────────────────── */
  _bindEvents(allMonths) {
    // Year filter buttons
    document.querySelectorAll('[data-year-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.yearBtn;
        this._setYear(val === 'all' ? null : parseInt(val), allMonths);
      });
    });

    this._bindAccordion();
  },

  _bindAccordion() {
    const tbody = document.querySelector('#forecastTable tbody');
    if (!tbody) return;
    // Remove old listener by replacing the node
    const fresh = tbody.cloneNode(true);
    tbody.parentNode.replaceChild(fresh, tbody);
    fresh.addEventListener('click', e => {
      const btn = e.target.closest('[data-toggle-month]');
      if (!btn) return;
      const key       = btn.dataset.toggleMonth;
      const detailRow = document.querySelector(`[data-detail-key="${key}"]`);
      if (!detailRow) return;
      const isOpen = detailRow.style.display !== 'none';
      detailRow.style.display = isOpen ? 'none' : 'table-row';
      const svg = btn.querySelector('svg');
      if (svg) svg.style.transform = isOpen ? '' : 'rotate(180deg)';

      // Log view action when expanding (not collapsing)
      if (!isOpen) {
        const allMonths = this._buildForecastData();
        const month = allMonths.find(m => m.key === key);
        const jobNumbers = month ? [...new Set(month.visits.map(v => v.jobNumber).filter(j => j && j !== '—'))].join(', ') : '—';
        const actor = appState.currentUser?.name || 'Unknown';
        Storage.logAction({
          action:  'VIEW_FORECAST_DETAILS',
          actor,
          target:  `Forecast: ${key}`,
          details: `Month: ${month?.label || key} | Jobs: ${jobNumbers || '—'} | Visits: ${month?.count || 0}`
        });
      }
    });
  }
};
