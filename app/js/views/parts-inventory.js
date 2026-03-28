/* ============================================================
   views/parts-inventory.js — Parts & Inventory Catalog
   Aggregates parts across all interventions for a global view.
   ============================================================ */

window.Views = window.Views || {};

Views.PartsInventory = {
  _search:  '',
  _sortKey: 'reference',
  _sortDir: 'asc',
  _page:    1,

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
    this._render();
  },

  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Parts & Inventory</h1>
          <p class="page-subtitle">Aggregated parts usage across all interventions</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" onclick="Views.PartsInventory._exportCsv()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- KPI strip -->
      <div id="partsKpi" class="grid-4" style="margin-bottom:20px"></div>

      <!-- Toolbar -->
      <div class="toolbar" style="margin-bottom:0">
        <div class="toolbar-filters" style="flex-wrap:wrap;gap:8px">
          <div class="search-bar">
            <span class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input type="text" id="partsSearch" class="search-input" placeholder="Search by reference or description…">
          </div>
        </div>
        <span id="partsCount"></span>
      </div>

      <div class="card" style="margin-top:0">
        <div id="partsTableWrap"></div>
      </div>
    `;
  },

  _bindEvents() {
    const search = document.getElementById('partsSearch');
    if (search) search.addEventListener('input', () => {
      this._search = search.value.trim().toLowerCase();
      this._page = 1;
      this._render();
    });
  },

  // Aggregate all parts from all interventions
  _aggregate() {
    const map = new Map(); // key = reference (normalised)

    appState.interventions.forEach(i => {
      const parts = i.parts || [];
      const client  = appState.clients.find(c => c.id === i.clientId);
      const machine = appState.machines.find(m => m.id === i.machineId);

      parts.forEach(p => {
        const key = (p.reference || '').trim().toUpperCase();
        if (!key) return;

        if (!map.has(key)) {
          map.set(key, {
            reference:   (p.reference || '').trim(),
            description: p.description || '',
            unit:        p.unit || 'pcs',
            totalQty:    0,
            usageCount:  0,   // number of interventions it appears in
            lastUsed:    null,
            interventions: []
          });
        }
        const entry = map.get(key);
        entry.totalQty  += Number(p.quantity) || 0;
        entry.usageCount += 1;
        if (!entry.lastUsed || (i.createdAt && i.createdAt > entry.lastUsed)) {
          entry.lastUsed = i.createdAt;
        }
        // Keep description from most recent
        if (p.description && (!entry.description || (i.createdAt && i.createdAt >= entry.lastUsed))) {
          entry.description = p.description;
        }
        entry.interventions.push({
          id:      i.id,
          client:  client?.name || '—',
          machine: machine?.model || '—',
          date:    i.createdAt,
          qty:     Number(p.quantity) || 0
        });
      });
    });

    return [...map.values()];
  },

  _filtered(parts) {
    if (!this._search) return parts;
    return parts.filter(p =>
      p.reference.toLowerCase().includes(this._search) ||
      p.description.toLowerCase().includes(this._search)
    );
  },

  _sorted(parts) {
    return Utils.sortBy(parts, p => {
      if (this._sortKey === 'reference')   return p.reference.toLowerCase();
      if (this._sortKey === 'totalQty')    return p.totalQty;
      if (this._sortKey === 'usageCount')  return p.usageCount;
      if (this._sortKey === 'lastUsed')    return p.lastUsed || '';
      return p[this._sortKey] || '';
    }, this._sortDir);
  },

  _setSort(key) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
    this._page = 1;
    this._render();
  },

  _render() {
    const all      = this._aggregate();
    const filtered = this._filtered(all);
    const sorted   = this._sorted(filtered);
    this._renderKpi(all);
    this._renderTable(sorted);
  },

  _renderKpi(all) {
    const kpi = document.getElementById('partsKpi');
    if (!kpi) return;

    const totalRefs = all.length;
    const totalQty  = all.reduce((s, p) => s + p.totalQty, 0);
    const totalUses = all.reduce((s, p) => s + p.usageCount, 0);
    const topRef    = all.sort((a, b) => b.totalQty - a.totalQty)[0];

    kpi.innerHTML = `
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Unique Parts</div>
        <div class="kpi-value">${totalRefs}</div>
        <div class="kpi-meta">distinct references</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-label">Total Quantity Used</div>
        <div class="kpi-value">${Utils.formatNumber(totalQty)}</div>
        <div class="kpi-meta">units across all jobs</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Total Usage Events</div>
        <div class="kpi-value">${totalUses}</div>
        <div class="kpi-meta">part entries recorded</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label">Most Used Part</div>
        <div class="kpi-value" style="font-size:1rem;word-break:break-all">${topRef ? Utils.escapeHtml(topRef.reference) : '—'}</div>
        <div class="kpi-meta">${topRef ? topRef.totalQty + ' units total' : 'no data'}</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
      </div>
    `;
  },

  _sortIcon(key) {
    if (this._sortKey !== key) return `<span class="sort-icon"><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill="currentColor"/></svg><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill="currentColor"/></svg></span>`;
    return `<span class="sort-icon sort-${this._sortDir}"><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill="currentColor"/></svg><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill="currentColor"/></svg></span>`;
  },

  _renderTable(parts) {
    const wrap    = document.getElementById('partsTableWrap');
    const countEl = document.getElementById('partsCount');
    if (!wrap) return;

    const pageSize = Pagination.getPageSize();
    const page     = this._page;
    const paged    = Pagination.paginate(parts, page, pageSize);

    if (countEl) countEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-50,#EFF6FF);color:var(--primary-700,#1D4ED8);border:1px solid var(--primary-200,#BFDBFE);border-radius:999px;padding:2px 10px;font-size:0.78rem;font-weight:600">${parts.length} <span style="font-weight:400;opacity:.75">part${parts.length !== 1 ? 's' : ''}</span></span>`;

    if (parts.length === 0) {
      wrap.innerHTML = `<div class="table-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg><p class="table-empty-text">${this._search ? 'No parts match your search' : 'No parts recorded yet'}</p></div>`;
      return;
    }

    const thClass = key => `sortable${this._sortKey === key ? ' sort-' + this._sortDir : ''}`;

    const rows = paged.map(p => `
      <tr>
        <td class="td-primary" style="font-family:monospace">${Utils.escapeHtml(p.reference)}</td>
        <td>${Utils.escapeHtml(Utils.truncate(p.description, 60))}</td>
        <td style="text-align:center"><span class="part-unit-tag">${Utils.escapeHtml(p.unit)}</span></td>
        <td style="text-align:right;font-weight:600">${Utils.formatNumber(p.totalQty)}</td>
        <td style="text-align:center">${p.usageCount}</td>
        <td style="white-space:nowrap">${Utils.formatDate(p.lastUsed)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="Views.PartsInventory._openUsageModal('${Utils.escapeHtml(p.reference.replace(/'/g, "\\'"))}')">Usage</button>
        </td>
      </tr>`).join('');

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th class="${thClass('reference')}" onclick="Views.PartsInventory._setSort('reference')">Reference ${this._sortIcon('reference')}</th>
            <th>Description</th>
            <th style="text-align:center">Unit</th>
            <th class="${thClass('totalQty')}" onclick="Views.PartsInventory._setSort('totalQty')" style="text-align:right">Total Qty ${this._sortIcon('totalQty')}</th>
            <th class="${thClass('usageCount')}" onclick="Views.PartsInventory._setSort('usageCount')" style="text-align:center">Usage Events ${this._sortIcon('usageCount')}</th>
            <th class="${thClass('lastUsed')}" onclick="Views.PartsInventory._setSort('lastUsed')">Last Used ${this._sortIcon('lastUsed')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${Pagination.render(parts.length, page, pageSize, p => `Views.PartsInventory._goToPage(${p})`)}
    `;
  },

  _goToPage(p) {
    this._page = p;
    const all      = this._aggregate();
    const filtered = this._filtered(all);
    const sorted   = this._sorted(filtered);
    this._renderTable(sorted);
  },

  _openUsageModal(reference) {
    const all   = this._aggregate();
    const entry = all.find(p => p.reference.toUpperCase() === reference.toUpperCase());
    if (!entry) return;

    const rows = Utils.sortBy(entry.interventions, 'date', 'desc').map(iv => `
      <tr>
        <td>${Utils.escapeHtml(iv.client)}</td>
        <td>${Utils.escapeHtml(iv.machine)}</td>
        <td style="text-align:center;font-weight:600">${iv.qty}</td>
        <td>${Utils.formatDate(iv.date)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="Modals.close();setTimeout(()=>Views.Interventions.openDetailModal('${iv.id}'),80)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </td>
      </tr>`).join('');

    Modals.open(
      `Usage History — ${Utils.escapeHtml(entry.reference)}`,
      `<div style="margin-bottom:12px">
        <span style="font-size:0.857rem;color:var(--gray-500)">${Utils.escapeHtml(entry.description)}</span>
        <span style="margin-left:12px;font-size:0.857rem"><strong>${entry.totalQty}</strong> ${Utils.escapeHtml(entry.unit)} total across <strong>${entry.usageCount}</strong> usage event${entry.usageCount !== 1 ? 's' : ''}</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Client</th><th>Machine</th><th style="text-align:center">Qty</th><th>Date</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--gray-400)">No usage records</td></tr>'}</tbody>
      </table>`,
      []
    );
  },

  _exportCsv() {
    const all      = this._aggregate();
    const filtered = this._filtered(all);
    const sorted   = this._sorted(filtered);

    if (sorted.length === 0) { Toast.show('Nothing to export', 'warning'); return; }

    const rows = sorted.map(p => [
      p.reference,
      p.description,
      p.unit,
      p.totalQty,
      p.usageCount,
      Utils.formatDate(p.lastUsed)
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const header = ['Reference','Description','Unit','Total Qty','Usage Events','Last Used'].map(h => `"${h}"`).join(',');
    const csv    = [header, ...rows].join('\r\n');
    const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `parts_inventory_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`Exported ${sorted.length} part reference${sorted.length !== 1 ? 's' : ''}`, 'success');
  }
};
