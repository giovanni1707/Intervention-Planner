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
