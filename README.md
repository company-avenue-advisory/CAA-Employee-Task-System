# CAA Employee Task & EOD Management System (V0)

A simple, lightweight internal employee task management and task-level EOD reporting web application built for **CAA**.

## Core Product Principle

**Assign → Work → Update → EOD Note → Submit → Manager Visibility**

EOD reporting is **task-level**, not a separate generic daily form. Each task contains its own status, progress %, EOD note, and work deliverable link.

---

## Key Features

- **Employee View**:
  - Demo login selector (`Rahul`, `Ankit`, `Priya`, `Admin`).
  - Strict isolation: Employees see only their own assigned tasks for today.
  - Update task status (`Not Started`, `In Progress`, `Blocked`, `Completed`).
  - Interactive progress slider (0%–100%).
  - Add task-level EOD note ("What happened? What was completed? What is pending?").
  - Optional deliverable/output link.
  - "SUBMIT TODAY'S EOD" action with validation and locked submitted state.

- **Manager View**:
  - Team Summary Metrics: Total Tasks, Completed, In Progress, Blocked, Not Started, EOD Submitted, EOD Pending.
  - Team EOD Roster (`✓ Submitted` vs `⚠ Pending` status per employee).
  - Assign new tasks with auto-generated IDs (`TASK-0001`, `TASK-0002`...).
  - Edit, reassign, or reopen EOD submissions for employees.
  - Filter team tasks by employee or status.

- **Data Layer Architecture**:
  - Pluggable Repository Pattern (`MockRepository` / `GoogleSheetsRepository`).
  - **Demo Mode**: Runs completely out-of-the-box using mock data without requiring Google credentials.
  - **Google Sheets Mode**: Uses server-side Google Sheets API (`EMPLOYEES` and `TASKS` sheets). Credentials remain strictly server-side.

---

## Quick Start (Running Locally)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Mode Testing Instructions

1. Open the application at [http://localhost:3000](http://localhost:3000).
2. **As Admin (Manager)**:
   - Select **Admin (Manager)** from the top-right Demo Login dropdown.
   - Click **"Assign New Task"**.
   - Select **Rahul**, enter Title `"Research 20 fleet companies"`, Priority `"High"`, Due Time `"5:00 PM"`, and click **Assign Task**.
3. **As Rahul (Employee)**:
   - Switch user selector to **Rahul (Employee)**.
   - Locate the newly assigned task.
   - Change Status to `Completed`, Progress to `100%`.
   - Add Task EOD Note: `"Found 23 relevant fleet companies and added them to prospect sheet."`
   - Click **"Save Update"**.
   - Click **"SUBMIT TODAY'S EOD"**.
   - Confirm banner updates to `✓ Today's EOD Submitted Successfully`.
4. **As Admin (Manager)**:
   - Switch back to **Admin (Manager)**.
   - Observe team roster: **Rahul** is marked `✓ Submitted`.
   - Inspect Rahul's task cards to view his live EOD note and deliverable link.

---

## Google Sheets Integration Setup (Optional)

To enable live Google Sheets synchronization:

1. Create a Google Spreadsheet with two sheets: `EMPLOYEES` and `TASKS`.
   - **`EMPLOYEES` Sheet Header (Row 1)**: `Employee ID`, `Name`, `Email`, `Role`, `Active`
   - **`TASKS` Sheet Header (Row 1)**: `Task ID`, `Date`, `Employee`, `Task`, `Description`, `Priority`, `Due Time`, `Status`, `Progress`, `EOD Note`, `Output Link`, `EOD Submitted`, `Created At`, `Updated At`

2. Create a Google Service Account in GCP Console and share your spreadsheet with the service account email (Editor access).

3. Create a `.env.local` file in the root directory:
```env
DEMO_MODE=false
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```
