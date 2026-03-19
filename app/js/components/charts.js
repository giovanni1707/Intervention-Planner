/* ============================================================
   components/charts.js — Chart.js Wrappers
   ============================================================ */

const Charts = {
  _instances: {},

  _destroy(id) {
    if (this._instances[id]) {
      this._instances[id].destroy();
      delete this._instances[id];
    }
  },

  destroyAll() {
    Object.keys(this._instances).forEach(id => this._destroy(id));
  },

  // ── STATUS DOUGHNUT ───────────────────────────────────────
  renderStatusDoughnut(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const counts = {};
    Object.keys(CONFIG.STATUSES).forEach(s => counts[s] = 0);
    interventions.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

    const labels = Object.values(CONFIG.STATUSES).map(s => s.label);
    const data   = Object.keys(CONFIG.STATUSES).map(k => counts[k]);

    const colors = [
      '#3B82F6', '#8B5CF6', '#6366F1',
      '#F97316', '#F59E0B', '#EF4444',
      '#10B981', '#94A3B8'
    ];

    this._instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}`
            }
          }
        }
      }
    });
  },

  // ── WEEKLY BAR ────────────────────────────────────────────
  renderWeeklyBar(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const days = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toDateString());
      labels.push(d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
    }

    const counts = days.map(day =>
      interventions.filter(i => {
        const d = i.scheduledDate || i.createdAt;
        return d && new Date(d).toDateString() === day;
      }).length
    );

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Interventions',
          data: counts,
          backgroundColor: '#3B82F6',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: '#F1F5F9' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  },

  // ── TECHNICIAN WORKLOAD BAR ───────────────────────────────
  renderTechnicianWorkload(canvasId, techData) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: techData.map(t => t.name),
        datasets: [{
          label: 'Active Jobs',
          data: techData.map(t => t.activeJobs),
          backgroundColor: techData.map(t =>
            t.activeJobs >= 6 ? '#EF4444' :
            t.activeJobs >= 3 ? '#F59E0B' : '#10B981'
          ),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: CONFIG.MAX_WORKLOAD,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: '#F1F5F9' }
          },
          y: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  },

  // ── TYPE PIE ──────────────────────────────────────────────
  renderTypePie(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const types  = Object.keys(CONFIG.INTERVENTION_TYPES);
    const labels = types.map(t => {
      const full = CONFIG.INTERVENTION_TYPES[t];
      // Shorten long labels for pie legend
      return full.length > 22 ? full.slice(0, 22) + '…' : full;
    });
    const data   = types.map(t => interventions.filter(i => i.type === t).length);
    const colors = ['#EF4444','#3B82F6','#10B981','#8B5CF6','#F59E0B'];

    this._instances[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 10 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
        }
      }
    });
  },

  // ── PRIORITY DOUGHNUT ─────────────────────────────────────
  renderPriorityDoughnut(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const priorities = Object.keys(CONFIG.PRIORITIES);
    const labels     = priorities.map(p => CONFIG.PRIORITIES[p].label);
    const data       = priorities.map(p => interventions.filter(i => i.priority === p).length);
    const colors     = ['#10B981','#F59E0B','#EF4444','#DC2626'];

    this._instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
        }
      }
    });
  },

  // ── 12-MONTH TREND LINE ───────────────────────────────────
  renderTwelveMonthTrend(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const months = [];
    const labels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
      labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
    }

    const created = months.map(m => interventions.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length);

    const completed = months.map(m => interventions.filter(i => {
      if (i.status !== 'completed') return false;
      const d = new Date(i.updatedAt || i.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length);

    // Completion rate % per month
    const rate = created.map((c, idx) => c > 0 ? Math.round(completed[idx] / c * 100) : 0);

    this._instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Created',
            data: created,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            tension: 0.4, fill: true, pointRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Completed',
            data: completed,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            tension: 0.4, fill: true, pointRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Completion Rate %',
            data: rate,
            borderColor: '#F59E0B',
            backgroundColor: 'transparent',
            tension: 0.4, pointRadius: 3,
            borderDash: [5, 4],
            yAxisID: 'yRate',
            type: 'line'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: '#F1F5F9' }
          },
          yRate: {
            position: 'right',
            min: 0, max: 100,
            grid: { drawOnChartArea: false },
            ticks: { callback: v => v + '%', font: { size: 11 } }
          },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  },

  // ── TECHNICIAN PERFORMANCE BAR ─────────────────────────────
  renderTechPerformanceBar(canvasId, interventions, users) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const technicians = (users || []).filter(u => u.role === 'technician');
    if (!technicians.length) {
      // Fallback: no technician data
      canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:40px 0;font-size:0.857rem">No technician data available</p>';
      return;
    }

    const labels = technicians.map(t => t.name);
    const completed = technicians.map(t =>
      interventions.filter(i => Utils.getTechIds(i).includes(t.id) && i.status === 'completed').length
    );
    const active = technicians.map(t =>
      interventions.filter(i => Utils.getTechIds(i).includes(t.id) && CONFIG.OPEN_STATUSES.includes(i.status)).length
    );

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Completed', data: completed, backgroundColor: '#10B981', borderRadius: 3, stack: 'jobs' },
          { label: 'Active', data: active, backgroundColor: '#F59E0B', borderRadius: 3, stack: 'jobs' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } }
        },
        scales: {
          x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          y: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  },

  // ── TOP CLIENTS HORIZONTAL BAR ────────────────────────────
  renderTopClientsBar(canvasId, interventions, clients) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const counts = {};
    interventions.forEach(i => { counts[i.clientId] = (counts[i.clientId] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (!sorted.length) {
      canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:40px 0;font-size:0.857rem">No data available</p>';
      return;
    }

    const labels = sorted.map(([id]) => {
      const c = (clients || []).find(c => c.id === id);
      const name = c ? c.name : '—';
      return name.length > 20 ? name.slice(0, 20) + '…' : name;
    });
    const data = sorted.map(([, n]) => n);

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Interventions', data, backgroundColor: '#6366F1', borderRadius: 3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          y: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  },

  // ── DISTRICT BAR ──────────────────────────────────────────
  renderDistrictBar(canvasId, interventions, machines) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const districtCounts = {};
    CONFIG.DISTRICTS.forEach(d => { districtCounts[d] = 0; });
    interventions.forEach(i => {
      const m = (machines || []).find(m => m.id === i.machineId);
      if (m && m.district && districtCounts[m.district] !== undefined) districtCounts[m.district]++;
    });

    // Short labels: strip " District" suffix
    const labels = CONFIG.DISTRICTS.map(d => d.replace(' District', ''));
    const data   = CONFIG.DISTRICTS.map(d => districtCounts[d]);

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Interventions', data, backgroundColor: '#0EA5E9', borderRadius: 3, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  },

  // ── CONTRACT COVERAGE DOUGHNUT ────────────────────────────
  renderContractCoverageDoughnut(canvasId, machines) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const types  = Object.keys(CONFIG.CONTRACT_TYPES);
    const labels = Object.values(CONFIG.CONTRACT_TYPES);
    const data   = types.map(t => (machines || []).filter(m => m.contractType === t).length);
    const colors = ['#94A3B8', '#D97706', '#CBD5E1', '#F59E0B'];

    this._instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
        }
      }
    });
  },

  // ── MACHINE STATUS PIE ────────────────────────────────────
  renderMachineStatusPie(canvasId, machines) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const statuses = Object.keys(CONFIG.MACHINE_STATUSES);
    const labels   = Object.values(CONFIG.MACHINE_STATUSES);
    const data     = statuses.map(s => (machines || []).filter(m => (m.status || 'new') === s).length);
    const colors   = ['#3B82F6', '#10B981', '#F59E0B', '#6B7280'];

    this._instances[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
        }
      }
    });
  },

  // ── AVG DAYS PER STATUS BAR ───────────────────────────────
  renderAvgTimePerStatusBar(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // For completed interventions: compute avg days from creation to completion
    // For open interventions: compute avg days open per current status
    const statusKeys = Object.keys(CONFIG.STATUSES);
    const labels     = statusKeys.map(s => CONFIG.STATUSES[s].label);
    const avgs = statusKeys.map(s => {
      const group = interventions.filter(i => i.status === s);
      if (!group.length) return 0;
      const total = group.reduce((sum, i) => {
        const from = new Date(i.createdAt);
        const to   = i.status === 'completed' || i.status === 'cancelled'
          ? new Date(i.updatedAt || i.createdAt)
          : new Date();
        return sum + Math.max(0, (to - from) / (1000 * 60 * 60 * 24));
      }, 0);
      return Math.round((total / group.length) * 10) / 10;
    });

    const bgColors = statusKeys.map(s => {
      const map = { new: '#3B82F6', tentative: '#8B5CF6', assigned: '#6366F1', ongoing: '#F97316', pending: '#F59E0B', waiting_parts: '#EF4444', completed: '#10B981', cancelled: '#94A3B8' };
      return map[s] || '#94A3B8';
    });

    this._instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Avg Days', data: avgs, backgroundColor: bgColors, borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.raw} days avg` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  },

  // ── MONTHLY TREND LINE ────────────────────────────────────
  renderMonthlyTrend(canvasId, interventions) {
    this._destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const months = [];
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
      labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
    }

    const created   = months.map(m => interventions.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length);

    const completed = months.map(m => interventions.filter(i => {
      if (i.status !== 'completed') return false;
      const d = new Date(i.updatedAt || i.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length);

    this._instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Created',
            data: created,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4
          },
          {
            label: 'Completed',
            data: completed,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: '#F1F5F9' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }
};
