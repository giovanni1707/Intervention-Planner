# BPS Service Management — Complete User Guide

**Giovanni Packaging Solution · MULTIVAC Group — Indian Ocean Region**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Dashboard](#4-dashboard)
5. [Clients](#5-clients)
6. [Interventions](#6-interventions)
7. [Planning](#7-planning)
8. [Technicians](#8-technicians)
9. [Maintenance Contracts](#9-maintenance-contracts)
10. [Maintenance Forecast](#10-maintenance-forecast)
11. [Reports](#11-reports)
12. [Job Tracker](#12-job-tracker)
13. [Deleted Jobs](#13-deleted-jobs)
14. [Action Log](#14-action-log)
15. [Users](#15-users)
16. [Settings](#16-settings)
17. [PMC Workflow (End-to-End)](#17-pmc-workflow-end-to-end)
18. [Data & Security](#18-data--security)
19. [Demo Credentials](#19-demo-credentials)

---

## 1. Overview

BPS Service Management is a browser-based single-page application (no installation required) for managing field service operations — including client relationships, machine maintenance, technician scheduling, and preventive maintenance contracts (PMC).

All data is stored locally in the browser (localStorage). No internet connection is required after the page loads.

---

## 2. Getting Started

### Launching the App

Open `app/index.html` in any modern web browser. The application runs entirely in the browser — no server or installation is needed.

### Logging In

1. Enter your **email address** and **password** on the login screen.
2. Click **Sign In**.
3. You will be directed to the Dashboard based on your role.

### Logging Out

Click the **logout icon** (→) at the bottom of the left sidebar, next to your name.

---

## 3. User Roles & Permissions

The application has three user roles. Each role controls what sections are visible and what actions are allowed.

| Feature | Technician | Admin | Head Administrator (SuperAdmin) |
|---|---|---|---|
| Dashboard | View only | Full access | Full access |
| Clients | — | Full CRUD | Full CRUD |
| Interventions | View & update own | Full CRUD | Full CRUD |
| Planning | — | Full access | Full access |
| Technicians | — | View | Full access (edit users) |
| Maintenance Contracts | — | Full access | Full access |
| Maintenance Forecast | — | Full access | Full access |
| Reports | — | Full access | Full access |
| Job Tracker | — | Full access | Full access |
| Deleted Jobs | — | View | View + Purge |
| Action Log | — | — | Full access |
| Users | — | — | Full access |
| Settings | All users | All users | All users |

### Role Summary

- **Technician** — Can see and update the status of interventions assigned to them. Cannot access client, planning, contract, or report sections.
- **Admin** — Full access to all operational features. Can create, edit, and delete most records. Cannot manage users or view the action log.
- **Head Administrator (SuperAdmin)** — Full access to everything, including user management, action log, and the ability to permanently purge deleted records.

---

## 4. Dashboard

The Dashboard is the first screen after login. It provides a real-time overview of operations.

### KPI Cards

| Card | What It Shows |
|---|---|
| Today's Interventions | Number of interventions scheduled for today |
| Open Tickets | All interventions not yet completed or cancelled |
| Urgent Cases | Urgent-priority interventions that are still open |
| Completion Rate | Percentage of interventions completed this month |

### Alert Banners

- **Urgent Alert** — Appears when there are open urgent-priority interventions requiring immediate attention.
- **Unplanned Requests** — Appears when there are new interventions with no scheduled date. Links to the Planning board.

### Charts

- **Status Breakdown** — Doughnut chart showing distribution of all interventions by status.
- **Weekly Activity** — Bar chart showing intervention activity for the last 7 days.

### Recent Interventions Table

Displays the 8 most recently created interventions with: ID, Client, Machine, Type, Priority, Status, Technician, Scheduled Date, and a view button.

**New Intervention button** — Opens the create intervention form directly from the dashboard.

---

## 5. Clients

Manage all client companies. Accessible to Admins and SuperAdmins only.

### Client Table

| Column | Description |
|---|---|
| Client ID | Unique identifier (monospace) |
| Company | Company name |
| Contact Person | Primary contact name |
| Phone | Contact phone number |
| Email | Clickable email link |
| Region | Geographic region |
| Machines | Count of registered machines |
| Added | Date the client was added |
| Actions | View / Edit / Delete |

You can **search** by company name, contact person, email, phone, or region.

You can **sort** by: Client ID, Company, Contact Person, Region, Machine Count, or Date Added.

**Pagination** is controlled by your page size setting (default: 20 rows per page).

### Adding a Client

1. Click **Add Client**.
2. Fill in:
   - **Company Name** *(required)*
   - Industry
   - Contact Person
   - Region
   - Phone Numbers (add multiple with the + button)
   - Email
3. Click **Save Client**.

### Editing a Client

Click the **pencil icon** on any client row to open the edit form with current values pre-filled.

### Viewing Client Details

Click the **eye icon** to open the Client Detail modal, which shows:

- Full client info (ID, company, industry, region, since date)
- Contact details (person, phones, email)
- Statistics (machine count, total interventions, open interventions, last service date)
- Linked machines table (model, serial, type, contract)

### Deleting a Client

Click the **trash icon**. A secure confirmation dialog will appear requiring:

1. The **Client ID** (last 8 characters, uppercase)
2. Your **admin email address**
3. Your **admin password**
4. Type the word **delete** exactly
5. A **reason** for deletion

> **Warning:** Deletion is permanent and irreversible.

---

## 6. Interventions

The core of the application. Manage all service requests and field jobs.

### Views

Use the toggle buttons to switch between:

- **Table View** — Spreadsheet-style list with sorting and pagination
- **Kanban View** — Cards grouped by status column for visual workflow management

### Filters

Apply any combination of the following filters:

| Filter | Options |
|---|---|
| Status | All, New, Tentative, Assigned, On Going, Pending, Waiting for Parts, Completed, Cancelled |
| Priority | All, Low, Medium, High, Urgent |
| Type | All, Breakdown Repair, Preventive Maintenance, PMC, Installation & Commissioning, Technical Support |
| Technician | All or a specific technician |
| Client | All or a specific client |
| Location | All, Client Premises, Workshop |
| Date Range | From / To date pickers |

Click **Reset Filters** to clear all filters.

### Intervention Statuses

| Status | Meaning |
|---|---|
| **New** | Just created, not yet scheduled or assigned |
| **Tentative** | Provisionally scheduled, pending confirmation |
| **Assigned** | Assigned to a technician with a confirmed date |
| **On Going** | Technician is currently on site |
| **Pending** | On hold, awaiting a decision |
| **Waiting for Parts** | Work paused pending spare parts |
| **Completed** | Work finished and closed |
| **Cancelled** | Job cancelled (no fault found, or withdrawn) |

### Priority Levels

| Priority | Use When |
|---|---|
| **Low** | Routine, no urgency |
| **Medium** | Standard service request |
| **High** | Significant impact on operations |
| **Urgent** | Machine down, production halted — immediate response required |

Urgent interventions display a pulsing red badge.

### Creating an Intervention

1. Click **+ New Intervention**.
2. Fill in:
   - **Client** *(required)* — select from dropdown
   - **Machine** *(required)* — auto-filtered by client
   - **Type** *(required)* — Breakdown Repair, Preventive Maintenance, PMC, Installation, Technical Support
   - **Priority** *(required)* — Low / Medium / High / Urgent
   - **Description** *(required)* — free text description of the issue
   - **Location** — Client Premises or Workshop
3. **For PMC type only** — additional fields appear:
   - **Contract Start Date** *(required)* — when the maintenance contract begins
   - **Maintenances per Year** — 1, 2, 3, or 4 visits per year
   - The **Contract End Date** is auto-calculated as exactly 1 year from the start date
   - A maintenance contract is automatically created and linked to this intervention
4. Click **Save Intervention**.

### Editing an Intervention

Click the **pencil icon** on any row. The edit modal contains all fields plus:

- **Status** dropdown (role-restricted — see below)
- **Status Note** — optional explanation for the status change
- **Assigned Technician** (admin only)
- **Scheduled Date and Time** (admin only)
- **Notes** — add internal notes with author attribution
- **Parts Used** — log spare parts (reference, description, quantity)
- **Audit Trail** — read-only history of all changes

### Status Change Rules by Role

**Admin / Head Administrator** can set:
- Tentative
- Assigned
- Cancelled

**Technician** can set:
- On Going
- Pending
- Waiting for Parts
- Completed
- (For PMC interventions — see PMC section below)

**Technicians cannot edit a "New" intervention** — it must first be scheduled or assigned by an admin.

**Completed or Cancelled interventions are locked** — no further changes are allowed.

### PMC Status Updates (Technicians)

When an intervention is of type **PMC** and linked to a maintenance contract, the technician's status dropdown shows **sequential maintenance completion options** instead of the standard status list:

| Contract Visits/Year | Dropdown Options |
|---|---|
| 1 | Contract Maintenance – Completed |
| 2 | 1st Maintenance – Completed, 2nd Maintenance – Completed |
| 3 | 1st, 2nd, 3rd Maintenance – Completed |
| 4 | 1st, 2nd, 3rd, 4th Maintenance – Completed |

**Rules:**
- Only the **next sequential** uncompleted visit is shown — skipping is not allowed.
- Selecting a maintenance completion option:
  1. Marks the corresponding visit as completed in the maintenance contract
  2. Sets the intervention to **On Going** (if visits remain) or **Completed** (if all visits done)
  3. Displays a toast notification with remaining visit count
- Once all visits are completed, the dropdown shows "All Maintenances Completed" (disabled).

### Viewing Intervention Details

Click the **eye icon** to open a read-only detail modal showing:

- Full intervention info (ID, client, machine, type, priority, status, location, description)
- Technician assignment and contact
- Scheduled date and time
- PMC Contract link (if applicable) — click to navigate to the linked maintenance contract
- Notes history (with author, date, and text)
- Parts used (reference, description, quantity)
- Status history (all previous status changes with timestamps and notes)
- Audit trail (every action performed on this intervention)

### Deleting an Intervention

Admins can delete interventions. A secure confirmation dialog requires:

1. **Job Number** (last 8 characters, uppercase)
2. **Admin email**
3. **Admin password**
4. Type **delete** exactly
5. **Reason** for deletion

Deleted interventions are moved to the **Deleted Jobs** archive.

---

## 7. Planning

The Planning board helps schedule unplanned requests and visualize the month's workload.

### Layout

The screen is split into two panels:

- **Left: Unplanned Queue** — all interventions with status "New" and no scheduled date
- **Right: Monthly Calendar** — full calendar view for the current month

### Unplanned Queue

Each request card shows:
- Priority badge
- Client name and machine model
- Days since creation (color-coded: gray 0–2 days, yellow 3–6 days, red 7+ days)
- **Schedule** button

Click **Schedule** to open the scheduling modal:
- Select a **date** (cannot be in the past)
- Select a **time** (default: 08:00)
- Optionally assign a **technician**
- Click **Schedule** — status automatically updates to "Assigned" (if technician selected) or "Planned"

### Calendar

- Navigate months with the **← →** arrows.
- Each day cell shows colored dots representing interventions (up to 5 visible; "+N" for more).
- Dot colors correspond to priority: green (low), blue (medium), orange (high), red (urgent).
- **Today's date** is highlighted.
- Click any day to open a **Day Detail modal** listing all interventions scheduled that day, with status and priority.

---

## 8. Technicians

View technician workload and manage assignments. Admins and SuperAdmins have access.

### Workload Overview

A bar chart at the top shows the number of active jobs per technician, with a maximum workload line at 8 jobs.

### Technician Cards

Each card shows:
- Avatar with initials
- Name, email, and role
- **Statistics:** Active jobs / Completed jobs / Total jobs
- **Workload bar** — color-coded:
  - Green: 0–2 active jobs (low load)
  - Yellow: 3–5 active jobs (moderate)
  - Red: 6+ active jobs (high load)
- **Active Assignments** — up to 5 current jobs listed with priority badge, client, and scheduled date
- **View All Interventions** button
- **Edit** button (SuperAdmin only)

### View All Interventions Modal

Displays the full list of interventions for that technician in a table:

| Column | Description |
|---|---|
| Status | Badge |
| Priority | Badge |
| Client | Client company name |
| Machine | Machine model |
| Type | Intervention type |
| Location | Client Premises / Workshop |
| Scheduled | Date and time |
| Action | Eye icon to view details |

### Editing a Technician / User (SuperAdmin Only)

Click **Edit** on a technician card to update:
- Full Name
- Email address
- Password (leave blank to keep existing)
- Role (Technician or Admin)

---

## 9. Maintenance Contracts

Manage preventive maintenance contracts (PMC) for client machines.

### KPI Cards

| Card | Description |
|---|---|
| Active Contracts | Contracts currently in force |
| Expiring Soon | Contracts expiring within 30 days |
| Completed Visits | Total maintenance visits marked as done |
| Remaining Visits | Total scheduled visits still pending |

### Contract Table

| Column | Description |
|---|---|
| Job No. | Machine job number (monospace) |
| Client | Company name and region |
| Machine / Serial | Model and serial number |
| Start Date | Contract start |
| End Date | Contract end |
| Frequency | Visits per year |
| Progress | Completed / Total with visual bar |
| Next Visit | Next scheduled maintenance date |
| Status | Active / Expiring Soon / Expired |
| Actions | View details / Delete |

### Contract Statuses

| Status | Condition |
|---|---|
| **Active** | End date is more than 30 days away |
| **Expiring Soon** | End date is within 30 days |
| **Expired** | End date has passed |

### Creating a Contract

Maintenance contracts are created automatically when an intervention of type **PMC** is created (see [Interventions — Creating](#creating-an-intervention)). The contract is linked directly to that intervention.

### Viewing Contract Details

Click the **eye icon** to open the detail modal. Three sections are displayed:

**1. Contract Details**
- Client, Region, Machine, Machine Type
- Job Number, Serial Number
- Status, Start Date, End Date
- Maintenances / Year, Maintenance Interval
- Created By (with role badge), Created timestamp
- Notes / Special Conditions

**2. Maintenance Tracking**
- Total Planned visits
- Completed visits (green)
- Remaining visits
- Overdue visits (red)
- Next scheduled visit date
- Progress bar

**3. Maintenance Schedule**

A read-only table of all scheduled maintenance visits:

| Column | Description |
|---|---|
| Visit | Visit number (e.g., Visit 1, Visit 2) |
| Scheduled Date | When the visit is planned |
| Status | Completed / Overdue / Scheduled |
| Intervention | Link to the associated PMC intervention |

> The schedule table is **read-only**. Visit completion is updated through the Intervention section by the assigned technician.

### Deleting a Contract

Click the **trash icon** on the contract row. A five-field secure confirmation is required:

1. **Contract ID** — enter the last 8 characters of the contract ID (shown in the dialog)
2. **Your email address**
3. **Your password**
4. Type **delete** exactly
5. **Reason** for deletion

This action is permanent. The deletion is logged in the Action Log.

### Automatic Notifications

The system automatically checks for upcoming maintenance visits on login (admin/superadmin only):
- Visits within **7 days**: A PMC intervention is auto-created if one doesn't exist yet.
- **30 days before expiry**: Toast warning shown.
- **7 days before expiry**: Toast warning shown.

---

## 10. Maintenance Forecast

A rolling 18-month forecast showing planned maintenance workload across all active contracts.

### KPI Cards

| Card | Description |
|---|---|
| Pending Visits | Total visits across all future months |
| Months with Work | How many months have at least one visit |
| Busiest Month | The month with the highest visit count |
| Active Contracts | Count of contracts contributing to the forecast |

### Year Filter

Use the year buttons at the top to filter the forecast:
- **All** — shows the full 18-month window
- **[Year]** — shows only months in that specific year

KPI cards and the table both update instantly when a year filter is applied.

### Forecast Table

| Column | Description |
|---|---|
| Month | Month and year label |
| Visits | Count + proportional bar (color-coded) |
| Workload | Colored badge: Low / Medium / High |
| Details | Toggle button to expand visit list |

**Workload colors:**

| Level | Visits | Color |
|---|---|---|
| Low | 1–2 | Green |
| Medium | 3–5 | Amber |
| High | 6+ | Red |

### Expandable Detail Rows

Click the **toggle button** on any month row to expand a nested table showing individual planned visits:

| Column | Description |
|---|---|
| Client | Client company name |
| Machine | Machine model |
| Serial | Serial number |
| Scheduled Date | Visit date |
| Frequency | Contract visits per year |

Only future visits (not yet completed) are shown.

---

## 11. Reports

Generate operational reports for a selected date range.

### Date Range Filters

- **From / To** date pickers
- Quick buttons: **This Month**, **Last 3 Months**, **All Time**

All report sections update automatically when the date range changes.

### Report Sections

#### Summary

- KPI boxes: Total, Completed, Open, Cancelled, Completion Rate
- Status breakdown table with count and percentage per status
- 6-month trend chart (bar chart)

#### SLA Compliance

- KPI boxes: Urgent Total, Urgent Resolved within SLA, SLA compliance %, Breaches >3 days
- Alert listing urgent and high-priority interventions that exceeded 3-day resolution time

#### Technician Performance

Table per technician:

| Column | Description |
|---|---|
| Technician | Avatar, name, email |
| Assigned | Jobs assigned in period |
| Completed | Jobs finished |
| Active | Still open |
| Avg Resolution | Average days to completion |
| Completion Rate | Progress bar with % |

#### Type Breakdown

| Column | Description |
|---|---|
| Type | Intervention type |
| Total | Count |
| Completed | Completed count |
| Rate | Completion % |
| Priority Split | Priority badge distribution |

#### Machine History by Client

Grouped by client, then by machine:

| Column | Description |
|---|---|
| Machine | Model |
| Serial | Serial number |
| # Jobs | Total interventions in period |
| Contract | Contract type |
| Last Service | Most recent service date |
| Last Status | Most recent intervention status |

### Printing

Click **Print Report** at the top to open the browser print dialog. The layout is optimized for printing.

---

## 12. Job Tracker

A date-filtered view of all interventions for tracking job history and statistics.

### Filters

- **From / To** date pickers
- **Status** dropdown
- Quick presets: **This Month**, **Last 3 Months**, **All Time**

### KPI Boxes

- Total Jobs Created
- Completed
- Open / In Progress
- Cancelled
- Completion Rate (%)

### Summary Card

- Period label
- Active days in period
- Average jobs per day
- Completion rate progress bar

### Charts

Doughnut chart showing:
- Completed (green)
- Open (orange)
- Cancelled (gray)

### Job Table

| Column | Description |
|---|---|
| Date Created | Sortable |
| Client | Company name |
| Machine | Machine model |
| Type | Intervention type |
| Priority | Badge |
| Technician | Assigned technician |
| Status | Badge |
| Actions | View / Edit (admin) / Delete (admin) |

### Deleting a Job from the Tracker

Requires the same 5-field secure confirmation as intervention deletion (job number, email, password, "delete", reason). The job is archived in **Deleted Jobs** with full metadata.

---

## 13. Deleted Jobs

A read-only archive of all deleted interventions.

**Access:** Admins (view only) · SuperAdmins (view + permanent purge)

### Table Columns

| Column | Description |
|---|---|
| Job # | Original job identifier (monospace) |
| Client | Client company name |
| Machine | Machine model |
| Type | Intervention type |
| Last Status | Status at time of deletion |
| Created | Original creation date |
| Deleted At | Timestamp of deletion |
| Deleted By | User who deleted (with avatar) |
| Reason | Explanation provided at deletion |
| Action | Purge button (SuperAdmin only) |

### Purging a Record (SuperAdmin Only)

Click the red **Purge** button. Confirmation requires:
1. Your **password**
2. A **reason** for purging

Purged records are permanently removed and a purge entry is written to the Action Log.

---

## 14. Action Log

**Access:** Head Administrator (SuperAdmin) only.

A complete, tamper-evident record of all administrative actions performed in the system.

### Table Columns

| Column | Description |
|---|---|
| Date & Time | Timestamp of the action |
| Performed By | Avatar and name of the user |
| Action | Color-coded action type badge |
| Target | What was acted upon |
| Details | Multi-line details (split by pipe separator) |

### Action Types

| Badge | Color | Action |
|---|---|---|
| CREATE_USER | Green | New user created |
| EDIT_USER | Blue | User record updated |
| DELETE_USER | Red | User removed |
| PURGE_JOB | Purple | Deleted job permanently purged |
| DELETE_CONTRACT | Red | Maintenance contract deleted |

Actions are logged automatically by the system and cannot be edited or deleted.

---

## 15. Users

**Access:** Head Administrator (SuperAdmin) only.

### User Table

| Column | Description |
|---|---|
| Name | Full name |
| Email | Email address |
| Role | Role badge |
| Active Jobs | Count of open interventions (technicians only) |
| Completed Jobs | Total completed jobs (technicians only) |
| Actions | Edit button |

### Adding a User

Click **Add User** and fill in:
- **Full Name** *(required)*
- **Email address** *(required, must be unique)*
- **Password** *(required)*
- **Role** — Technician or Admin

### Editing a User

Click **Edit** to update name, email, password, or role. Leave the password field blank to keep the existing password.

All user changes are logged in the Action Log.

---

## 16. Settings

Available to all users. Customize the application's appearance and behavior.

### Typography

Choose the base font size for the entire application:

| Button | Size |
|---|---|
| **S** | Small (13 px) |
| **M** | Medium (14 px — default) |
| **L** | Large (15 px) |

### Theme

**Dark Mode** toggle — switches the application to a dark color scheme. The toggle state is saved and restored on next login.

### Accent Color

Choose the primary color used for buttons, links, active states, and badges:

| Preset | Color |
|---|---|
| Blue | #0066FF (default) |
| Green | #10B981 |
| Red | #EF4444 |
| Amber | #F59E0B |
| Purple | #8B5CF6 |
| Cyan | #06B6D4 |
| Pink | #EC4899 |
| Orange | #F97316 |
| Teal | #14B8A6 |
| Indigo | #6366F1 |

Use the **custom color picker** (the circle with a paint icon) to enter any hex color.

### Sidebar Theme

Choose the sidebar background color:

| Option | Color |
|---|---|
| Dark Navy | #0D1F3C (default) |
| Dark Gray | #1F2937 |
| Deep Blue | #1E3A5F |

Click the sidebar card to apply.

### Table Pagination

Set how many rows are shown per page in all tables:
- **10**, **20** (default), **50**, **100**

### Reset to Defaults

Click **Reset Defaults** at the bottom to restore all settings to their original values. A confirmation toast is shown.

All settings are saved automatically and applied immediately — no page reload needed.

---

## 17. PMC Workflow (End-to-End)

This section describes the complete lifecycle of a Preventive Maintenance Contract from creation to completion.

### Step 1 — Create the PMC Intervention

1. Go to **Interventions → + New Intervention**.
2. Select the **Client** and **Machine**.
3. Set **Type** to **PMC – Preventive Maintenance Contract**.
4. Enter the **Contract Start Date**.
5. Select **Maintenances per Year** (1 / 2 / 3 / 4).
6. The **Contract End Date** is auto-calculated as 1 year from the start date.
7. Save. The system automatically:
   - Creates the intervention
   - Creates a linked **Maintenance Contract** with a generated visit schedule
   - Links the contract ID to the intervention

### Step 2 — Schedule the Intervention

An Admin assigns a date, time, and technician via the **Planning board** or the intervention **Edit** modal.

### Step 3 — Auto-Notification

When a scheduled maintenance visit is within **7 days**, the system automatically creates a PMC intervention for that visit (if not already created) when an admin logs in.

### Step 4 — Technician Completes a Visit

1. The technician opens the PMC intervention and clicks **Edit**.
2. The **Status dropdown** shows the next maintenance in sequence (e.g., "1st Maintenance – Completed").
3. The technician selects it and clicks **Save Changes**.
4. The system:
   - Marks that visit as completed in the maintenance contract
   - Updates the intervention status to **On Going** (visits remain) or **Completed** (all done)
   - Shows a toast: "Visit 1 marked as completed. 3 visits remaining."

### Step 5 — Monitor Progress

- Go to **Maintenance Contracts → View Details** to see the schedule table with each visit's status and linked intervention.
- Go to **Maintenance Forecast** to see all upcoming visits across all contracts in an 18-month view.

### Step 6 — Contract Completion

When the technician marks the final visit as completed:
- The intervention status becomes **Completed** (locked from further edits).
- The maintenance contract shows all visits as done.
- Toast: "All 4 maintenance visits completed. Contract fulfilled!"

---

## 18. Data & Security

### Data Storage

All application data is stored in the browser's **localStorage**. Data persists between sessions on the same browser and device.

**Storage keys used:**

| Key | Contents |
|---|---|
| bps_users | User accounts |
| bps_clients | Client records |
| bps_machines | Machine records |
| bps_interventions | All interventions |
| bps_contracts | Maintenance contracts |
| bps_session | Current login session |
| bps_seeded | First-run flag |
| bps_settings | User interface settings |
| bps_deleted_jobs | Deleted intervention archive |
| bps_action_log | Admin action log |

> **Note:** Clearing the browser's local storage will erase all data. There is no server-side backup.

### Security Features

**Secure Delete Confirmation** — Destructive operations (deleting clients, interventions, contracts) require a 5-field verification:
1. Record ID (must match)
2. Admin email
3. Admin password
4. The word "delete" typed exactly
5. A written reason

**Audit Trails** — Every intervention has a built-in audit trail recording every action, who performed it, and when.

**Role-Based Access** — Each route and action is guarded by role checks. Technicians cannot access admin-only views. SuperAdmin-only features are hidden from Admins.

**Action Log** — All user management actions and contract deletions are permanently logged and visible only to the Head Administrator.

**Session Management** — Sessions are stored in localStorage and validated on every page load.

---

## 19. Demo Credentials

The following accounts are pre-loaded on first launch:

| Role | Name | Email | Password |
|---|---|---|---|
| Head Administrator | Super Admin | superadmin@bavarian.mu | super123 |
| Admin | Admin User | admin@bavarian.mu | admin123 |
| Technician | Jonathan Chellen | jc@bavarian.mu | tech123 |
| Technician | Giovanni Marianne | gm@bavarian.mu | tech123 |

### Demo Data Included

- **5 Clients:** Ciel Group, IBL Ltd, Rogers Group, Constance Hotels, Leal & Co
- **10 MULTIVAC Machines:** R230, R535, T800, X-line, C300 variants
- **15 Interventions:** covering all statuses, all priorities, and all intervention types
- **3 Maintenance Contracts:** active Gold-tier PMC contracts with visit schedules

---

*BPS Service Management · Giovanni Packaging Solution · MULTIVAC Group — Indian Ocean Region*
