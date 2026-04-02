/* ============================================================
   views/store-inventory.js — Store Inventory  (v3)
   Superadmin: import CSV to replace full inventory.
   All roles: read-only table with search, qty filters, sort,
              pagination, stock overview chart, top/least lists.
   ============================================================ */

window.Views = window.Views || {};

Views.StoreInventory = {
  _search:        '',
  _sortKey:       'reference',
  _sortDir:       'asc',
  _page:          1,
  _pendingImport: null,

  // qty filter: { op: 'gt'|'lt'|'eq'|'range'|'', val: number|null, val2: number|null }
  _qtyFilter:     { op: '', val: null, val2: null },

  // ── LOW-STOCK THRESHOLD (items ≤ this are "low") ──────────
  LOW_STOCK_THRESHOLD: 5,

  // ── MOUNT ─────────────────────────────────────────────────

  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._template();
    this._bindEvents();
    this._render();
  },

  // ── TEMPLATE ──────────────────────────────────────────────

  _template() {
    const isSuperAdmin = Auth.isSuperAdmin();
    const meta         = appState.storeInventoryMeta;
    const outdated     = this._isOutdated(meta);

    const lastUpdatedBanner = meta
      ? `<div class="si-last-updated ${outdated ? 'si-last-updated-warn' : ''}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
             <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
           </svg>
           Last updated on <strong>${Utils.formatDateTime(meta.lastImportedAt)}</strong>
           by ${Utils.escapeHtml(meta.importedBy || '—')}
           &nbsp;·&nbsp; ${meta.itemCount || 0} item${meta.itemCount !== 1 ? 's' : ''}
           ${outdated ? `<span class="si-outdated-badge">Outdated</span>` : ''}
         </div>`
      : `<div class="si-last-updated si-last-updated-warn">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
             <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
           </svg>
           No inventory data has been imported yet.
           ${isSuperAdmin ? 'Use the Import CSV button to load stock.' : 'Please contact a Head Administrator.'}
         </div>`;

    const importBtn = isSuperAdmin
      ? `<button class="btn btn-primary btn-sm" id="siImportBtn">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
           Import CSV
         </button>`
      : '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Store Inventory</h1>
          <p class="page-subtitle">Stock levels imported from the warehouse management system</p>
        </div>
        <div class="page-actions">${importBtn}</div>
      </div>

      ${lastUpdatedBanner}

      <!-- KPI strip -->
      <div id="siKpi" class="grid-4" style="margin-bottom:20px"></div>

      <!-- Stock Overview Charts -->
      <div id="siCharts" class="grid-3" style="margin-bottom:20px"></div>

      <!-- Toolbar -->
      <div class="toolbar" style="margin-bottom:0">
        <div class="toolbar-filters" style="flex-wrap:wrap;gap:8px">
          <div class="search-bar">
            <span class="search-bar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="siSearch" class="search-input" placeholder="Search by reference or description…">
          </div>

          <!-- Quantity filter -->
          <div class="si-qty-filter-group">
            <select id="siQtyOp" class="form-select" style="width:auto;min-width:130px;font-size:0.82rem;padding:6px 10px">
              <option value="">All Quantities</option>
              <option value="gt">Qty &gt;</option>
              <option value="lt">Qty &lt;</option>
              <option value="eq">Qty =</option>
              <option value="range">Qty between</option>
            </select>
            <input type="number" id="siQtyVal" class="form-input si-qty-input" min="0" placeholder="Min"
              style="display:none;width:80px;font-size:0.82rem;padding:6px 10px">
            <span id="siQtyRangeSep" style="display:none;font-size:0.82rem;color:var(--gray-500);white-space:nowrap">–</span>
            <input type="number" id="siQtyVal2" class="form-input si-qty-input" min="0" placeholder="Max"
              style="display:none;width:80px;font-size:0.82rem;padding:6px 10px">
          </div>

          <!-- Quick-filter chips -->
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <button class="si-chip" id="siChipOut" onclick="Views.StoreInventory._quickFilter('out')">
              <span class="si-chip-dot si-chip-dot-red"></span>Out of Stock
            </button>
            <button class="si-chip" id="siChipLow" onclick="Views.StoreInventory._quickFilter('low')">
              <span class="si-chip-dot si-chip-dot-orange"></span>Low Stock
            </button>
            <button class="si-chip" id="siChipAll" onclick="Views.StoreInventory._quickFilter('all')">
              All
            </button>
          </div>

          <!-- Clear Filters -->
          <button class="btn btn-ghost btn-sm" id="siClearBtn" onclick="Views.StoreInventory._clearFilters()"
            style="display:none;gap:5px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear Filters
          </button>
        </div>
        <span id="siCount"></span>
      </div>

      <div class="card" style="margin-top:0">
        <div id="siTableWrap"></div>
      </div>

      <!-- Hidden file input for CSV upload -->
      <input type="file" id="siFileInput" accept=".csv,text/csv" style="display:none">
    `;
  },

  // ── EVENTS ────────────────────────────────────────────────

  _bindEvents() {
    const search = document.getElementById('siSearch');
    if (search) search.addEventListener('input', () => {
      this._search = search.value.trim().toLowerCase();
      this._page   = 1;
      this._updateClearBtn();
      this._render();
    });

    const qtyOp   = document.getElementById('siQtyOp');
    const qtyVal  = document.getElementById('siQtyVal');
    const qtyVal2 = document.getElementById('siQtyVal2');
    const qtyRangeSep = document.getElementById('siQtyRangeSep');

    const syncQtyVisibility = () => {
      const op = qtyOp.value;
      const isRange = op === 'range';
      qtyVal.style.display       = op ? '' : 'none';
      qtyRangeSep.style.display  = isRange ? '' : 'none';
      qtyVal2.style.display      = isRange ? '' : 'none';
      if (!isRange) { qtyVal2.value = ''; this._qtyFilter.val2 = null; }
    };

    if (qtyOp) qtyOp.addEventListener('change', () => {
      const op = qtyOp.value;
      if (!op) {
        qtyVal.value  = '';
        qtyVal2.value = '';
        this._qtyFilter = { op: '', val: null, val2: null };
      } else {
        this._qtyFilter.op = op;
      }
      syncQtyVisibility();
      this._page = 1;
      this._updateClearBtn();
      this._render();
    });

    if (qtyVal) qtyVal.addEventListener('input', () => {
      const v = parseFloat(qtyVal.value);
      this._qtyFilter.val = isNaN(v) ? null : v;
      this._page = 1;
      this._updateClearBtn();
      this._render();
    });

    if (qtyVal2) qtyVal2.addEventListener('input', () => {
      const v = parseFloat(qtyVal2.value);
      this._qtyFilter.val2 = isNaN(v) ? null : v;
      this._page = 1;
      this._render();
    });

    const importBtn = document.getElementById('siImportBtn');
    if (importBtn) importBtn.addEventListener('click', () => this._triggerImport());

    const fileInput = document.getElementById('siFileInput');
    if (fileInput) fileInput.addEventListener('change', e => this._onFileSelected(e));
  },

  // ── QUICK FILTER CHIPS ────────────────────────────────────

  _activeChip: 'all',

  _quickFilter(chip) {
    this._activeChip = chip;
    this._page = 1;
    ['siChipAll', 'siChipLow', 'siChipOut'].forEach(id => {
      document.getElementById(id)?.classList.remove('si-chip-active');
    });
    const idMap = { all: 'siChipAll', low: 'siChipLow', out: 'siChipOut' };
    document.getElementById(idMap[chip])?.classList.add('si-chip-active');
    this._updateClearBtn();
    this._render();
  },

  _updateClearBtn() {
    const active = this._search || this._qtyFilter.op || this._activeChip !== 'all';
    const btn = document.getElementById('siClearBtn');
    if (btn) btn.style.display = active ? '' : 'none';
  },

  // ── IMPORT FLOW ───────────────────────────────────────────

  _triggerImport() {
    Modals.open(
      'Import Inventory CSV',
      `<div style="margin-bottom:12px">
        <p style="font-size:0.875rem;color:var(--gray-600);margin-bottom:12px">
          Importing a new CSV will <strong>replace all existing inventory data</strong>. The stock list will be updated immediately for all users.
        </p>
        <div class="si-csv-format">
          <div class="si-csv-format-title">Expected CSV format</div>
          <code class="si-csv-code">reference,description,quantity,unit
REF-001,Vacuum Pump Belt,12,pcs
REF-002,Sealing Bar Element,5,m</code>
          <p style="font-size:0.78rem;color:var(--gray-500);margin-top:8px">
            Column order is auto-detected from the header row. Columns <em>reference</em> and <em>quantity</em> are required. <em>description</em> and <em>unit</em> are optional.
          </p>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
       <button class="btn btn-primary" onclick="Views.StoreInventory._pickFile()">Choose CSV File…</button>`
    );
  },

  _pickFile() {
    const fi = document.getElementById('siFileInput');
    if (fi) { fi.value = ''; fi.click(); }
    Modals.close();
  },

  async _onFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    let text;
    try { text = await file.text(); }
    catch { Toast.error('Could not read file.'); return; }

    const { items, errors } = this._parseCSV(text);

    if (errors.length && items.length === 0) {
      Toast.error(`CSV parse failed: ${errors[0]}`);
      return;
    }

    const user = Auth.getCurrentUser();
    this._pendingImport = { items, importedBy: user?.name || 'Superadmin', count: items.length };

    Modals.open(
      'Confirm Import',
      `<p style="font-size:0.875rem;color:var(--gray-700)">
        Parsed <strong>${items.length} item${items.length !== 1 ? 's' : ''}</strong> from <em>${Utils.escapeHtml(file.name)}</em>.
        ${errors.length ? `<br><span style="color:#D97706">${errors.length} row${errors.length !== 1 ? 's' : ''} skipped (missing reference or quantity).</span>` : ''}
        <br><br>This will <strong>replace</strong> the entire existing inventory. Are you sure?
       </p>`,
      `<button class="btn btn-ghost" onclick="Modals.close()">Cancel</button>
       <button class="btn btn-primary" id="siConfirmImportBtn" onclick="Views.StoreInventory._confirmImport()">Import Now</button>`
    );
  },

  async _confirmImport() {
    const pending = this._pendingImport;
    if (!pending) return;
    await Utils.withButtonLock(async () => {
      await Storage.replaceStoreInventory(pending.items, pending.importedBy);
      this._pendingImport = null;
      Modals.close();
      Toast.success(`Inventory updated — ${pending.count} item${pending.count !== 1 ? 's' : ''} imported.`);
    }, '#siConfirmImportBtn');
  },

  // ── CSV PARSER ────────────────────────────────────────────

  _parseCSV(text) {
    const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) return { items: [], errors: ['File has no data rows.'] };

    const header = this._splitCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));

    const colRef  = header.findIndex(h => h.includes('ref') || h.includes('code') || h.includes('part'));
    const colDesc = header.findIndex(h => h.includes('desc') || h.includes('name') || h.includes('label'));
    const colQty  = header.findIndex(h => h.includes('qty') || h.includes('quant') || h.includes('stock'));
    const colUnit = header.findIndex(h => h.includes('unit') || h.includes('uom'));

    if (colRef === -1 || colQty === -1) {
      return { items: [], errors: ['Could not detect required columns (reference, quantity). Check header row.'] };
    }

    const items = [], errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = this._splitCSVRow(lines[i]);
      const ref  = (cols[colRef]  || '').trim();
      const qty  = parseFloat((cols[colQty] || '').trim());

      if (!ref || isNaN(qty)) {
        errors.push(`Row ${i + 1}: missing reference or invalid quantity`);
        continue;
      }
      items.push({
        reference:   ref,
        description: colDesc >= 0 ? (cols[colDesc] || '').trim() : '',
        quantity:    qty,
        unit:        colUnit >= 0 ? (cols[colUnit] || '').trim() || 'pcs' : 'pcs'
      });
    }
    return { items, errors };
  },

  _splitCSVRow(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        result.push(cur); cur = '';
      } else { cur += ch; }
    }
    result.push(cur);
    return result;
  },

  // ── HELPERS ───────────────────────────────────────────────

  _isOutdated(meta) {
    if (!meta || !meta.lastImportedAt) return true;
    return (Date.now() - new Date(meta.lastImportedAt).getTime()) > 3 * 24 * 3600000;
  },

  // ── FILTER PIPELINE ───────────────────────────────────────

  _filtered(items) {
    let result = items;

    // Text search
    if (this._search) {
      result = result.filter(p =>
        (p.reference   || '').toLowerCase().includes(this._search) ||
        (p.description || '').toLowerCase().includes(this._search)
      );
    }

    // Quick chip filter
    if (this._activeChip === 'out') {
      result = result.filter(p => (p.quantity ?? 0) === 0);
    } else if (this._activeChip === 'low') {
      result = result.filter(p => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= this.LOW_STOCK_THRESHOLD);
    }

    // Qty operator filter
    const { op, val, val2 } = this._qtyFilter;
    if (op && val !== null) {
      if (op === 'gt')    result = result.filter(p => (p.quantity ?? 0) >   val);
      if (op === 'lt')    result = result.filter(p => (p.quantity ?? 0) <   val);
      if (op === 'eq')    result = result.filter(p => (p.quantity ?? 0) === val);
      if (op === 'range' && val2 !== null) {
        const lo = Math.min(val, val2);
        const hi = Math.max(val, val2);
        result = result.filter(p => { const q = p.quantity ?? 0; return q >= lo && q <= hi; });
      }
    }

    return result;
  },

  _sorted(items) {
    return Utils.sortBy(items, p => {
      if (this._sortKey === 'reference')   return (p.reference   || '').toLowerCase();
      if (this._sortKey === 'description') return (p.description || '').toLowerCase();
      if (this._sortKey === 'quantity')    return p.quantity ?? 0;
      if (this._sortKey === 'unit')        return (p.unit        || '').toLowerCase();
      return (p[this._sortKey] || '');
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

  // ── RENDER ORCHESTRATOR ───────────────────────────────────

  _render() {
    const allItems = appState.storeInventory || [];
    const filtered = this._filtered(allItems);
    const sorted   = this._sorted(filtered);
    this._renderKpi(allItems);
    this._renderCharts(allItems);
    this._renderTable(sorted);
    // Keep the active chip highlighted after re-render
    const idMap = { all: 'siChipAll', low: 'siChipLow', out: 'siChipOut' };
    document.getElementById(idMap[this._activeChip])?.classList.add('si-chip-active');
    this._updateClearBtn();
  },

  // ── KPI CARDS ─────────────────────────────────────────────

  _renderKpi(items) {
    const kpi = document.getElementById('siKpi');
    if (!kpi) return;

    const T   = this.LOW_STOCK_THRESHOLD;
    const total    = items.length;
    const totalQty = items.reduce((s, p) => s + (p.quantity || 0), 0);
    const low      = items.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= T).length;
    const out      = items.filter(p => (p.quantity || 0) === 0).length;

    kpi.innerHTML = `
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Total References</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-meta">distinct items in store</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Total Stock Units</div>
        <div class="kpi-value">${Utils.formatNumber(totalQty)}</div>
        <div class="kpi-meta">units across all references</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-label">Low Stock</div>
        <div class="kpi-value">${low}</div>
        <div class="kpi-meta">items with 1–${T} units</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-label">Out of Stock</div>
        <div class="kpi-value">${out}</div>
        <div class="kpi-meta">items with 0 units</div>
        <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
      </div>
    `;
  },

  // ── CHARTS ────────────────────────────────────────────────

  _renderCharts(items) {
    const wrap = document.getElementById('siCharts');
    if (!wrap) return;

    if (items.length === 0) {
      wrap.innerHTML = '';
      return;
    }

    const T = this.LOW_STOCK_THRESHOLD;
    const out      = items.filter(p => (p.quantity || 0) === 0);
    const low      = items.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= T);
    const sufficient = items.filter(p => (p.quantity || 0) > T);

    // ── Panel 1: Stock distribution bar ──────────────────────
    const total = items.length || 1;
    const pctOut = (out.length / total * 100).toFixed(1);
    const pctLow = (low.length / total * 100).toFixed(1);
    const pctOk  = (sufficient.length / total * 100).toFixed(1);

    const distChart = `
      <div class="si-chart-card">
        <div class="si-chart-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          Stock Distribution
        </div>
        <div class="si-dist-bar">
          ${sufficient.length ? `<div class="si-dist-seg si-dist-ok"   style="flex:${sufficient.length}" title="Sufficient: ${sufficient.length}"></div>` : ''}
          ${low.length        ? `<div class="si-dist-seg si-dist-low"  style="flex:${low.length}"        title="Low Stock: ${low.length}"></div>` : ''}
          ${out.length        ? `<div class="si-dist-seg si-dist-out"  style="flex:${out.length}"        title="Out of Stock: ${out.length}"></div>` : ''}
        </div>
        <div class="si-dist-legend">
          <span class="si-legend-item">
            <span class="si-legend-dot" style="background:#10B981"></span>
            Sufficient <strong>${sufficient.length}</strong> <span class="si-legend-pct">(${pctOk}%)</span>
          </span>
          <span class="si-legend-item">
            <span class="si-legend-dot" style="background:#F59E0B"></span>
            Low Stock <strong>${low.length}</strong> <span class="si-legend-pct">(${pctLow}%)</span>
          </span>
          <span class="si-legend-item">
            <span class="si-legend-dot" style="background:#EF4444"></span>
            Out of Stock <strong>${out.length}</strong> <span class="si-legend-pct">(${pctOk === '100.0' ? '0.0' : pctOut}%)</span>
          </span>
        </div>
      </div>`;

    // ── Panel 2: Top 5 highest stock ─────────────────────────
    const top5 = [...items].sort((a, b) => (b.quantity || 0) - (a.quantity || 0)).slice(0, 5);
    const maxTop = top5[0]?.quantity || 1;

    const topChart = `
      <div class="si-chart-card">
        <div class="si-chart-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          Top 5 Highest Stock
        </div>
        <div class="si-bar-list">
          ${top5.map(p => {
            const pct = Math.round((p.quantity || 0) / maxTop * 100);
            return `
              <div class="si-bar-row">
                <div class="si-bar-label" title="${Utils.escapeHtml(p.reference)}">${Utils.escapeHtml((p.reference || '').length > 18 ? p.reference.slice(0, 18) + '…' : p.reference)}</div>
                <div class="si-bar-track">
                  <div class="si-bar-fill si-bar-fill-green" style="width:${pct}%"></div>
                </div>
                <div class="si-bar-val">${Utils.formatNumber(p.quantity || 0)}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;

    // ── Panel 3: Top 5 lowest stock (excluding zero) ──────────
    const low5 = [...items]
      .filter(p => (p.quantity || 0) > 0)
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      .slice(0, 5);
    const maxLow = low5.length ? (low5[low5.length - 1]?.quantity || 1) : 1;

    const lowChart = `
      <div class="si-chart-card">
        <div class="si-chart-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
          Top 5 Lowest Stock
          <span style="font-size:0.7rem;font-weight:400;color:var(--gray-400)">(excl. zero)</span>
        </div>
        ${low5.length === 0
          ? '<p style="font-size:0.82rem;color:var(--gray-400);padding:12px 0">No items with stock > 0</p>'
          : `<div class="si-bar-list">
              ${low5.map(p => {
                const qty = p.quantity || 0;
                const pct = Math.round(qty / maxLow * 100);
                const isLow = qty <= T;
                return `
                  <div class="si-bar-row">
                    <div class="si-bar-label" title="${Utils.escapeHtml(p.reference)}">${Utils.escapeHtml((p.reference || '').length > 18 ? p.reference.slice(0, 18) + '…' : p.reference)}</div>
                    <div class="si-bar-track">
                      <div class="si-bar-fill ${isLow ? 'si-bar-fill-orange' : 'si-bar-fill-green'}" style="width:${Math.max(pct, 4)}%"></div>
                    </div>
                    <div class="si-bar-val ${isLow ? 'si-bar-val-warn' : ''}">${Utils.formatNumber(qty)}</div>
                  </div>`;
              }).join('')}
            </div>`
        }
      </div>`;

    wrap.innerHTML = distChart + topChart + lowChart;
  },

  // ── TABLE ─────────────────────────────────────────────────

  _sortIcon(key) {
    if (this._sortKey !== key) return `<span class="sort-icon"><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill="currentColor"/></svg><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill="currentColor"/></svg></span>`;
    return `<span class="sort-icon sort-${this._sortDir}"><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill="currentColor"/></svg><svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill="currentColor"/></svg></span>`;
  },

  _renderTable(items) {
    const wrap    = document.getElementById('siTableWrap');
    const countEl = document.getElementById('siCount');
    if (!wrap) return;

    const pageSize = Pagination.getPageSize();
    const paged    = Pagination.paginate(items, this._page, pageSize);
    const T        = this.LOW_STOCK_THRESHOLD;

    if (countEl) countEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-50,#EFF6FF);color:var(--primary-700,#1D4ED8);border:1px solid var(--primary-200,#BFDBFE);border-radius:999px;padding:2px 10px;font-size:0.78rem;font-weight:600">${items.length} <span style="font-weight:400;opacity:.75">item${items.length !== 1 ? 's' : ''}</span></span>`;

    if (items.length === 0) {
      const hasData = (appState.storeInventory || []).length > 0;
      const isFiltered = this._search || this._qtyFilter.op || this._activeChip !== 'all';
      wrap.innerHTML = `
        <div class="table-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          </svg>
          <p class="table-empty-text">${isFiltered ? 'No items match your filters' : (hasData ? 'No items' : 'Inventory is empty — import a CSV to get started')}</p>
        </div>`;
      return;
    }

    const thClass = key => `sortable${this._sortKey === key ? ' sort-' + this._sortDir : ''}`;

    const rows = paged.map(p => {
      const qty      = p.quantity ?? 0;
      const isOut    = qty === 0;
      const isLow    = qty > 0 && qty <= T;
      const qtyClass = isOut ? 'si-qty-zero' : isLow ? 'si-qty-low' : 'si-qty-ok';
      const rowClass = isOut ? 'si-row-out' : isLow ? 'si-row-low' : '';

      const stockBadge = isOut
        ? `<span class="si-stock-badge si-stock-badge-out">Out of Stock</span>`
        : isLow
          ? `<span class="si-stock-badge si-stock-badge-low">Low Stock</span>`
          : '';

      return `
        <tr class="${rowClass}">
          <td class="td-primary" style="font-family:monospace">${Utils.escapeHtml(p.reference || '—')}</td>
          <td>${Utils.escapeHtml(Utils.truncate ? Utils.truncate(p.description || '', 70) : (p.description || '—'))}</td>
          <td style="text-align:right;white-space:nowrap">
            <span class="si-qty-badge ${qtyClass}">${Utils.formatNumber(qty)}</span>
            ${stockBadge}
          </td>
          <td style="text-align:center"><span class="part-unit-tag">${Utils.escapeHtml(p.unit || 'pcs')}</span></td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th class="${thClass('reference')}"    onclick="Views.StoreInventory._setSort('reference')">Reference ${this._sortIcon('reference')}</th>
            <th class="${thClass('description')}"  onclick="Views.StoreInventory._setSort('description')">Description ${this._sortIcon('description')}</th>
            <th class="${thClass('quantity')}"     onclick="Views.StoreInventory._setSort('quantity')" style="text-align:right">Quantity ${this._sortIcon('quantity')}</th>
            <th style="text-align:center">Unit</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${Pagination.render(items.length, this._page, pageSize, p => `Views.StoreInventory._goToPage(${p})`)}
    `;
  },

  _goToPage(p) {
    this._page = p;
    const items    = appState.storeInventory || [];
    const filtered = this._filtered(items);
    const sorted   = this._sorted(filtered);
    this._renderTable(sorted);
  },

  _clearFilters() {
    this._search     = '';
    this._qtyFilter  = { op: '', val: null, val2: null };
    this._activeChip = 'all';
    this._page       = 1;

    const s = document.getElementById('siSearch');
    if (s) s.value = '';
    const op = document.getElementById('siQtyOp');
    if (op) op.value = '';
    const v = document.getElementById('siQtyVal');
    if (v) { v.value = ''; v.style.display = 'none'; }
    const v2 = document.getElementById('siQtyVal2');
    if (v2) { v2.value = ''; v2.style.display = 'none'; }
    const sep = document.getElementById('siQtyRangeSep');
    if (sep) sep.style.display = 'none';
    const clearBtn = document.getElementById('siClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    this._render();
  }
};
