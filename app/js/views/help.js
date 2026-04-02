/* ============================================================
   views/help.js — Help Center
   ============================================================ */

window.Views = window.Views || {};

Views.Help = {

  _activeArticle: null,
  _searchQuery:   '',

  /* ── Articles ─────────────────────────────────────────────── */
  _articles: [

    /* ────────────── GETTING STARTED ───────────────────────── */
    {
      id:       'gs-overview',
      category: 'Getting Started',
      icon:     '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      title:    'Application Overview',
      roles:    ['all'],
      summary:  'What GPS Service Management is and how to navigate it.',
      body: `
        <h3>What is GPS Service Management?</h3>
        <p>GPS Service Management is the official service operations platform for <strong>Giovanni Packaging Solution Ltd</strong>, the official representative of the MULTIVAC Group in the Indian Ocean Region.</p>
        <p>It centralises all field service activities — from logging a customer intervention to tracking preventive maintenance contracts — so the entire team works from a single source of truth.</p>

        <h3>Roles in the system</h3>
        <div class="help-role-grid">
          <div class="help-role-card">
            <div class="help-role-badge" style="background:var(--purple)">SA</div>
            <div>
              <strong>Head Administrator</strong>
              <p>Full access to every section, including user management, settings, and all data.</p>
            </div>
          </div>
          <div class="help-role-card">
            <div class="help-role-badge" style="background:var(--blue)">A</div>
            <div>
              <strong>Admin</strong>
              <p>Manages interventions, clients, contracts, and reports. Cannot manage system users.</p>
            </div>
          </div>
          <div class="help-role-card">
            <div class="help-role-badge" style="background:var(--green)">T</div>
            <div>
              <strong>Technician</strong>
              <p>Views assigned jobs, browses parts inventory, uses chat, and manages their own profile.</p>
            </div>
          </div>
        </div>

        <h3>Navigating the application</h3>
        <p>Use the <strong>left sidebar</strong> to move between sections. On mobile, tap the hamburger menu (☰) at the top-left to open the sidebar.</p>
        <p>Press <kbd>Ctrl</kbd> + <kbd>K</kbd> (or click <em>Search</em> in the sidebar) to open the <strong>Global Search</strong> — it searches across clients, jobs, machines, and more.</p>
        <p>Press <kbd>Esc</kbd> to close any open modal or dialog.</p>
      `
    },

    {
      id:       'gs-login',
      category: 'Getting Started',
      icon:     '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
      title:    'Signing In & Session Settings',
      roles:    ['all'],
      summary:  'How to log in and control your session persistence.',
      body: `
        <h3>Signing in</h3>
        <p>On the login screen enter your <strong>email address</strong> and <strong>password</strong>, then click <em>Sign In</em>.</p>
        <p>If your credentials are incorrect you will see an error message below the form. Contact your Head Administrator to reset your password.</p>

        <h3>Session persistence</h3>
        <p>Go to <strong>Settings → Session Persistence</strong> to choose how your login behaves:</p>
        <ul>
          <li><strong>Stay Logged In</strong> — your session is remembered across browser restarts (default).</li>
          <li><strong>Session Per Tab</strong> — you are automatically signed out when you close the browser tab.</li>
        </ul>
        <p class="help-note">⚠ Changing this setting requires you to confirm your current password for security.</p>

        <h3>Signing out</h3>
        <p>Click the <strong>sign-out icon</strong> (arrow) at the bottom of the sidebar, next to your name and avatar.</p>
      `
    },

    /* ────────────── DASHBOARD ──────────────────────────────── */
    {
      id:       'dash-overview',
      category: 'Dashboard',
      icon:     '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
      title:    'Using the Dashboard',
      roles:    ['all'],
      summary:  'Understanding KPIs, today\'s schedule, and quick actions.',
      body: `
        <h3>Overview</h3>
        <p>The Dashboard is your home screen after login. It gives you an instant snapshot of the current state of service operations.</p>

        <h3>KPI Cards</h3>
        <p>The row of cards at the top shows key metrics such as total open jobs, urgent jobs, jobs scheduled today, and completion rate. These update in real time.</p>

        <h3>Today's Schedule</h3>
        <p>This panel lists all interventions with a scheduled date of today. Click <em>View</em> on any row to open the job detail modal.</p>

        <h3>Alert &amp; Notification Banners</h3>
        <p>Coloured banners appear above the KPI cards when action is required. Each banner has a <strong>View</strong> button that takes you directly to the filtered Interventions table:</p>
        <ul>
          <li><strong>Urgent jobs</strong> (red banner) — clicking <em>View</em> filters the Interventions table to show only <em>urgent-priority</em> open jobs.</li>
          <li><strong>Overdue jobs</strong> (orange banner) — clicking <em>View</em> shows all open jobs whose scheduled date has already passed.</li>
          <li><strong>Unplanned requests</strong> (blue banner) — clicking <em>Plan Now</em> navigates to the <em>Planning</em> section so you can schedule those jobs.</li>
        </ul>
        <p>Notification banners (expiring contracts, SLA breaches, etc.) also include a <em>View</em> button that opens the relevant filtered job list.</p>

        <h3>Quick Actions</h3>
        <ul>
          <li><strong>Admins:</strong> click <em>New Intervention</em> to create a job directly from the dashboard.</li>
          <li><strong>Technicians:</strong> click <em>My Jobs</em> to jump to your assigned work.</li>
        </ul>
      `
    },

    /* ────────────── INTERVENTIONS ──────────────────────────── */
    {
      id:       'int-overview',
      category: 'Interventions',
      icon:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      title:    'Interventions Overview',
      roles:    ['admin', 'superadmin'],
      summary:  'Navigate, filter, and switch views for all service jobs.',
      body: `
        <h3>What is an Intervention?</h3>
        <p>An intervention is any service job performed for a client — a breakdown repair, a preventive maintenance visit (PMC), an installation, training session, and more.</p>

        <h3>Table vs Kanban View</h3>
        <p>Toggle between views using the buttons at the top-right of the page:</p>
        <ul>
          <li><strong>Table view</strong> — sortable, paginated list ideal for searching and bulk review.</li>
          <li><strong>Kanban view</strong> — columns grouped by status, ideal for visualising workflow.</li>
        </ul>

        <h3>Filtering</h3>
        <p>Use the filter bar to narrow results by: <em>Status, Priority, Type, Technician, Client, District,</em> and <em>Year</em>. All filters work together — only jobs matching all selected criteria are shown.</p>
        <p>The <strong>Year</strong> dropdown is populated automatically from the years present in your data. Selecting a year shows only interventions created in that calendar year. Use it alongside the date-range inputs (<em>From / To</em>) for precise time-based filtering.</p>

        <h3>Sorting</h3>
        <p>In table view, click any column header to sort ascending. Click again to sort descending. An arrow indicator shows the active sort.</p>

        <h3>Pagination</h3>
        <p>Use the page controls at the bottom to navigate. Change the number of rows per page in <strong>Settings → Page Size</strong>.</p>
      `
    },

    {
      id:       'int-create',
      category: 'Interventions',
      icon:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
      title:    'Creating an Intervention',
      roles:    ['admin', 'superadmin'],
      summary:  'Step-by-step guide to logging a new service job.',
      body: `
        <h3>Opening the form</h3>
        <p>Click <strong>+ New Intervention</strong> at the top-right of the Interventions page (or from the Dashboard quick actions).</p>

        <h3>Required fields</h3>
        <ul>
          <li><strong>Client</strong> — select from the registered client list.</li>
          <li><strong>Machine / Job</strong> — select an existing machine or create a new one inline. The <em>Location Address</em> field is required when creating a new machine.</li>
          <li><strong>Intervention Type</strong> — Breakdown Repair, PMC, Installation & Commissioning, Technical Support, Training, or Survey.</li>
          <li><strong>Priority</strong> — Low, Medium, High, or Urgent.</li>
        </ul>

        <h3>Optional fields</h3>
        <ul>
          <li><strong>Technician(s)</strong> — assign one or more technicians.</li>
          <li><strong>Scheduled Date</strong> — when the job is planned.</li>
          <li><strong>Description</strong> — details about the fault or task.</li>
          <li><strong>Parts</strong> — list parts to be used.</li>
        </ul>

        <h3>PMC Interventions</h3>
        <p>To create a PMC job, click <strong>Add PMC</strong> in the Maintenance Contracts section. The form pre-selects the PMC type and shows the contract coverage banner automatically.</p>

        <h3>Saving</h3>
        <p>Click <em>Save Intervention</em>. The job appears in the table immediately and all team members see it in real time.</p>
      `
    },

    {
      id:       'int-detail',
      category: 'Interventions',
      icon:     '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      title:    'Job Detail Modal',
      roles:    ['admin', 'superadmin'],
      summary:  'Updating status, adding notes, managing parts, and history.',
      body: `
        <h3>Opening the detail modal</h3>
        <p>Click the <em>eye icon</em> on any row in the table, or click a card in Kanban view.</p>

        <h3>Status updates</h3>
        <p>Use the <strong>Status</strong> dropdown at the top of the modal to move a job through its lifecycle:</p>
        <div class="help-status-flow">
          <span class="badge badge-new">New</span> →
          <span class="badge badge-tentative">Tentative</span> →
          <span class="badge badge-assigned">Assigned</span> →
          <span class="badge badge-ongoing">On Going</span> →
          <span class="badge badge-pending">Pending</span> /
          <span class="badge badge-waiting_parts">Waiting Parts</span> →
          <span class="badge badge-completed">Completed</span>
        </div>

        <h3>Pausing a job</h3>
        <p>Set the status to <strong>Paused</strong> to temporarily suspend work on a job without cancelling it. A <em>Pause Reason</em> field is mandatory when pausing. The reason is recorded in the job history. To resume, change the status to any active status — you will be prompted to add a <em>Resume Note</em>.</p>

        <h3>Cancelling a job</h3>
        <p>Set the status to <strong>Cancelled</strong> to mark a job as no longer proceeding. A <em>Cancellation Reason</em> is mandatory. Once cancelled, the job is archived in the <strong>Cancelled Jobs</strong> section for audit purposes. See the <em>Cancelled Jobs Log</em> article for full details.</p>

        <h3>Notes</h3>
        <p>Add internal notes in the <em>Notes</em> tab. Notes are timestamped and attributed to the author.</p>

        <h3>Parts</h3>
        <p>In the <em>Parts</em> tab, add reference numbers and descriptions for parts used. These feed into the Parts Inventory aggregate.</p>

        <h3>History</h3>
        <p>The <em>History</em> tab shows a full audit trail — every status change, technician re-assignment, and rescheduling event with timestamp and actor.</p>

        <h3>PMC Coverage Banner</h3>
        <p>If the machine has an active maintenance contract, a blue banner appears at the top of the modal. Click the eye icon on the banner to view the contract details.</p>
      `
    },

    /* ────────────── PLANNING ───────────────────────────────── */
    {
      id:       'plan-overview',
      category: 'Planning',
      icon:     '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      title:    'Planning Board & Calendar',
      roles:    ['admin', 'superadmin'],
      summary:  'Schedule jobs, view the calendar, and manage the queue.',
      body: `
        <h3>Overview</h3>
        <p>The Planning section combines a <strong>scheduling queue</strong> (unplanned requests) with a <strong>monthly calendar</strong> showing all scheduled jobs.</p>

        <h3>Scheduling Queue</h3>
        <p>The left panel lists interventions that have <em>no scheduled date</em> yet. Open a job from the queue to set its date and assign it to a technician.</p>

        <h3>Calendar View</h3>
        <p>The calendar highlights days that have scheduled jobs. The number on each day indicates how many jobs are booked.</p>
        <ul>
          <li>Click a day to filter the table below to that day's jobs.</li>
          <li>Use the <strong>← →</strong> arrows to navigate months.</li>
          <li>The badge next to the month name shows the busiest month in the current dataset.</li>
        </ul>

        <h3>Filtering the table</h3>
        <p>Below the calendar, filter the schedule table by: Client, Type, Priority, Status, Technician, and District.</p>
        <p>A <strong>Date Range</strong> filter (From / To date inputs) is also available. When a date range is set, the table expands beyond the current month and shows all scheduled interventions within the selected range across any month. The table title updates to reflect the active range. The job count badge switches to <em>filtered / total</em> format when any filter is active.</p>
        <p>Click <strong>Clear</strong> to reset all table filters, including the date range, back to the current month view.</p>
      `
    },

    /* ────────────── CLIENTS ────────────────────────────────── */
    {
      id:       'clients-overview',
      category: 'Clients',
      icon:     '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
      title:    'Managing Clients',
      roles:    ['admin', 'superadmin'],
      summary:  'Add, search, edit, and view client details and their machines.',
      body: `
        <h3>Client list</h3>
        <p>The Clients page shows all registered customers. Use the <strong>search bar</strong> to filter by name, contact person, email, phone, or region.</p>

        <h3>Adding a client</h3>
        <p>Click <strong>+ Add Client</strong>. Fill in:</p>
        <ul>
          <li>Company name (required)</li>
          <li>Contact person, email, phone(s)</li>
          <li>Region / district</li>
        </ul>

        <h3>Editing & deleting</h3>
        <p>Click the <em>edit (pencil)</em> icon on a row to update a client's details. Click the <em>trash</em> icon to delete — you will be asked to confirm.</p>

        <h3>Client Summary</h3>
        <p>Click the client name or the <em>eye</em> icon to open the <strong>Client Summary</strong> — a dedicated page showing all machines, active interventions, and contract status for that client.</p>

        <h3>Machines</h3>
        <p>Each client can have multiple machines registered. Machines are created from the intervention form (Add Machine) or directly in the Client Summary page.</p>
      `
    },

    /* ────────────── TECHNICIANS ────────────────────────────── */
    {
      id:       'tech-overview',
      category: 'Technicians',
      icon:     '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      title:    'Technician Management',
      roles:    ['admin', 'superadmin'],
      summary:  'View the team roster, workload, and individual performance.',
      body: `
        <h3>Team Roster</h3>
        <p>The Technicians page displays a card for each technician showing their name, current active job count, and a workload summary.</p>

        <h3>Workload Chart</h3>
        <p>A bar chart at the top compares the number of active jobs across all technicians — useful for balancing assignments.</p>

        <h3>Assigning technicians</h3>
        <p>Technician assignment happens inside the <strong>Intervention form</strong> or the <strong>Job Detail Modal</strong>. Select one or more technicians from the dropdown when creating or editing a job.</p>

        <h3>Adding a technician</h3>
        <p>Technicians are added as <em>Users</em> in the <strong>Users</strong> section (Head Administrator only). Set their role to <em>Technician</em> when creating the account.</p>
      `
    },

    /* ────────────── MAINTENANCE CONTRACTS ─────────────────── */
    {
      id:       'mc-overview',
      category: 'Maintenance Contracts',
      icon:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/>',
      title:    'Maintenance Contracts',
      roles:    ['admin', 'superadmin'],
      summary:  'Track service contracts, visit schedules, and contract parts.',
      body: `
        <h3>What is a Maintenance Contract?</h3>
        <p>A maintenance contract formalises a recurring service agreement with a client for a specific machine. It defines how often a preventive maintenance visit (PMC) should happen and what parts are covered.</p>

        <h3>Contract types</h3>
        <ul>
          <li><strong>Bronze</strong> — basic coverage</li>
          <li><strong>Silver</strong> — standard coverage</li>
          <li><strong>Gold</strong> — full coverage</li>
        </ul>

        <h3>Adding a PMC Intervention</h3>
        <p>Click <strong>Add PMC</strong> at the top-right of the Maintenance Contracts page. This opens the intervention form pre-configured for a PMC job, with the contract coverage banner shown automatically.</p>

        <h3>Contract parts</h3>
        <p>Click the <em>parts icon</em> on a contract row to manage the parts list included in that contract.</p>

        <h3>Sorting</h3>
        <p>Click any column header to sort the contract table. Columns include: Job #, Client, Machine, District, Location, Frequency, Progress, Start/End dates, and Status.</p>

        <h3>Expiry notifications</h3>
        <p>Contracts expiring within 30 days trigger a notification in the <strong>Notification Center</strong>. The Head Administrator also sees an alert automatically on login.</p>
      `
    },

    {
      id:       'mc-forecast',
      category: 'Maintenance Contracts',
      icon:     '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
      title:    'Maintenance Forecast',
      roles:    ['admin', 'superadmin'],
      summary:  'See upcoming scheduled maintenance visits across all contracts.',
      body: `
        <h3>Overview</h3>
        <p>The Maintenance Forecast gives a forward-looking view of all PMC visits that are due or planned across all active maintenance contracts.</p>

        <h3>Reading the forecast</h3>
        <p>Each row represents one scheduled PMC visit. The <em>Due Date</em> column shows when the visit should happen. Colour coding indicates urgency:</p>
        <ul>
          <li><strong>Red</strong> — overdue</li>
          <li><strong>Orange</strong> — due soon</li>
          <li><strong>Green</strong> — on track</li>
        </ul>

        <h3>Acting on the forecast</h3>
        <p>Click <em>View</em> on any row to open the related intervention and schedule or update it.</p>
      `
    },

    /* ────────────── PMC ────────────────────────────────────── */
    {
      id:       'pmc-overview',
      category: 'PMC',
      icon:     '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      title:    'PMC Visit Tracker',
      roles:    ['admin', 'superadmin'],
      summary:  'Monitor visit completion progress per contract.',
      body: `
        <h3>What the PMC section shows</h3>
        <p>The PMC section lists every preventive maintenance visit across all contracts, grouped with a visit number (1st, 2nd, 3rd…) and a completion status.</p>

        <h3>Visit statuses</h3>
        <ul>
          <li><strong>Completed</strong> — the visit has been done and the intervention is marked complete.</li>
          <li><strong>Ongoing / Assigned</strong> — an intervention exists and is in progress.</li>
          <li><strong>Overdue</strong> — the scheduled date has passed and the visit is not complete.</li>
          <li><strong>Planned / Tentative</strong> — scheduled but not yet started.</li>
        </ul>

        <h3>Year filter</h3>
        <p>Use the <em>Year</em> dropdown to focus on a specific year's visits.</p>

        <h3>Progress column</h3>
        <p>The progress bar shows how many visits out of the total frequency have been completed for that contract (e.g. 2 / 4 for a quarterly contract).</p>
      `
    },

    /* ────────────── REPORTS & ANALYTICS ───────────────────── */
    {
      id:       'rep-overview',
      category: 'Reports & Analytics',
      icon:     '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      title:    'Reports',
      roles:    ['admin', 'superadmin'],
      summary:  'Generate date-range reports on service performance.',
      body: `
        <h3>Overview</h3>
        <p>The Reports page generates a performance summary for a selected date range — useful for team reviews, client reporting, or management briefings.</p>

        <h3>Setting the date range</h3>
        <p>Use the <em>From</em> and <em>To</em> date pickers, or choose a preset:</p>
        <ul>
          <li><strong>This Month</strong> — current calendar month</li>
          <li><strong>Last 3 Months</strong> — rolling 90 days</li>
          <li><strong>All Time</strong> — every intervention on record</li>
        </ul>

        <h3>What the report includes</h3>
        <ul>
          <li>Total interventions, completion rate, average response time</li>
          <li>Breakdown by type, priority, and status</li>
          <li>Technician performance table (jobs completed per technician)</li>
          <li>Client activity summary</li>
        </ul>

        <h3>Printing</h3>
        <p>Click <strong>Print</strong> to open the browser print dialog. The report is formatted for A4 output.</p>
      `
    },

    {
      id:       'anl-overview',
      category: 'Reports & Analytics',
      icon:     '<path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/>',
      title:    'Analytics',
      roles:    ['admin', 'superadmin'],
      summary:  'Visual charts and trend analysis for operations.',
      body: `
        <h3>Overview</h3>
        <p>The Analytics page provides interactive charts to help you spot trends and patterns in service operations over time.</p>

        <h3>Available charts</h3>
        <ul>
          <li><strong>Interventions over time</strong> — monthly bar chart of all jobs logged.</li>
          <li><strong>Status distribution</strong> — pie / doughnut breakdown of current job statuses.</li>
          <li><strong>Priority distribution</strong> — proportion of urgent, high, medium, and low jobs.</li>
          <li><strong>Technician workload</strong> — comparative bar chart per technician.</li>
          <li><strong>Type distribution</strong> — breakdown by intervention type.</li>
        </ul>

        <h3>KPI strip</h3>
        <p>The row of KPI cards at the top shows summary numbers: total interventions, completion rate, average open days, and SLA breach count.</p>
      `
    },

    /* ────────────── PARTS & INVENTORY ─────────────────────── */
    {
      id:       'parts-overview',
      category: 'Parts & Inventory',
      icon:     '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
      title:    'Parts & Inventory',
      roles:    ['all'],
      summary:  'Browse all parts used across interventions and export the catalog.',
      body: `
        <h3>What this section shows</h3>
        <p>Parts & Inventory is an <strong>aggregated read-only catalog</strong> of every part reference recorded across all interventions. It is automatically built from parts added in job detail modals — there is no manual entry here.</p>

        <h3>KPI strip</h3>
        <p>The cards at the top show: total unique part references, total part entries, and most-used parts.</p>

        <h3>Searching</h3>
        <p>Use the search bar to filter by <em>part reference</em> or <em>description</em>. Results update as you type.</p>

        <h3>Sorting</h3>
        <p>Click column headers to sort by reference, description, or usage count.</p>

        <h3>Exporting</h3>
        <p>Click <strong>Export CSV</strong> to download the full catalog as a spreadsheet.</p>

        <h3>Adding parts</h3>
        <p>Parts are added from the <em>Parts tab</em> inside a <strong>Job Detail Modal</strong>. Once saved, they appear in this catalog automatically.</p>
      `
    },

    /* ────────────── JOB TRACKER ────────────────────────────── */
    {
      id:       'tracker-overview',
      category: 'Job Tracker',
      icon:     '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      title:    'Job Tracker',
      roles:    ['admin', 'superadmin'],
      summary:  'Real-time view of all active jobs with elapsed time.',
      body: `
        <h3>Overview</h3>
        <p>The Job Tracker shows all currently active (open) interventions with a live elapsed-time counter, helping the team spot jobs that have been open too long.</p>

        <h3>Reading the tracker</h3>
        <ul>
          <li><strong>Elapsed time</strong> — how long since the job was created or last updated.</li>
          <li><strong>Colour coding</strong> — green (on track), orange (approaching SLA), red (SLA breached).</li>
        </ul>

        <h3>Acting on a job</h3>
        <p>Click <em>View</em> to open the job detail modal and update the status or add notes.</p>
      `
    },

    /* ────────────── NOTIFICATIONS ──────────────────────────── */
    {
      id:       'notif-overview',
      category: 'Notifications',
      icon:     '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
      title:    'Notification Center',
      roles:    ['all'],
      summary:  'View and manage all system alerts in one place.',
      body: `
        <h3>What triggers a notification?</h3>
        <p>The system automatically generates alerts for:</p>
        <ul>
          <li><strong>Overdue jobs</strong> — open interventions past their scheduled date.</li>
          <li><strong>Upcoming jobs</strong> — jobs scheduled within the next 24 hours or 6 hours.</li>
          <li><strong>SLA breaches</strong> — urgent or high-priority jobs open for more than 3 days.</li>
          <li><strong>Expiring contracts</strong> — maintenance contracts expiring within 30 days.</li>
          <li><strong>PMC visits due</strong> — preventive maintenance visits due today or this week.</li>
          <li><strong>Unplanned requests</strong> — interventions with no scheduled date.</li>
          <li><strong>Outdated inventory</strong> — the Store Inventory has not been updated in more than 3 days. Click <em>View</em> to go to the Store Inventory page. (Head Administrator only)</li>
        </ul>

        <h3>Tabs</h3>
        <p>Notifications are grouped into category tabs at the top of the page: <em>All, Jobs, Contracts, Inventory,</em> and others. Switch tabs to focus on a specific type of notification.</p>

        <h3>Sidebar badge</h3>
        <p>The red badge next to <em>Notifications</em> in the sidebar shows the total unread count. It updates automatically.</p>

        <h3>Navigating to a job</h3>
        <p>Click the <strong>View</strong> button on any notification to jump straight to the Interventions table pre-filtered to that specific job. The job detail modal opens automatically.</p>

        <h3>Dismissing notifications</h3>
        <p>Click the <strong>×</strong> on any notification to dismiss it individually, or use <strong>Dismiss All</strong> to clear the current category at once. Dismissed notifications do not reappear unless the underlying issue changes.</p>

        <h3>Muting notifications</h3>
        <p>Click the <strong>Mute</strong> button (bell-off icon) in the page header to silence all on-screen notifications. While muted:</p>
        <ul>
          <li>No notification banners are shown on the Dashboard.</li>
          <li>The sidebar badge is hidden.</li>
          <li>The notification list appears empty.</li>
        </ul>
        <p>Click <strong>Unmute</strong> to restore notifications. The mute preference is saved per browser and persists across sessions.</p>
      `
    },

    /* ────────────── ALERTS (SCHEDULER BELL) ───────────────── */
    {
      id:       'alerts-overview',
      category: 'Alerts',
      icon:     '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/>',
      title:    'Alerts Panel',
      roles:    ['admin', 'superadmin'],
      summary:  'Real-time alert bell for overdue, urgent, and upcoming jobs.',
      body: `
        <h3>What is the Alerts Panel?</h3>
        <p>The <strong>bell icon</strong> in the top-right corner of the sidebar opens the Alerts panel — a live feed of time-sensitive job alerts that require immediate attention.</p>

        <h3>What triggers an alert?</h3>
        <ul>
          <li><strong>Overdue jobs</strong> — open interventions past their scheduled date.</li>
          <li><strong>Urgent/High SLA breach</strong> — urgent or high-priority jobs open for more than 3 days.</li>
          <li><strong>Jobs due today</strong> — interventions scheduled for the current day.</li>
          <li><strong>Jobs due soon</strong> — jobs scheduled within the next 6 hours.</li>
          <li><strong>Unplanned jobs</strong> — open interventions with no scheduled date.</li>
        </ul>

        <h3>Alert badge</h3>
        <p>A red number badge on the bell icon shows the total active alert count. It updates automatically every few minutes.</p>

        <h3>Navigating to a job</h3>
        <p>Click <strong>View</strong> on any alert to go straight to the Interventions table filtered to that job. The job detail modal opens automatically.</p>

        <h3>Muting alerts</h3>
        <p>Click the <strong>mute button</strong> (bell-strikethrough icon) inside the alerts panel header to silence all alerts. While muted:</p>
        <ul>
          <li>The alert badge is hidden.</li>
          <li>The alerts panel shows an empty state.</li>
          <li>No alerts fire in the background.</li>
        </ul>
        <p>Click the button again to unmute. The mute preference is saved per browser and persists across sessions.</p>
      `
    },

    /* ────────────── CHAT ───────────────────────────────────── */
    {
      id:       'chat-overview',
      category: 'Chat',
      icon:     '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
      title:    'Team Chat',
      roles:    ['all'],
      summary:  'Send messages to the whole team or privately to one person.',
      body: `
        <h3>Overview</h3>
        <p>The Chat section provides real-time messaging for the whole team. You can talk to everyone at once via the <strong>Public Channel</strong>, or send a private message to a specific colleague.</p>

        <h3>Public Channel</h3>
        <p>The <em>Public Channel</em> is visible to all users. Use it for general announcements, quick questions, or team coordination.</p>

        <h3>Private Messages</h3>
        <p>Click any colleague's name in the left panel to open a private direct message conversation. Only you and that person can see these messages.</p>

        <h3>Unread badges</h3>
        <p>A red badge on the <em>Chat</em> sidebar item shows the total number of unread messages across all conversations. Each conversation also shows its own badge count in the list.</p>

        <h3>Read receipts</h3>
        <p>In private conversations, a <strong>"Seen"</strong> indicator with a double-checkmark appears under your last message once the other person has read it.</p>

        <h3>Deleting a message</h3>
        <p>Hover over any message to reveal the <em>trash icon</em>. For your own messages, deleting removes it for everyone. For others' messages, it hides the message only from your view.</p>

        <h3>Sending file attachments</h3>
        <p>Click the <strong>paperclip icon</strong> next to the message input (or drag and drop a file onto the input area) to attach a file to your message.</p>
        <ul>
          <li><strong>Supported types</strong> — images (JPG, PNG, GIF, WebP), documents (PDF, Word, Excel, PowerPoint), text files, and more.</li>
          <li><strong>Size limit</strong> — 5 MB per file.</li>
          <li>A preview bar appears above the input showing the staged file. Click the <strong>×</strong> to cancel the attachment before sending.</li>
        </ul>
        <p>In the conversation:</p>
        <ul>
          <li><strong>Images</strong> are displayed inline as thumbnails. Click any image to open it full-size.</li>
          <li><strong>Documents</strong> appear as a file card with a download link so the recipient can save the file.</li>
        </ul>
        <p class="help-note">⚠ Only one file can be attached per message. To share multiple files, send them as separate messages.</p>

        <h3>Keyboard shortcut</h3>
        <p>Press <kbd>Enter</kbd> to send a message. Press <kbd>Shift</kbd> + <kbd>Enter</kbd> to add a new line.</p>
      `
    },

    /* ────────────── USERS ──────────────────────────────────── */
    {
      id:       'users-overview',
      category: 'Users',
      icon:     '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
      title:    'User Management',
      roles:    ['superadmin'],
      summary:  'Create, edit, and deactivate team accounts.',
      body: `
        <h3>Overview</h3>
        <p>The Users section is available to the <strong>Head Administrator</strong> only. It allows creating and managing all team accounts.</p>

        <h3>Creating a user</h3>
        <p>Click <strong>+ Add User</strong>. Fill in:</p>
        <ul>
          <li><strong>Full Name</strong></li>
          <li><strong>Email address</strong> — this becomes their login username.</li>
          <li><strong>Password</strong> — must be 8–10 characters with letters and numbers.</li>
          <li><strong>Role</strong> — Head Administrator, Admin, or Technician.</li>
        </ul>

        <h3>Editing a user</h3>
        <p>Click the <em>pencil icon</em> to update a user's name, phone, or role. Email cannot be changed after creation.</p>

        <h3>Deleting a user</h3>
        <p>Click the <em>trash icon</em> and confirm. This removes the user from the system. This action cannot be undone.</p>

        <h3>Role guidance</h3>
        <ul>
          <li>Assign <strong>Technician</strong> to field staff who only need to see their own jobs.</li>
          <li>Assign <strong>Admin</strong> to office staff who manage the full workflow.</li>
          <li>Only one or two people should have <strong>Head Administrator</strong> access.</li>
        </ul>
      `
    },

    /* ────────────── ACTION LOG ─────────────────────────────── */
    {
      id:       'log-overview',
      category: 'Action Log',
      icon:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
      title:    'Action Log',
      roles:    ['admin', 'superadmin'],
      summary:  'Full audit trail of every action taken in the system.',
      body: `
        <h3>What is the Action Log?</h3>
        <p>The Action Log records every significant action performed in the system — who did what, to which record, and when. It cannot be edited or deleted.</p>

        <h3>What gets logged?</h3>
        <ul>
          <li>Creating, editing, and deleting interventions</li>
          <li>Status changes on interventions</li>
          <li>Creating and editing clients, machines, contracts</li>
          <li>User password changes</li>
          <li>Contract parts management</li>
        </ul>

        <h3>Filtering</h3>
        <p>Use the filter bar to search by: <em>actor (user name), action type, target record,</em> or <em>date range</em>.</p>

        <h3>Why it matters</h3>
        <p>The action log is your accountability trail. If something unexpected happens to a record, you can trace exactly who made the change and when.</p>
      `
    },

    /* ────────────── MY ACCOUNT ─────────────────────────────── */
    {
      id:       'acc-overview',
      category: 'My Account',
      icon:     '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      title:    'My Account & Profile',
      roles:    ['all'],
      summary:  'Update your name, photo, phone, and password.',
      body: `
        <h3>Profile information</h3>
        <p>Click <strong>My Account</strong> in the sidebar to view and edit your profile.</p>
        <ul>
          <li><strong>Full Name</strong> — displayed throughout the app and in chat.</li>
          <li><strong>Phone</strong> — optional, visible to admins.</li>
          <li><strong>Email</strong> — cannot be changed; contact your Head Administrator.</li>
        </ul>

        <h3>Profile picture</h3>
        <p>Click the <em>camera icon</em> on your avatar to upload a profile picture. The image is automatically cropped and resized to a square. Supported formats: JPG, PNG, GIF, WebP (max 5 MB).</p>
        <p>Your photo appears in the sidebar, in the chat conversation list, and in message bubbles.</p>

        <h3>Changing your password</h3>
        <p>In the <em>Change Password</em> card:</p>
        <ol>
          <li>Enter your <strong>current password</strong> to verify your identity.</li>
          <li>Enter a <strong>new password</strong> (8–10 characters, letters and numbers required).</li>
          <li>Confirm the new password.</li>
          <li>Click <em>Update Password</em>.</li>
        </ol>
        <p class="help-note">⚠ After a successful password change you will be automatically signed out and must log in again with the new password.</p>

        <h3>Recent Activity</h3>
        <p>The bottom of the page shows your 8 most recent interventions. Click <em>View</em> on any row to open the job detail.</p>
      `
    },

    /* ────────────── SETTINGS ───────────────────────────────── */
    {
      id:       'settings-overview',
      category: 'Settings',
      icon:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
      title:    'Application Settings',
      roles:    ['all'],
      summary:  'Customise appearance, table size, dark mode, and session behaviour.',
      body: `
        <h3>Appearance</h3>
        <ul>
          <li><strong>Dark Mode</strong> — toggle between light and dark themes. Your preference is saved automatically.</li>
          <li><strong>Accent Colour</strong> — choose from 10 preset colours that affect buttons and highlights throughout the app.</li>
          <li><strong>Sidebar Theme</strong> — Navy, Gray, or Blue sidebar style.</li>
          <li><strong>Font Size</strong> — Small, Medium, or Large text size.</li>
          <li><strong>Brightness</strong> — fine-tune the overall brightness of the interface.</li>
        </ul>

        <h3>Table page size</h3>
        <p>Set how many rows appear per page in all data tables (10, 20, 50, or 100).</p>

        <h3>Auto-Refresh</h3>
        <p>When enabled, the app periodically re-fetches data in the background. Useful if you leave the app open on a screen without interacting with it.</p>

        <h3>Session Persistence</h3>
        <p>Choose <em>Stay Logged In</em> (remembered across browser restarts) or <em>Session Per Tab</em> (signed out when the tab closes). Changing this requires your password.</p>

        <h3>Reset to Defaults</h3>
        <p>Click <strong>Reset to Defaults</strong> to restore all settings to their original values.</p>
      `
    },

    /* ────────────── EQUIPMENT HISTORY ─────────────────────── */
    {
      id:       'eq-overview',
      category: 'Equipment History',
      icon:     '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
      title:    'Equipment History Report',
      roles:    ['all'],
      summary:  'Full lifecycle dossier for any machine — timeline, PMC, issues, and archived records.',
      body: `
        <h3>What is Equipment History?</h3>
        <p>The Equipment History section generates a complete lifecycle report for any machine by its <strong>serial number</strong>. It is a <em>read-only</em> view available to all roles. It aggregates data from interventions, PMC contracts, deleted jobs, and cancelled jobs into a single dossier.</p>

        <h3>Searching for a machine</h3>
        <p>Enter a serial number in the search field. An autocomplete list suggests serials already registered in the system. Press <em>Generate Report</em> to load the dossier.</p>

        <h3>Equipment Overview</h3>
        <p>The header card shows the serial number, machine model, assigned client, location, first recorded date, and current machine status (Active, Under PMC, Decommissioned, etc.).</p>

        <h3>Summary Insights</h3>
        <p>Six KPI cards give an instant count of: Total Events, PMC Visits, Breakdowns, Paused jobs, Cancelled jobs, and Deleted records. Below the cards, smart pattern pills highlight notable findings — for example: <em>"3 breakdowns occurred during active PMC coverage"</em> or <em>"2 gaps detected between contracts"</em>.</p>

        <h3>Filtering the report</h3>
        <p>Use the filter bar above the timeline to narrow events by:</p>
        <ul>
          <li><strong>Year</strong> — show only events from a specific year.</li>
          <li><strong>Type</strong> — All, PMC, Breakdown, Cancelled, or Deleted.</li>
        </ul>

        <h3>Timeline</h3>
        <p>All events are displayed in chronological order on a vertical timeline, grouped by year. Each entry shows the date, intervention type, status, technician, and a short description. Two special badges may appear on timeline entries:</p>
        <ul>
          <li><span style="background:#D1FAE5;color:#065F46;padding:1px 7px;border-radius:99px;font-size:0.78em;font-weight:600">Covered by PMC</span> — the intervention fell within an active maintenance contract period.</li>
          <li><span style="background:#FEF3C7;color:#92400E;padding:1px 7px;border-radius:99px;font-size:0.78em;font-weight:600">Outside Contract</span> — the machine had contracts but this intervention was outside their coverage dates.</li>
        </ul>

        <h3>PMC Contract History</h3>
        <p>Lists all maintenance contracts for the machine with start/end dates, tier, visits per year, and completed visit count. The system automatically highlights:</p>
        <ul>
          <li><strong>Overlapping contracts</strong> — two contracts whose date ranges overlap (flagged in red).</li>
          <li><strong>Coverage gaps</strong> — periods between consecutive contracts where no contract was active.</li>
        </ul>

        <h3>Issues &amp; Breakdown History</h3>
        <p>Shows all breakdown repairs, technical support calls, and jobs that were paused at any point. Each entry includes the resolution note (if completed) and all pause reasons with the name of who paused the job.</p>

        <h3>Deleted &amp; Cancelled Records</h3>
        <p>Even if an intervention was deleted from the main system or cancelled, it still appears here for audit purposes. Each archived record shows the reason and the person who performed the action.</p>

        <h3>Print / Export PDF</h3>
        <p>Click <strong>Print / Export PDF</strong> (available in both the filter bar and the bottom print bar) to open the browser print dialog. The report is formatted for printing — navigation, filters, and buttons are hidden, and a report header is added automatically. Use <em>Save as PDF</em> in the print dialog to export a file.</p>
      `
    },

    /* ────────────── STORE INVENTORY ───────────────────────── */
    {
      id:       'si-overview',
      category: 'Store Inventory',
      icon:     '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>',
      title:    'Store Inventory Overview',
      roles:    ['all'],
      summary:  'Browse spare parts stock, filter by quantity, and view distribution charts.',
      body: `
        <h3>What is Store Inventory?</h3>
        <p>The Store Inventory section displays the current stock of spare parts and consumables held in the service store. All roles can <strong>view</strong> the inventory; only the <strong>Head Administrator</strong> can import or update it.</p>

        <h3>Key Statistics</h3>
        <p>Four KPI cards at the top of the page summarise the current stock state:</p>
        <ul>
          <li><strong>Total References</strong> — number of distinct part references on record.</li>
          <li><strong>Total Stock Units</strong> — combined quantity across all references.</li>
          <li><strong>Low Stock</strong> — references with quantity between 1 and 5 (inclusive).</li>
          <li><strong>Out of Stock</strong> — references with a quantity of zero.</li>
        </ul>

        <h3>Stock Distribution Chart</h3>
        <p>A proportional bar chart beneath the KPI row shows the split between <em>OK</em>, <em>Low</em>, and <em>Out of Stock</em> items at a glance. A legend shows exact counts for each segment.</p>

        <h3>Top 5 Highest / Top 5 Lowest</h3>
        <p>Two horizontal bar charts identify the references with the most and fewest units in stock, helping you prioritise re-ordering decisions.</p>

        <h3>Filtering the table</h3>
        <p>Three tools let you narrow the parts list:</p>
        <ul>
          <li><strong>Search bar</strong> — matches any text in the reference number or description.</li>
          <li><strong>Quick-filter chips</strong> — <em>All</em>, <em>Low Stock</em>, or <em>Out of Stock</em>.</li>
          <li><strong>Advanced Quantity Filter</strong> — filter by exact quantity, greater than, less than, or a range (between a minimum and maximum value, both ends inclusive).</li>
        </ul>
        <p>When any filter is active a <strong>Clear Filters</strong> button appears at the right of the toolbar. Click it to reset all filters at once.</p>

        <h3>Stock badges</h3>
        <p>Each row shows a coloured quantity badge:</p>
        <ul>
          <li><span style="background:#16a34a;color:#fff;padding:1px 7px;border-radius:99px;font-size:0.78em">OK</span> — quantity is 6 or more.</li>
          <li><span style="background:#d97706;color:#fff;padding:1px 7px;border-radius:99px;font-size:0.78em">LOW</span> — quantity is 1–5.</li>
          <li><span style="background:#dc2626;color:#fff;padding:1px 7px;border-radius:99px;font-size:0.78em">OUT</span> — quantity is 0.</li>
        </ul>
        <p>Low-stock rows are highlighted in amber and out-of-stock rows are highlighted in red for quick visual scanning.</p>

        <h3>Last Updated banner</h3>
        <p>A banner below the page title shows when the inventory was last imported and by whom. If the data is more than 3 days old the banner turns amber and displays a warning — a notification also appears in the Notifications section. The Head Administrator should re-import updated stock data regularly.</p>
      `
    },

    {
      id:       'si-import',
      category: 'Store Inventory',
      icon:     '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>',
      title:    'Importing Inventory (CSV)',
      roles:    ['superadmin'],
      summary:  'Head Administrator only — replace the full inventory via CSV upload.',
      body: `
        <h3>Who can import?</h3>
        <p>Only the <strong>Head Administrator</strong> can upload a new inventory. The import <strong>fully replaces</strong> the existing stock data — it is not a merge or append.</p>

        <h3>CSV format</h3>
        <p>The file must be a comma-separated (.csv) file with the following columns (order does not matter — they are detected automatically from the header row):</p>
        <ul>
          <li><strong>reference</strong> (or <em>ref</em>, <em>part_number</em>, <em>part number</em>) — the part reference code.</li>
          <li><strong>description</strong> (or <em>desc</em>, <em>name</em>) — a plain-text description of the part.</li>
          <li><strong>quantity</strong> (or <em>qty</em>, <em>stock</em>) — a whole number representing the quantity in store.</li>
        </ul>
        <p class="help-note">⚠ The first row must be the header row. Rows where the reference or description is blank are skipped automatically.</p>

        <h3>How to import</h3>
        <ol>
          <li>In the Store Inventory page, click the <strong>Import CSV</strong> button (top-right).</li>
          <li>A file picker opens — select your .csv file.</li>
          <li>A preview modal shows a summary of what was detected (number of rows, sample data). Review it before confirming.</li>
          <li>Click <strong>Confirm Import</strong> to apply. The existing inventory is wiped and replaced with the new data.</li>
        </ol>
        <p>After a successful import, the <em>Last Updated</em> banner refreshes immediately and shows your name and the current timestamp.</p>

        <h3>When to re-import</h3>
        <p>The system tracks the date of the last import. If no import has been done in more than <strong>3 days</strong>, a warning appears in the banner and a notification fires in the Notifications section. Keep the inventory up-to-date so the team has accurate stock information.</p>
      `
    },

    /* ────────────── CANCELLED JOBS ────────────────────────── */
    {
      id:       'cj-overview',
      category: 'Cancelled Jobs',
      icon:     '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      title:    'Cancelled Jobs Log',
      roles:    ['admin', 'superadmin'],
      summary:  'View and manage interventions that were cancelled, with full audit trail.',
      body: `
        <h3>What is the Cancelled Jobs log?</h3>
        <p>When an intervention is set to <strong>Cancelled</strong> status, a copy of the full job record is automatically archived here. The Cancelled Jobs section is an audit trail — it does <em>not</em> remove the job from the main Interventions table.</p>

        <h3>Cancelling an intervention</h3>
        <ol>
          <li>Open the <strong>Edit Intervention</strong> modal for the job.</li>
          <li>Change the <strong>Status</strong> dropdown to <em>Cancelled</em>.</li>
          <li>A <strong>Cancellation Reason</strong> field appears — this is <strong>mandatory</strong>. Enter a clear reason before saving.</li>
          <li>Click <em>Save Changes</em>. The job status is updated and the record is logged in Cancelled Jobs.</li>
        </ol>
        <p class="help-note">⚠ The cancellation reason cannot be left blank. The form will not submit without it.</p>

        <h3>Viewing a cancelled job</h3>
        <p>Click <em>View</em> on any row in the Cancelled Jobs table to open a full detail modal. It shows all original job information — client, machine, technicians, status history, notes, and parts — plus the cancellation reason and who cancelled it.</p>

        <h3>Purge Queue (Head Administrator only)</h3>
        <p>The Head Administrator can permanently delete cancelled job records from the log. This is a two-step process:</p>
        <ol>
          <li>Click <strong>Queue for Deletion</strong> on a row. A confirmation dialog requires a reason and password re-authentication.</li>
          <li>Once queued, the record enters a <strong>24-hour countdown</strong>. During this window, the deletion can be undone by clicking <em>Undo</em>.</li>
          <li>After 24 hours the record is permanently purged from the system.</li>
        </ol>
        <p class="help-note">⚠ Purging is irreversible after the 24-hour window expires. Use this only to clean up erroneous or test records.</p>
      `
    },

    /* ────────────── MY JOBS ────────────────────────────────── */
    {
      id:       'myjobs-overview',
      category: 'My Jobs',
      icon:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      title:    'My Jobs (Technician View)',
      roles:    ['all'],
      summary:  'View your assigned jobs, filter by urgency, and open job details.',
      body: `
        <h3>Overview</h3>
        <p><strong>My Jobs</strong> is a read-only view of all interventions assigned to you. Admins see all interventions; technicians see only their own assignments.</p>

        <h3>Filter tabs</h3>
        <ul>
          <li><strong>Open</strong> — all active (non-completed) jobs.</li>
          <li><strong>Today</strong> — jobs scheduled for today.</li>
          <li><strong>Overdue</strong> — open jobs past their scheduled date.</li>
          <li><strong>Completed</strong> — finished or cancelled jobs.</li>
          <li><strong>All</strong> — everything regardless of status.</li>
        </ul>

        <h3>KPI row</h3>
        <p>The four cards at the top show at a glance: how many jobs are today, open, urgent, and overdue.</p>

        <h3>Sorting</h3>
        <p>Use the <em>Sort by</em> dropdown to order by: Scheduled Date, Priority, Client, or Created Date. Toggle ascending/descending with the arrow button.</p>

        <h3>Viewing a job</h3>
        <p>This section is <strong>view-only</strong>. Click <em>View</em> on any card to open the full job detail modal where you can read notes, see history, and review parts.</p>
      `
    },

  ],

  /* ── Computed helpers ─────────────────────────────────────── */
  _categories() {
    const seen = new Set();
    const cats = [];
    this._articles.forEach(a => {
      if (!seen.has(a.category)) { seen.add(a.category); cats.push(a.category); }
    });
    return cats;
  },

  _filtered() {
    const q = this._searchQuery.toLowerCase().trim();
    const role = appState.currentUser?.role || 'technician';
    return this._articles.filter(a => {
      // Role filter
      if (!a.roles.includes('all') && !a.roles.includes(role)) return false;
      // Search filter
      if (!q) return true;
      return a.title.toLowerCase().includes(q) ||
             a.summary.toLowerCase().includes(q) ||
             a.category.toLowerCase().includes(q) ||
             a.body.toLowerCase().includes(q);
    });
  },

  /* ── Mount ────────────────────────────────────────────────── */
  mount() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    this._activeArticle = this._activeArticle || null;
    content.innerHTML = this._template();
    this._bindEvents();
    this._renderList();
    if (this._activeArticle) this._openArticle(this._activeArticle);
  },

  /* ── Template ─────────────────────────────────────────────── */
  _template() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22" style="vertical-align:-4px;margin-right:8px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Help Center
          </h1>
          <p class="page-subtitle">Guides and documentation for the GPS Service Management platform</p>
        </div>
      </div>

      <div class="help-layout">

        <!-- LEFT: search + article list -->
        <div class="help-sidebar">
          <div class="help-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" class="help-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="helpSearchInput" class="help-search" placeholder="Search articles…" autocomplete="off">
          </div>
          <div id="helpArticleList" class="help-article-list"></div>
        </div>

        <!-- RIGHT: article body -->
        <div class="help-body" id="helpBody">
          <div class="help-welcome">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h2>Welcome to the Help Center</h2>
            <p>Select an article from the left to get started, or use the search bar to find what you need.</p>
            <div class="help-quick-links" id="helpQuickLinks"></div>
          </div>
        </div>

      </div>
    `;
  },

  /* ── Render article list ──────────────────────────────────── */
  _renderList() {
    const list    = document.getElementById('helpArticleList');
    const qlEl    = document.getElementById('helpQuickLinks');
    if (!list) return;

    const filtered = this._filtered();
    const cats     = [];
    const seen     = new Set();
    filtered.forEach(a => { if (!seen.has(a.category)) { seen.add(a.category); cats.push(a.category); } });

    if (filtered.length === 0) {
      list.innerHTML = `<div class="help-no-results">No articles match your search.</div>`;
      return;
    }

    list.innerHTML = cats.map(cat => {
      const articles = filtered.filter(a => a.category === cat);
      return `
        <div class="help-cat-group">
          <div class="help-cat-label">${cat}</div>
          ${articles.map(a => `
            <div class="help-article-item${this._activeArticle === a.id ? ' active' : ''}" data-id="${a.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="help-item-icon"><${a.icon}/></svg>
              <div>
                <div class="help-item-title">${a.title}</div>
                <div class="help-item-summary">${a.summary}</div>
              </div>
            </div>`).join('')}
        </div>`;
    }).join('');

    // Quick links on welcome screen
    if (qlEl) {
      const featured = filtered.slice(0, 6);
      qlEl.innerHTML = featured.map(a => `
        <button class="help-quick-btn" data-id="${a.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><${a.icon}/></svg>
          ${a.title}
        </button>`).join('');
      qlEl.querySelectorAll('.help-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => this._openArticle(btn.dataset.id));
      });
    }

    list.querySelectorAll('.help-article-item').forEach(item => {
      item.addEventListener('click', () => this._openArticle(item.dataset.id));
    });
  },

  /* ── Open article ─────────────────────────────────────────── */
  _openArticle(id) {
    const article = this._articles.find(a => a.id === id);
    if (!article) return;
    this._activeArticle = id;

    // Update active state in list
    document.querySelectorAll('.help-article-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    const body = document.getElementById('helpBody');
    if (!body) return;

    const roleLabels = { all: 'All users', admin: 'Admin', superadmin: 'Head Administrator', technician: 'Technician' };
    const rolePills  = article.roles.map(r => `<span class="help-role-pill">${roleLabels[r] || r}</span>`).join('');

    body.innerHTML = `
      <div class="help-article">
        <div class="help-article-header">
          <div class="help-article-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><${article.icon}/></svg>
          </div>
          <div>
            <div class="help-article-cat">${article.category}</div>
            <h2 class="help-article-title">${article.title}</h2>
            <div class="help-article-roles">${rolePills}</div>
          </div>
        </div>
        <div class="help-article-body">
          ${article.body}
        </div>
      </div>`;
  },

  /* ── Bind events ──────────────────────────────────────────── */
  _bindEvents() {
    const input = document.getElementById('helpSearchInput');
    if (input) {
      input.value = this._searchQuery;
      input.addEventListener('input', () => {
        this._searchQuery   = input.value;
        this._activeArticle = null;
        this._renderList();
        document.getElementById('helpBody').innerHTML = `
          <div class="help-welcome">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h2>Search results</h2>
            <p>Select an article on the left to read it.</p>
          </div>`;
      });
      setTimeout(() => input.focus(), 80);
    }
  }
};
