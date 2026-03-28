/* ============================================================
   components/global-search.js — Global Search Overlay
   ============================================================ */

const GlobalSearch = {
  _open: false,
  _query: '',

  init() {
    // Keyboard shortcut: Ctrl+K / Cmd+K
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this._open ? this.close() : this.open();
      }
      if (e.key === 'Escape' && this._open) {
        this.close();
      }
    });
  },

  open() {
    if (this._open) return;
    this._open = true;
    this._render();
    const overlay = document.getElementById('gsOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => overlay.classList.add('gs-visible'));
    }
    setTimeout(() => {
      const input = document.getElementById('gsInput');
      if (input) input.focus();
    }, 80);
  },

  close() {
    this._open  = false;
    this._query = '';
    const overlay = document.getElementById('gsOverlay');
    if (overlay) {
      overlay.classList.remove('gs-visible');
      setTimeout(() => overlay.classList.add('hidden'), 180);
    }
  },

  _render() {
    let overlay = document.getElementById('gsOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gsOverlay';
      overlay.className = 'gs-overlay hidden';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="gs-backdrop" id="gsBackdrop"></div>
      <div class="gs-panel" role="dialog" aria-modal="true" aria-label="Global Search">
        <div class="gs-input-wrap">
          <svg class="gs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="gsInput" class="gs-input" type="text" placeholder="Search interventions, clients, machines…" autocomplete="off" spellcheck="false">
          <kbd class="gs-esc-hint">Esc</kbd>
        </div>
        <div id="gsResults" class="gs-results"></div>
        <div class="gs-footer">
          <span>↑↓ navigate</span><span>↵ open</span><span>Esc close</span>
        </div>
      </div>
    `;

    document.getElementById('gsBackdrop').addEventListener('click', () => this.close());

    const input = document.getElementById('gsInput');
    input.addEventListener('input', () => {
      this._query = input.value.trim();
      this._renderResults(this._query);
    });

    input.addEventListener('keydown', e => {
      const results = document.getElementById('gsResults');
      const items   = results ? [...results.querySelectorAll('.gs-result-item')] : [];
      const current = results ? results.querySelector('.gs-result-item.gs-active') : null;
      const idx     = items.indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = items[idx + 1] || items[0];
        if (current) current.classList.remove('gs-active');
        if (next)    next.classList.add('gs-active');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = items[idx - 1] || items[items.length - 1];
        if (current) current.classList.remove('gs-active');
        if (prev)    prev.classList.add('gs-active');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (current) current.click();
      }
    });

    this._renderResults('');
  },

  _renderResults(query) {
    const container = document.getElementById('gsResults');
    if (!container) return;

    if (!query) {
      // Show recent interventions as default
      const recent = Utils.sortBy(appState.interventions, 'createdAt', 'desc').slice(0, 6);
      container.innerHTML = this._buildSection('Recent Interventions', recent.map(i => this._interventionItem(i)));
      this._bindItemClicks();
      return;
    }

    const q = query.toLowerCase();

    // Search interventions
    const matchedInterventions = appState.interventions.filter(i => {
      const client  = appState.clients.find(c => c.id === i.clientId);
      const machine = appState.machines.find(m => m.id === i.machineId);
      return [
        i.id, i.description, i.status, i.priority, i.type,
        client?.name, machine?.model, machine?.serialNumber,
        machine?.jobNumber, machine?.location, machine?.district,
        Utils.getTechnicianNames(i)
      ].join(' ').toLowerCase().includes(q);
    }).slice(0, 6);

    // Search clients
    const matchedClients = appState.clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    ).slice(0, 4);

    // Search machines
    const matchedMachines = appState.machines.filter(m =>
      (m.model || '').toLowerCase().includes(q) ||
      (m.serialNumber || '').toLowerCase().includes(q) ||
      (m.jobNumber || '').toLowerCase().includes(q) ||
      (m.location || '').toLowerCase().includes(q)
    ).slice(0, 4);

    let html = '';
    if (matchedInterventions.length > 0) {
      html += this._buildSection('Interventions', matchedInterventions.map(i => this._interventionItem(i)));
    }
    if (matchedClients.length > 0) {
      html += this._buildSection('Clients', matchedClients.map(c => this._clientItem(c)));
    }
    if (matchedMachines.length > 0) {
      html += this._buildSection('Machines', matchedMachines.map(m => this._machineItem(m)));
    }

    if (!html) {
      html = `<div class="gs-no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>No results for "<strong>${Utils.escapeHtml(query)}</strong>"</p>
      </div>`;
    }

    container.innerHTML = html;
    this._bindItemClicks();
  },

  _buildSection(title, items) {
    if (items.length === 0) return '';
    return `
      <div class="gs-section">
        <div class="gs-section-label">${title}</div>
        ${items.join('')}
      </div>`;
  },

  _interventionItem(i) {
    const client  = appState.clients.find(c => c.id === i.clientId);
    const machine = appState.machines.find(m => m.id === i.machineId);
    return `
      <div class="gs-result-item" data-action="intervention" data-id="${i.id}" tabindex="-1">
        <div class="gs-result-icon gs-icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="gs-result-body">
          <div class="gs-result-title">${Utils.escapeHtml(client?.name || '—')} — ${Utils.escapeHtml(machine?.model || '—')}</div>
          <div class="gs-result-meta">${Utils.escapeHtml(machine?.jobNumber || '')} · ${Utils.getStatusBadge(i.status, i)} · ${Utils.formatDate(i.scheduledDate)}</div>
        </div>
        <div class="gs-result-arrow">→</div>
      </div>`;
  },

  _clientItem(c) {
    return `
      <div class="gs-result-item" data-action="client" data-id="${c.id}" tabindex="-1">
        <div class="gs-result-icon gs-icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="gs-result-body">
          <div class="gs-result-title">${Utils.escapeHtml(c.name)}</div>
          <div class="gs-result-meta">${Utils.escapeHtml(c.email || '')} ${c.phone ? '· ' + Utils.escapeHtml(c.phone) : ''}</div>
        </div>
        <div class="gs-result-arrow">→</div>
      </div>`;
  },

  _machineItem(m) {
    const client = appState.clients.find(c => c.id === m.clientId);
    return `
      <div class="gs-result-item" data-action="machine" data-id="${m.id}" tabindex="-1">
        <div class="gs-result-icon gs-icon-orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="gs-result-body">
          <div class="gs-result-title">${Utils.escapeHtml(m.model || '—')} <span style="color:var(--gray-400);font-weight:400">${Utils.escapeHtml(m.jobNumber || '')}</span></div>
          <div class="gs-result-meta">${Utils.escapeHtml(client?.name || '—')} · S/N: ${Utils.escapeHtml(m.serialNumber || '—')} ${m.location ? '· ' + Utils.escapeHtml(m.location) : ''}</div>
        </div>
        <div class="gs-result-arrow">→</div>
      </div>`;
  },

  _bindItemClicks() {
    document.querySelectorAll('.gs-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const id     = item.dataset.id;
        this.close();
        if (action === 'intervention') {
          Router.go('interventions');
          setTimeout(() => Views.Interventions.openDetailModal(id), 300);
        } else if (action === 'client') {
          Router.go('clients');
        } else if (action === 'machine') {
          Router.go('interventions');
        }
      });
      item.addEventListener('mouseenter', () => {
        document.querySelectorAll('.gs-result-item.gs-active').forEach(a => a.classList.remove('gs-active'));
        item.classList.add('gs-active');
      });
    });
  }
};
