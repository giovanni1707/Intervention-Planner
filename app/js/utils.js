
/* ============================================================
   utils.js — Utility Functions
   ============================================================ */

const Utils = {

  // ── ID GENERATION ─────────────────────────────────────────
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  },

  // ── DATE FORMATTING ───────────────────────────────────────
  formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d)) return '—';
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  },

  formatRelative(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d)) return '—';
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 30) return this.formatDate(isoString);
    if (diffDay > 0)  return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    if (diffHr > 0)   return `${diffHr}h ago`;
    if (diffMin > 0)  return `${diffMin}m ago`;
    return 'Just now';
  },

  daysAgo(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d)) return null;
    return Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  },

  isToday(isoString) {
    if (!isoString) return false;
    const d = new Date(isoString);
    const now = new Date();
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  },

  isFuture(isoString) {
    if (!isoString) return false;
    return new Date(isoString) > new Date();
  },

  isPast(isoString) {
    if (!isoString) return false;
    return new Date(isoString) < new Date();
  },

  // ── BADGE HTML GENERATORS ──────────────────────────────────
  getStatusBadge(status) {
    const cfg = CONFIG.STATUSES[status];
    if (!cfg) return `<span class="badge badge-gray">${status}</span>`;
    return `<span class="badge ${cfg.color}">${cfg.label}</span>`;
  },

  getPriorityBadge(priority) {
    const cfg = CONFIG.PRIORITIES[priority];
    if (!cfg) return `<span class="badge badge-gray">${priority}</span>`;
    return `<span class="badge ${cfg.color}">${cfg.label}</span>`;
  },

  getContractBadge(type) {
    const labels = { none: 'No Contract', bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
    const classes = { none: 'badge-none', bronze: 'badge-bronze', silver: 'badge-silver', gold: 'badge-gold' };
    return `<span class="badge ${classes[type] || 'badge-gray'}">${labels[type] || type}</span>`;
  },

  getRoleBadge(role) {
    const cfg = { admin: { label: 'Admin', cls: 'badge-admin' }, technician: { label: 'Technician', cls: 'badge-technician' } };
    const c = cfg[role] || { label: role, cls: 'badge-gray' };
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  },

  // ── INITIALS ──────────────────────────────────────────────
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // ── TRUNCATE ──────────────────────────────────────────────
  truncate(str, len = 50) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  },

  // ── ESCAPE HTML ───────────────────────────────────────────
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // ── FILTERING ────────────────────────────────────────────
  filterInterventions(list, filters) {
    return list.filter(i => {
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      if (filters.priority !== 'all' && i.priority !== filters.priority) return false;
      if (filters.type !== 'all' && i.type !== filters.type) return false;
      if (filters.technicianId !== 'all' && i.technicianId !== filters.technicianId) return false;
      if (filters.clientId !== 'all' && i.clientId !== filters.clientId) return false;

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        const scheduled = i.scheduledDate ? new Date(i.scheduledDate) : null;
        if (!scheduled || scheduled < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59);
        const scheduled = i.scheduledDate ? new Date(i.scheduledDate) : null;
        if (!scheduled || scheduled > to) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const client = appState.clients.find(c => c.id === i.clientId);
        const machine = appState.machines.find(m => m.id === i.machineId);
        const tech = appState.users.find(u => u.id === i.technicianId);
        const searchText = [
          i.id, i.description,
          client?.name, machine?.model, machine?.serialNumber,
          tech?.name, i.type, i.status, i.priority
        ].join(' ').toLowerCase();
        if (!searchText.includes(q)) return false;
      }

      return true;
    });
  },

  // ── ARRAY HELPERS ─────────────────────────────────────────
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const val = typeof key === 'function' ? key(item) : item[key];
      if (!groups[val]) groups[val] = [];
      groups[val].push(item);
      return groups;
    }, {});
  },

  sortBy(array, key, dir = 'asc') {
    return [...array].sort((a, b) => {
      const va = typeof key === 'function' ? key(a) : a[key];
      const vb = typeof key === 'function' ? key(b) : b[key];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return dir === 'desc' ? -cmp : cmp;
    });
  },

  // ── LOOKUP HELPERS ────────────────────────────────────────
  getClientName(clientId) {
    const c = appState.clients.find(c => c.id === clientId);
    return c ? c.name : '—';
  },

  getMachineModel(machineId) {
    const m = appState.machines.find(m => m.id === machineId);
    return m ? m.model : '—';
  },

  getTechnicianName(techId) {
    if (!techId) return 'Unassigned';
    const u = appState.users.find(u => u.id === techId);
    return u ? u.name : '—';
  },

  getInterventionTypeLabel(type) {
    return CONFIG.INTERVENTION_TYPES[type] || type;
  },

  // ── NUMBER FORMAT ─────────────────────────────────────────
  formatNumber(n) {
    return new Intl.NumberFormat('en-MU').format(n);
  },

  formatCurrency(n, currency = 'MUR') {
    return `${currency} ${this.formatNumber(n)}`;
  },

  // ── PERCENTAGE ───────────────────────────────────────────
  percent(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }
};
