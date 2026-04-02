/* ============================================================
   views/equipment-history.js — Equipment History
   Complete lifecycle dossier for a machine by serial number.
   Read-only. Available to all roles.
   ============================================================ */

window.Views = window.Views || {};

Views.EquipmentHistory = {

  _serial:      '',
  _report:      null,   // built aggregated report object
  _yearFilter:  'all',
  _typeFilter:  'all',
  _suggestions: [],

  // ── MOUNT ─────────────────────────────────────────────────
  mount() {
    const content = document.getElementById('mainContent');
    content.innerHTML = this._templateShell();
    this._buildSuggestions();
    this._bindShellEvents();
    // If we already have a serial loaded (e.g. re-render), rebuild
    if (this._serial && this._report) {
      this._renderReport();
    }
  },

  // ── BUILD AUTOCOMPLETE LIST ────────────────────────────────
  _buildSuggestions() {
    const serials = new Set();
    // From live machines
    (appState.machines || []).forEach(m => {
      if (m.serialNumber) serials.add(m.serialNumber.trim());
    });
    // From interventions (snapshot may have a serialNumber)
    (appState.interventions || []).forEach(i => {
      if (i.serialNumber) serials.add(i.serialNumber.trim());
    });
    this._suggestions = [...serials].sort();
  },

  // ── SHELL TEMPLATE (search screen) ────────────────────────
  _templateShell() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22" style="vertical-align:-4px;margin-right:8px">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Equipment History
          </h1>
          <p class="page-subtitle">Full lifecycle dossier for any machine by serial number</p>
        </div>
      </div>

      <div class="eh-search-wrap">
        <div class="eh-search-card">
          <div class="eh-search-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h2 class="eh-search-heading">Search Equipment</h2>
          <p class="eh-search-sub">Enter a serial number to generate the full equipment history report</p>
          <form id="ehSearchForm" class="eh-search-form" autocomplete="off">
            <div class="eh-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="eh-input-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="ehSerialInput" class="eh-serial-input" placeholder="e.g. SN-1001" autocomplete="off" list="ehSerialList">
              <datalist id="ehSerialList"></datalist>
            </div>
            <button type="submit" class="btn btn-primary" id="ehSearchBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Generate Report
            </button>
          </form>
        </div>
      </div>

      <div id="ehReportArea"></div>
    `;
  },

  // ── BIND SHELL EVENTS ─────────────────────────────────────
  _bindShellEvents() {
    // Populate datalist
    const dl = document.getElementById('ehSerialList');
    if (dl) {
      dl.innerHTML = this._suggestions.map(s => `<option value="${Utils.escapeHtml(s)}">`).join('');
    }

    // Pre-fill input if we had a previous search
    const input = document.getElementById('ehSerialInput');
    if (input && this._serial) input.value = this._serial;

    const form = document.getElementById('ehSearchForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const val = (document.getElementById('ehSerialInput')?.value || '').trim();
        if (!val) { Toast.error('Please enter a serial number.'); return; }
        this._serial = val;
        this._report = null;
        this._buildReport(val);
      });
    }
  },

  // ── BUILD REPORT (aggregate all sources) ──────────────────
  async _buildReport(serial) {
    const reportArea = document.getElementById('ehReportArea');
    if (!reportArea) return;

    reportArea.innerHTML = `
      <div class="eh-loading">
        <div class="eh-spinner"></div>
        <p>Building equipment report…</p>
      </div>`;

    try {
      const sn = serial.trim().toLowerCase();

      // 1. Find matching machine(s) in appState
      const machine = (appState.machines || []).find(
        m => (m.serialNumber || '').trim().toLowerCase() === sn
      );

      // 2. Live interventions for this serial
      const liveInterventions = (appState.interventions || []).filter(
        i => (i.serialNumber || '').trim().toLowerCase() === sn
           || (machine && i.machineId === machine.id)
      );

      // 3. Fetch deleted jobs for this serial from Firestore
      let deletedJobs = [];
      try {
        const delSnap = await db.collection(COL.DELETED_JOBS)
          .orderBy('deletedAt', 'desc').get();
        deletedJobs = delSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => (r.serialNumber || '').trim().toLowerCase() === sn);
      } catch (_) { /* permission or index error — skip silently */ }

      // 4. Fetch cancelled jobs for this serial from Firestore
      let cancelledJobs = [];
      try {
        const canSnap = await db.collection(COL.CANCELLED_JOBS)
          .orderBy('cancelledAt', 'desc').get();
        cancelledJobs = canSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => (r.serialNumber || '').trim().toLowerCase() === sn);
      } catch (_) { /* skip silently */ }

      // 5. PMC maintenance contracts for this machine
      const pmcContracts = machine
        ? (appState.maintenanceContracts || []).filter(c => c.machineId === machine.id)
        : [];

      // Resolve client
      const client = machine
        ? (appState.clients || []).find(c => c.id === machine.clientId) || null
        : null;

      // Build report object
      this._report = {
        serial,
        machine:       machine || null,
        client:        client  || null,
        interventions: liveInterventions,
        pmcContracts,
        deletedJobs,
        cancelledJobs
      };

      this._yearFilter = 'all';
      this._typeFilter = 'all';
      this._renderReport();

    } catch (err) {
      console.error('[EquipmentHistory] build error:', err);
      reportArea.innerHTML = `
        <div class="eh-error-card">
          <p>Failed to load report: ${Utils.escapeHtml(err.message)}</p>
        </div>`;
    }
  },

  // ── RENDER REPORT ─────────────────────────────────────────
  _renderReport() {
    const reportArea = document.getElementById('ehReportArea');
    if (!reportArea || !this._report) return;

    const r = this._report;
    const allEvents = this._buildTimeline(r);
    const filtered  = this._filterEvents(allEvents);
    const years     = [...new Set(allEvents.map(e => new Date(e.date).getFullYear()).filter(Boolean))].sort((a,b) => b-a);

    reportArea.innerHTML = `
      ${this._renderOverview(r)}
      ${this._renderInsights(r, allEvents)}
      ${this._renderFilters(years)}
      ${this._renderTimeline(filtered)}
      ${this._renderPMCSection(r)}
      ${this._renderIssuesSection(r)}
      ${this._renderDeletedCancelledSection(r)}
      ${this._renderPrintBar()}
    `;

    this._bindReportEvents();
  },

  // ── TIMELINE BUILDER ──────────────────────────────────────
  _buildTimeline(r) {
    const events = [];

    // Machine registration
    if (r.machine?.registeredAt || r.machine?.createdAt) {
      events.push({
        date:    r.machine.registeredAt || r.machine.createdAt,
        type:    'registered',
        status:  'info',
        title:   'Machine Registered',
        desc:    `Serial ${r.serial} first recorded in the system.`,
        icon:    'registered',
        source:  'machine'
      });
    }

    // Live interventions
    (r.interventions || []).forEach(i => {
      const typeCfg  = this._typeConfig(i.type);
      const pmcLink  = r.pmcContracts.find(c => c.id === i.maintenanceContractId);
      const covered  = pmcLink ? this._isDateCoveredByPMC(i.createdAt || i.scheduledDate, pmcLink) : false;
      const coverBadge = covered ? 'covered' : (r.pmcContracts.length > 0 ? 'outside' : null);

      events.push({
        date:      i.createdAt || i.scheduledDate || '',
        type:      i.type || 'other',
        status:    i.status || 'new',
        title:     CONFIG.INTERVENTION_TYPES[i.type] || i.type || 'Intervention',
        jobNumber: i.jobNumber || i.machineId || '',
        desc:      i.description || '—',
        tech:      this._resolveTech(i),
        pmcBadge:  coverBadge,
        pause:     i.pause || null,
        icon:      typeCfg.icon,
        source:    'intervention',
        id:        i.id
      });
    });

    // Deleted jobs (appear as ghost events)
    (r.deletedJobs || []).forEach(d => {
      events.push({
        date:     d.createdAt || d.deletedAt || '',
        type:     d.type || 'other',
        status:   'deleted',
        title:    CONFIG.INTERVENTION_TYPES[d.type] || d.type || 'Intervention',
        jobNumber: d.jobNumber || '',
        desc:     d.reason ? `Deleted — ${d.reason}` : 'Deleted',
        tech:     d.deletedBy || '—',
        icon:     'deleted',
        source:   'deleted',
        deletedAt: d.deletedAt,
        deletedBy: d.deletedBy || '—',
        reason:   d.reason || '—'
      });
    });

    // Cancelled jobs
    (r.cancelledJobs || []).forEach(c => {
      events.push({
        date:      c.createdAt || c.cancelledAt || '',
        type:      c.type || 'other',
        status:    'cancelled',
        title:     CONFIG.INTERVENTION_TYPES[c.type] || c.type || 'Intervention',
        jobNumber: c.jobNumber || '',
        desc:      c.reason ? `Cancelled — ${c.reason}` : 'Cancelled',
        tech:      c.cancelledBy || '—',
        icon:      'cancelled',
        source:    'cancelled',
        cancelledAt: c.cancelledAt,
        cancelledBy: c.cancelledBy || '—',
        reason:    c.reason || '—'
      });
    });

    // Sort chronologically (oldest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
  },

  // ── FILTER EVENTS ─────────────────────────────────────────
  _filterEvents(events) {
    return events.filter(e => {
      if (this._yearFilter !== 'all') {
        const yr = new Date(e.date).getFullYear();
        if (yr !== parseInt(this._yearFilter)) return false;
      }
      if (this._typeFilter !== 'all') {
        if (this._typeFilter === 'pmc'       && e.type !== 'pmc')       return false;
        if (this._typeFilter === 'breakdown' && e.type !== 'breakdown') return false;
        if (this._typeFilter === 'deleted'   && e.source !== 'deleted') return false;
        if (this._typeFilter === 'cancelled' && e.source !== 'cancelled') return false;
      }
      return true;
    });
  },

  // ── RENDER: EQUIPMENT OVERVIEW HEADER ─────────────────────
  _renderOverview(r) {
    const m = r.machine;
    const c = r.client;

    const notFound = !m && !r.interventions.length && !r.deletedJobs.length && !r.cancelledJobs.length;
    if (notFound) {
      return `
        <div class="eh-not-found">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h3>No records found</h3>
          <p>No machine, intervention, or archived record matches serial number <strong>${Utils.escapeHtml(r.serial)}</strong>.</p>
        </div>`;
    }

    const statusLabel = this._machineStatusLabel(m, r);
    const firstDate   = m?.registeredAt || m?.createdAt
      || r.interventions.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))[0]?.createdAt;

    return `
      <div class="eh-overview-card">
        <div class="eh-overview-left">
          <div class="eh-overview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="eh-overview-info">
            <div class="eh-overview-serial">${Utils.escapeHtml(r.serial)}</div>
            <div class="eh-overview-model">${m ? Utils.escapeHtml(m.model || m.name || '—') : '<em style="opacity:.6">Not in active machines</em>'}</div>
            ${c ? `<div class="eh-overview-client">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              ${Utils.escapeHtml(c.name || c.companyName || '—')}
            </div>` : ''}
            ${m?.locationAddress ? `<div class="eh-overview-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${Utils.escapeHtml(m.locationAddress)}
            </div>` : ''}
          </div>
        </div>
        <div class="eh-overview-right">
          <div class="eh-overview-meta-row">
            <span class="eh-meta-label">First recorded</span>
            <span class="eh-meta-val">${Utils.formatDate(firstDate)}</span>
          </div>
          <div class="eh-overview-meta-row">
            <span class="eh-meta-label">Status</span>
            <span>${statusLabel}</span>
          </div>
          ${m?.jobNumber ? `<div class="eh-overview-meta-row">
            <span class="eh-meta-label">Job #</span>
            <span class="eh-meta-val">${Utils.escapeHtml(m.jobNumber)}</span>
          </div>` : ''}
          <button class="btn btn-ghost btn-sm eh-new-search-btn" id="ehNewSearchBtn" style="margin-top:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            New Search
          </button>
        </div>
      </div>`;
  },

  // ── RENDER: SUMMARY INSIGHTS ──────────────────────────────
  _renderInsights(r, allEvents) {
    const liveCount   = r.interventions.length;
    const pmcCount    = r.interventions.filter(i => i.type === 'pmc').length;
    const breakCount  = r.interventions.filter(i => i.type === 'breakdown').length;
    const pausedCount = r.interventions.filter(i => i.status === 'paused' || (i.pauseHistory || []).length > 0).length;
    const cancelCount = r.cancelledJobs.length;
    const delCount    = r.deletedJobs.length;
    const totalAll    = liveCount + cancelCount + delCount;

    // Smart pattern: breakdowns during active PMC
    const pmcBreakdowns = r.interventions.filter(i => {
      if (i.type !== 'breakdown') return false;
      return r.pmcContracts.some(c => this._isDateCoveredByPMC(i.createdAt || i.scheduledDate, c));
    }).length;

    const insights = [];
    if (pmcBreakdowns > 0) {
      insights.push(`<div class="eh-insight-pill eh-insight-warn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ${pmcBreakdowns} breakdown${pmcBreakdowns > 1 ? 's' : ''} occurred during active PMC coverage
      </div>`);
    }
    if (r.pmcContracts.length > 0) {
      const gaps = this._detectPMCGaps(r.pmcContracts);
      if (gaps.length > 0) insights.push(`<div class="eh-insight-pill eh-insight-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${gaps.length} gap${gaps.length > 1 ? 's' : ''} detected between PMC contracts
      </div>`);
    }

    return `
      <div class="eh-insights-strip">
        <div class="eh-kpi-row">
          ${this._kpiCard('Total Events',        totalAll,   '#6366F1', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')}
          ${this._kpiCard('PMC Visits',          pmcCount,   '#16a34a', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z')}
          ${this._kpiCard('Breakdowns',          breakCount, '#dc2626', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z')}
          ${this._kpiCard('Paused',              pausedCount,'#d97706', 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z')}
          ${this._kpiCard('Cancelled',           cancelCount,'#6B7280', 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z')}
          ${this._kpiCard('Deleted',             delCount,   '#EF4444', 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}
        </div>
        ${insights.length ? `<div class="eh-insights-row">${insights.join('')}</div>` : ''}
      </div>`;
  },

  _kpiCard(label, val, color, path) {
    return `
      <div class="eh-kpi-card">
        <div class="eh-kpi-icon" style="background:${color}22;color:${color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="${path}"/></svg>
        </div>
        <div class="eh-kpi-body">
          <div class="eh-kpi-val">${val}</div>
          <div class="eh-kpi-label">${label}</div>
        </div>
      </div>`;
  },

  // ── RENDER: FILTER BAR ────────────────────────────────────
  _renderFilters(years) {
    const yearOpts = years.map(y =>
      `<option value="${y}" ${this._yearFilter == y ? 'selected' : ''}>${y}</option>`
    ).join('');

    return `
      <div class="eh-filter-bar">
        <span class="eh-filter-label">Filter timeline:</span>
        <select class="form-input form-input-sm eh-year-select" id="ehYearFilter">
          <option value="all" ${this._yearFilter === 'all' ? 'selected' : ''}>All Years</option>
          ${yearOpts}
        </select>
        <select class="form-input form-input-sm eh-type-select" id="ehTypeFilter">
          <option value="all"       ${this._typeFilter === 'all'       ? 'selected' : ''}>All Types</option>
          <option value="pmc"       ${this._typeFilter === 'pmc'       ? 'selected' : ''}>PMC</option>
          <option value="breakdown" ${this._typeFilter === 'breakdown' ? 'selected' : ''}>Breakdown</option>
          <option value="cancelled" ${this._typeFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          <option value="deleted"   ${this._typeFilter === 'deleted'   ? 'selected' : ''}>Deleted</option>
        </select>
        <button class="btn btn-ghost btn-sm" id="ehPrintBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print / Export
        </button>
      </div>`;
  },

  // ── RENDER: VERTICAL TIMELINE ─────────────────────────────
  _renderTimeline(events) {
    if (!events.length) {
      return `
        <div class="eh-section-card">
          <div class="eh-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            Timeline
          </div>
          <p class="eh-empty-note">No events match the current filter.</p>
        </div>`;
    }

    // Group by year for visual separation
    const grouped = {};
    events.forEach(e => {
      const yr = e.date ? new Date(e.date).getFullYear() : 'Unknown';
      (grouped[yr] = grouped[yr] || []).push(e);
    });

    const yearBlocks = Object.keys(grouped).sort((a,b) => b - a).map(yr => {
      const items = grouped[yr].map(e => this._timelineItem(e)).join('');
      return `
        <div class="eh-year-block">
          <div class="eh-year-marker">${yr}</div>
          <div class="eh-tl-track">${items}</div>
        </div>`;
    }).join('');

    return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          Timeline
          <span class="eh-section-count">${events.length} event${events.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="eh-timeline">${yearBlocks}</div>
      </div>`;
  },

  _timelineItem(e) {
    const cfg    = this._eventConfig(e);
    const badges = this._buildBadges(e);
    const detail = this._eventDetail(e);

    return `
      <div class="eh-tl-item eh-tl-${cfg.cls}">
        <div class="eh-tl-dot" style="background:${cfg.color};border-color:${cfg.color}20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
            <path d="${cfg.iconPath}"/>
          </svg>
        </div>
        <div class="eh-tl-body">
          <div class="eh-tl-header">
            <span class="eh-tl-title">${Utils.escapeHtml(e.title)}</span>
            ${badges}
            <span class="eh-tl-date">${Utils.formatDate(e.date)}</span>
          </div>
          ${e.jobNumber ? `<div class="eh-tl-job">Job # ${Utils.escapeHtml(e.jobNumber)}</div>` : ''}
          <div class="eh-tl-desc">${Utils.escapeHtml(e.desc)}</div>
          ${detail}
        </div>
      </div>`;
  },

  _buildBadges(e) {
    const parts = [];
    // Status badge
    if (e.status && e.status !== 'info') {
      const cfg = CONFIG.STATUSES[e.status];
      if (cfg) parts.push(`<span class="badge ${cfg.color}">${cfg.label}</span>`);
      else if (e.status === 'deleted')   parts.push(`<span class="badge badge-danger-soft">Deleted</span>`);
    }
    // PMC coverage badge
    if (e.pmcBadge === 'covered') {
      parts.push(`<span class="eh-badge-pmc">Covered by PMC</span>`);
    } else if (e.pmcBadge === 'outside') {
      parts.push(`<span class="eh-badge-outside">Outside Contract</span>`);
    }
    return parts.join(' ');
  },

  _eventDetail(e) {
    const lines = [];
    if (e.tech && e.tech !== '—' && e.source !== 'deleted' && e.source !== 'cancelled') {
      lines.push(`<span><strong>Technician:</strong> ${Utils.escapeHtml(e.tech)}</span>`);
    }
    if (e.source === 'deleted') {
      lines.push(`<span><strong>Deleted:</strong> ${Utils.formatDate(e.deletedAt)} by ${Utils.escapeHtml(e.deletedBy)}</span>`);
      lines.push(`<span><strong>Reason:</strong> ${Utils.escapeHtml(e.reason)}</span>`);
    }
    if (e.source === 'cancelled') {
      lines.push(`<span><strong>Cancelled:</strong> ${Utils.formatDate(e.cancelledAt)} by ${Utils.escapeHtml(e.cancelledBy)}</span>`);
      lines.push(`<span><strong>Reason:</strong> ${Utils.escapeHtml(e.reason)}</span>`);
    }
    if (e.pause) {
      lines.push(`<span><strong>Paused:</strong> ${Utils.escapeHtml(e.pause.reason || '—')} (by ${Utils.escapeHtml(e.pause.pausedBy || '—')})</span>`);
    }
    if (!lines.length) return '';
    return `<div class="eh-tl-detail">${lines.join(' &nbsp;·&nbsp; ')}</div>`;
  },

  // ── RENDER: PMC SECTION ───────────────────────────────────
  _renderPMCSection(r) {
    if (!r.pmcContracts.length) return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          PMC Contract History
        </div>
        <p class="eh-empty-note">No maintenance contracts found for this machine.</p>
      </div>`;

    const sorted   = [...r.pmcContracts].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    const overlaps = this._detectPMCOverlaps(sorted);
    const gaps     = this._detectPMCGaps(sorted);

    const rows = sorted.map((c, idx) => {
      const isActive  = this._contractStatus(c.endDate) === 'active';
      const isExpired = !isActive;
      const overlap   = overlaps.some(o => o.includes(idx));
      const pmcInterventions = r.interventions.filter(i =>
        i.type === 'pmc' && i.maintenanceContractId === c.id
      );
      const completedVisits = pmcInterventions.filter(i => i.status === 'completed').length;
      const totalScheduled  = c.visitsPerYear ? parseInt(c.visitsPerYear) : 0;

      return `
        <div class="eh-pmc-row ${overlap ? 'eh-pmc-overlap' : ''}">
          <div class="eh-pmc-row-left">
            <div class="eh-pmc-type-badge ${isActive ? 'eh-pmc-active' : 'eh-pmc-expired'}">
              ${isActive ? 'Active' : 'Expired'}
            </div>
            <div class="eh-pmc-dates">
              <span>${Utils.formatDate(c.startDate)}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              <span>${Utils.formatDate(c.endDate)}</span>
            </div>
            ${c.contractType ? `<span class="eh-pmc-tier">${Utils.escapeHtml(c.contractType)}</span>` : ''}
          </div>
          <div class="eh-pmc-row-right">
            <span class="eh-pmc-stat">${c.visitsPerYear || '—'} visits/year</span>
            <span class="eh-pmc-stat">${completedVisits}/${totalScheduled || '?'} completed</span>
            ${overlap ? `<span class="eh-badge-warn">Overlapping</span>` : ''}
          </div>
        </div>`;
    }).join('');

    const gapNotice = gaps.length
      ? `<div class="eh-pmc-gap-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${gaps.length} gap${gaps.length > 1 ? 's' : ''} detected between contracts:
          ${gaps.map(g => `<em>${Utils.formatDate(g.from)} – ${Utils.formatDate(g.to)}</em>`).join(', ')}
        </div>`
      : '';

    return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          PMC Contract History
          <span class="eh-section-count">${r.pmcContracts.length} contract${r.pmcContracts.length !== 1 ? 's' : ''}</span>
        </div>
        ${gapNotice}
        <div class="eh-pmc-list">${rows}</div>
      </div>`;
  },

  // ── RENDER: ISSUES SECTION ────────────────────────────────
  _renderIssuesSection(r) {
    const issues = r.interventions.filter(i =>
      i.type === 'breakdown'   ||
      i.type === 'support'     ||
      i.status === 'paused'   ||
      (i.pauseHistory || []).length > 0
    );

    if (!issues.length) return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Issues &amp; Breakdown History
        </div>
        <p class="eh-empty-note">No breakdowns, repairs, or paused jobs recorded.</p>
      </div>`;

    const rows = issues.map(i => {
      const statusCfg = CONFIG.STATUSES[i.status] || {};
      const resolution = i.status === 'completed'
        ? (i.statusHistory || []).slice().reverse().find(h => h.status === 'completed')?.note || '—'
        : null;
      const pauseReasons = (i.pauseHistory || []).map(p => p.reason).filter(Boolean);

      return `
        <div class="eh-issue-row">
          <div class="eh-issue-left">
            <div class="eh-issue-dot ${this._issueColor(i)}"></div>
            <div class="eh-issue-body">
              <div class="eh-issue-title">
                ${Utils.escapeHtml(CONFIG.INTERVENTION_TYPES[i.type] || i.type || '—')}
                <span class="badge ${statusCfg.color || ''}">${statusCfg.label || i.status}</span>
              </div>
              <div class="eh-issue-meta">
                ${Utils.formatDate(i.createdAt)}
                ${i.description ? ` · ${Utils.escapeHtml(i.description.slice(0, 80))}${i.description.length > 80 ? '…' : ''}` : ''}
              </div>
              ${resolution ? `<div class="eh-issue-resolution">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                Resolution: ${Utils.escapeHtml(resolution)}
              </div>` : ''}
              ${pauseReasons.length ? `<div class="eh-issue-pauses">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Paused ${pauseReasons.length}× — ${pauseReasons.map(r => Utils.escapeHtml(r)).join('; ')}
              </div>` : ''}
            </div>
          </div>
          <div class="eh-issue-right">
            ${this._resolveTech(i) !== '—' ? `<span class="eh-issue-tech">${Utils.escapeHtml(this._resolveTech(i))}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Issues &amp; Breakdown History
          <span class="eh-section-count">${issues.length}</span>
        </div>
        <div class="eh-issue-list">${rows}</div>
      </div>`;
  },

  // ── RENDER: DELETED & CANCELLED RECORDS ───────────────────
  _renderDeletedCancelledSection(r) {
    const hasDeleted   = r.deletedJobs.length > 0;
    const hasCancelled = r.cancelledJobs.length > 0;
    if (!hasDeleted && !hasCancelled) return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Deleted &amp; Cancelled Records
        </div>
        <p class="eh-empty-note">No deleted or cancelled records found for this serial number.</p>
      </div>`;

    const delRows = r.deletedJobs.map(d => `
      <div class="eh-arc-row eh-arc-deleted">
        <div class="eh-arc-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </div>
        <div class="eh-arc-body">
          <div class="eh-arc-title">
            ${Utils.escapeHtml(CONFIG.INTERVENTION_TYPES[d.type] || d.type || 'Intervention')}
            <span class="eh-arc-tag eh-arc-tag-del">Deleted</span>
          </div>
          <div class="eh-arc-meta">
            Created ${Utils.formatDate(d.createdAt)}
            &nbsp;·&nbsp; Deleted ${Utils.formatDate(d.deletedAt)} by <strong>${Utils.escapeHtml(d.deletedBy || '—')}</strong>
          </div>
          <div class="eh-arc-reason">Reason: ${Utils.escapeHtml(d.reason || '—')}</div>
        </div>
      </div>`).join('');

    const canRows = r.cancelledJobs.map(c => `
      <div class="eh-arc-row eh-arc-cancelled">
        <div class="eh-arc-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div class="eh-arc-body">
          <div class="eh-arc-title">
            ${Utils.escapeHtml(CONFIG.INTERVENTION_TYPES[c.type] || c.type || 'Intervention')}
            <span class="eh-arc-tag eh-arc-tag-can">Cancelled</span>
          </div>
          <div class="eh-arc-meta">
            Created ${Utils.formatDate(c.createdAt)}
            &nbsp;·&nbsp; Cancelled ${Utils.formatDate(c.cancelledAt)} by <strong>${Utils.escapeHtml(c.cancelledBy || '—')}</strong>
          </div>
          <div class="eh-arc-reason">Reason: ${Utils.escapeHtml(c.reason || '—')}</div>
        </div>
      </div>`).join('');

    const total = r.deletedJobs.length + r.cancelledJobs.length;

    return `
      <div class="eh-section-card">
        <div class="eh-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Deleted &amp; Cancelled Records
          <span class="eh-section-count">${total}</span>
        </div>
        <p class="eh-arc-note">These records have been removed from the main system but remain visible here for audit purposes.</p>
        ${hasDeleted   ? `<div class="eh-arc-group-title">Deleted</div>${delRows}`     : ''}
        ${hasCancelled ? `<div class="eh-arc-group-title">Cancelled</div>${canRows}` : ''}
      </div>`;
  },

  // ── RENDER: PRINT BAR ─────────────────────────────────────
  _renderPrintBar() {
    return `
      <div class="eh-print-bar" id="ehPrintBar">
        <span class="eh-print-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Equipment History Report — ${Utils.escapeHtml(this._serial)}
        </span>
        <button class="btn btn-primary btn-sm" id="ehDoPrintBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print / Export PDF
        </button>
      </div>`;
  },

  // ── BIND REPORT EVENTS ────────────────────────────────────
  _bindReportEvents() {
    // New Search
    document.getElementById('ehNewSearchBtn')?.addEventListener('click', () => {
      this._serial = '';
      this._report = null;
      this.mount();
    });

    // Year filter
    document.getElementById('ehYearFilter')?.addEventListener('change', e => {
      this._yearFilter = e.target.value;
      this._renderReport();
    });

    // Type filter
    document.getElementById('ehTypeFilter')?.addEventListener('change', e => {
      this._typeFilter = e.target.value;
      this._renderReport();
    });

    // Print buttons (both)
    const doPrint = () => {
      window.print();
    };
    document.getElementById('ehPrintBtn')?.addEventListener('click', doPrint);
    document.getElementById('ehDoPrintBtn')?.addEventListener('click', doPrint);
  },

  // ── HELPERS ───────────────────────────────────────────────
  _resolveTech(intervention) {
    const ids = intervention.technicianIds || (intervention.technicianId ? [intervention.technicianId] : []);
    if (!ids.length) return '—';
    const names = ids.map(id => {
      const u = (appState.users || []).find(u => u.id === id);
      return u ? (u.name || u.email) : id;
    });
    return names.join(', ');
  },

  _contractStatus(endDate) {
    if (!endDate) return 'unknown';
    return new Date(endDate) >= new Date() ? 'active' : 'expired';
  },

  _isDateCoveredByPMC(dateStr, contract) {
    if (!dateStr || !contract?.startDate || !contract?.endDate) return false;
    const d = new Date(dateStr);
    return d >= new Date(contract.startDate) && d <= new Date(contract.endDate);
  },

  _detectPMCGaps(sorted) {
    const gaps = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const end   = new Date(sorted[i].endDate);
      const start = new Date(sorted[i+1].startDate);
      const diffDays = (start - end) / (1000 * 60 * 60 * 24);
      if (diffDays > 1) {
        gaps.push({ from: sorted[i].endDate, to: sorted[i+1].startDate });
      }
    }
    return gaps;
  },

  _detectPMCOverlaps(sorted) {
    const overlaps = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const endI   = new Date(sorted[i].endDate);
        const startJ = new Date(sorted[j].startDate);
        if (startJ <= endI) overlaps.push([i, j]);
      }
    }
    return overlaps;
  },

  _machineStatusLabel(m, r) {
    if (!m) {
      if (r.deletedJobs.length > 0) return `<span class="badge badge-danger-soft">Deleted</span>`;
      if (r.cancelledJobs.length > 0) return `<span class="badge badge-cancelled">Cancelled</span>`;
      return `<span class="badge badge-gray">No active machine</span>`;
    }
    const hasPMC = r.pmcContracts.some(c => this._contractStatus(c.endDate) === 'active');
    if (hasPMC) return `<span class="badge badge-completed">Under PMC</span>`;
    const cfg = CONFIG.MACHINE_STATUSES[m.status];
    if (m.status === 'active') return `<span class="badge badge-completed">Active</span>`;
    if (m.status === 'maintenance') return `<span class="badge badge-ongoing">Under Maintenance</span>`;
    if (m.status === 'decommissioned') return `<span class="badge badge-grey">Decommissioned</span>`;
    return `<span class="badge badge-new">${cfg || m.status || 'Unknown'}</span>`;
  },

  _typeConfig(type) {
    const map = {
      pmc:          { icon: 'pmc',          color: '#16a34a' },
      breakdown:    { icon: 'breakdown',    color: '#dc2626' },
      installation: { icon: 'installation', color: '#6366F1' },
      support:      { icon: 'support',      color: '#2563EB' },
      training:     { icon: 'training',     color: '#7C3AED' },
      survey:       { icon: 'survey',       color: '#0891B2' }
    };
    return map[type] || { icon: 'other', color: '#6B7280' };
  },

  _eventConfig(e) {
    const map = {
      registered:   { cls: 'register',  color: '#6366F1', iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
      pmc:          { cls: 'pmc',       color: '#16a34a', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      breakdown:    { cls: 'breakdown', color: '#dc2626', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
      installation: { cls: 'install',   color: '#6366F1', iconPath: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
      support:      { cls: 'support',   color: '#2563EB', iconPath: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      training:     { cls: 'training',  color: '#7C3AED', iconPath: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
      survey:       { cls: 'survey',    color: '#0891B2', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      deleted:      { cls: 'deleted',   color: '#EF4444', iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
      cancelled:    { cls: 'cancelled', color: '#6B7280', iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
    };
    const key = e.source === 'deleted' ? 'deleted'
              : e.source === 'cancelled' ? 'cancelled'
              : e.type === 'registered' ? 'registered'
              : e.type;
    return map[key] || map['survey'];
  },

  _issueColor(i) {
    if (i.type === 'breakdown') return 'eh-dot-red';
    if (i.status === 'paused' || (i.pauseHistory||[]).length > 0) return 'eh-dot-amber';
    return 'eh-dot-blue';
  }
};
