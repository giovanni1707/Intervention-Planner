/* ============================================================
   views/maintenance-forecast.js — Maintenance Forecast View
   ============================================================ */

window.Views = window.Views || {};

Views.MaintenanceForecast = {

  /* ── HELPERS ─────────────────────────────────────────────── */

  _buildForecastData() {
    const contracts = Storage.getMaintenanceContracts();
    const clients   = Storage.getClients();
    const machines  = Storage.getMachines();

    const clientMap  = Object.fromEntries(clients.map(c => [c.id, c]));
    const machineMap = Object.fromEntries(machines.map(m => [m.id, m]));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Build 18 month buckets starting from current month
    const buckets = [];
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const yr  = d.getFullYear();
      const mo  = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yr}-${mo}`;
      const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      buckets.push({ key, label, visits: [], count: 0 });
    }

    const bucketMap = Object.fromEntries(buckets.map(b => [b.key, b]));
    const firstKey  = buckets[0].key;
    const lastKey   = buckets[buckets.length - 1].key;

    contracts.forEach(contract => {
      const completed = contract.completedVisits || [];
      (contract.schedule || []).forEach(date => {
        if (completed.includes(date)) return;
        const key = date.substring(0, 7); // "YYYY-MM"
        if (key < firstKey || key > lastKey) return;
        const bucket = bucketMap[key];
        if (!bucket) return;
        bucket.visits.push({
          contractId:   contract.id,
          clientName:   clientMap[contract.clientId]?.name   || '—',
          machineName:  machineMap[contract.machineId]?.model || '—',
          serialNumber: contract.serialNumber || machineMap[contract.machineId]?.serialNumber || '—',
          scheduledDate: date,
          visitsPerYear: contract.visitsPerYear
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

  _workloadBadge(level, count) {
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
    const months  = this._buildForecastData();
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template(months);
    this._bindEvents();
  },

  /* ── TEMPLATE ────────────────────────────────────────────── */
  _template(months) {
    const contracts   = Storage.getMaintenanceContracts();
    const today       = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPending  = months.reduce((s, m) => s + m.count, 0);
    const monthsWithWork = months.filter(m => m.count > 0).length;
    const maxCount      = Math.max(1, ...months.map(m => m.count));
    const busiest       = months.reduce((a, b) => b.count > a.count ? b : a, months[0]);
    const activeContracts = contracts.filter(c => new Date(c.endDate) >= today).length;

    /* ── Table rows ── */
    const rows = months.map(month => {
      const level    = this._workloadLevel(month.count);
      const barColor = level === 'high' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#10B981';
      const barWidth = month.count > 0 ? Math.round((month.count / maxCount) * 100) : 0;
      const rowBg    = level === 'high' ? 'background:#FEF2F2' : level === 'medium' ? 'background:#FFFBEB' : level === 'low' ? 'background:#F0FDF4' : '';

      // Detail rows (client/machine breakdown)
      const detailRows = month.visits.length === 0
        ? `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:10px;font-size:0.8rem">No visits scheduled</td></tr>`
        : month.visits.map(v => {
            const isPast = v.scheduledDate < today.toISOString().split('T')[0];
            return `
              <tr>
                <td style="font-size:0.8rem;padding:6px 12px">${Utils.escapeHtml(v.clientName)}</td>
                <td style="font-size:0.8rem;padding:6px 12px">${Utils.escapeHtml(v.machineName)}</td>
                <td style="font-size:0.8rem;padding:6px 12px;font-family:monospace">${Utils.escapeHtml(v.serialNumber)}</td>
                <td style="font-size:0.8rem;padding:6px 12px;${isPast ? 'color:var(--red)' : ''}">${Utils.formatDate(v.scheduledDate)}</td>
                <td style="font-size:0.8rem;padding:6px 12px;text-align:center">${v.visitsPerYear}×/yr</td>
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
          <td>${this._workloadBadge(level, month.count)}</td>
          <td>${toggleBtn}</td>
        </tr>
        <tr class="forecast-detail-row" data-detail-key="${month.key}" style="display:none">
          <td colspan="4" style="padding:0;border-top:none">
            <div style="background:var(--gray-50);border-top:1px solid var(--gray-200);padding:12px 16px">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="font-size:0.75rem;font-weight:600;text-transform:uppercase;color:var(--gray-400);letter-spacing:.05em">
                    <th style="padding:4px 12px;text-align:left">Client</th>
                    <th style="padding:4px 12px;text-align:left">Machine</th>
                    <th style="padding:4px 12px;text-align:left">Serial</th>
                    <th style="padding:4px 12px;text-align:left">Scheduled Date</th>
                    <th style="padding:4px 12px;text-align:center">Frequency</th>
                  </tr>
                </thead>
                <tbody>${detailRows}</tbody>
              </table>
            </div>
          </td>
        </tr>
      `;
    }).join('');

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
          <div class="kpi-value">${totalPending}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Months with Work</div>
          <div class="kpi-value">${monthsWithWork}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Busiest Month</div>
          <div class="kpi-value" style="font-size:1.1rem">${busiest.count > 0 ? `${busiest.label} <span style="font-size:0.9rem;color:var(--gray-500)">(${busiest.count})</span>` : '—'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Contracts</div>
          <div class="kpi-value" style="color:var(--green-dark,#059669)">${activeContracts}</div>
        </div>
      </div>

      <!-- Legend -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:0.786rem">
        <span style="color:var(--gray-500);font-weight:600">Workload:</span>
        <span style="padding:2px 10px;border-radius:12px;background:#D1FAE5;color:#065F46;font-weight:600">Low (1–2)</span>
        <span style="padding:2px 10px;border-radius:12px;background:#FEF3C7;color:#92400E;font-weight:600">Medium (3–5)</span>
        <span style="padding:2px 10px;border-radius:12px;background:#FEE2E2;color:#991B1B;font-weight:600">High (6+)</span>
      </div>

      <!-- Forecast Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">18-Month Forecast</span>
          <span class="text-sm text-muted">${totalPending} visits across ${monthsWithWork} month${monthsWithWork !== 1 ? 's' : ''}</span>
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
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ── BIND EVENTS ─────────────────────────────────────────── */
  _bindEvents() {
    const tbody = document.querySelector('#forecastTable tbody');
    if (!tbody) return;
    tbody.addEventListener('click', e => {
      const btn = e.target.closest('[data-toggle-month]');
      if (!btn) return;
      const key       = btn.dataset.toggleMonth;
      const detailRow = document.querySelector(`[data-detail-key="${key}"]`);
      if (!detailRow) return;
      const isOpen = detailRow.style.display !== 'none';
      detailRow.style.display = isOpen ? 'none' : 'table-row';
      const svg = btn.querySelector('svg');
      if (svg) svg.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  }
};
