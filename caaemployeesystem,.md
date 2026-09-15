# CAA Employee Task System — V0

## Purpose

A simple internal system for daily task assignment and task-level EOD reporting.

### Core loop

**Assign → Work → Update → EOD Note → Submit → Manager Visibility**

---

## Core Features

- Manager assigns daily tasks.
- Employee sees today's assigned tasks.
- Employee updates status and progress.
- Employee adds an EOD note to each task.
- Employee optionally adds an output/work link.
- Employee submits today's EOD.
- Manager sees team-level progress and EOD status.
- Google Sheets acts as the V0 database.
- Demo mode works without Google credentials.

---

## Important Product Decision

EOD is **task-level**.

There is no separate generic EOD report in V0.

Each task contains:

- Status
- Progress
- EOD Note
- Output Link
- EOD Submitted

Example:

> **Task:** Research 20 fleet companies  
> **Status:** Completed  
> **Progress:** 100%  
> **EOD Note:** Found 23 relevant companies and added them to the prospect list.

This makes the manager's view of the day's work immediately actionable.

---

# Data Model

## EMPLOYEES

| Field | Description |
|---|---|
| Employee ID | Unique employee identifier |
| Name | Employee name |
| Email | Work email |
| Role | Employee / Manager |
| Active | Whether the employee is active |

---

## TASKS

| Field | Description |
|---|---|
| Task ID | Unique task identifier |
| Date | Task date |
| Employee | Assigned employee |
| Task | Short task title |
| Description | Optional details |
| Priority | High / Medium / Low |
| Due Time | Expected completion time |
| Status | Not Started / In Progress / Blocked / Completed |
| Progress | 0–100% |
| EOD Note | Employee's end-of-day note |
| Output Link | Optional link to work/output |
| EOD Submitted | Yes/No |
| Created At | Creation timestamp |
| Updated At | Last update timestamp |

---

# Roles

## Employee

Can:

- View own tasks.
- Update own tasks.
- Update progress.
- Add EOD notes.
- Add output links.
- Submit own EOD.

Cannot:

- Create tasks.
- Assign tasks.
- Reassign tasks.
- Delete tasks.
- View other employees' tasks.

---

## Manager

Can:

- Assign tasks.
- View all tasks.
- Edit tasks.
- Reassign tasks.
- View employee EOD notes.
- View team status.
- Reopen EOD when required.

---

# Employee Workflow

## Morning

Employee opens the application.

They see:

- Today's date.
- Their name.
- Today's assigned tasks.
- Priority.
- Due time.

## During the day

Employee changes:

**Not Started → In Progress → Completed**

or:

**In Progress → Blocked**

Employee can update progress at any time.

## End of day

For each task, employee adds a short:

**EOD Note**

The note should answer:

- What happened?
- What was completed?
- What is pending?
- What caused a blocker, if any?

Then employee clicks:

**SUBMIT TODAY'S EOD**

---

# Manager Workflow

Manager opens dashboard.

Immediately sees:

- Total tasks.
- Completed.
- In Progress.
- Blocked.
- Not Started.
- EOD Submitted.
- EOD Pending.

Manager can drill into each employee and see:

- Their tasks.
- Current status.
- Progress.
- EOD notes.
- Output links.

---

# Dashboard Example

| Employee | Tasks | Completed | In Progress | Blocked | Progress | EOD |
|---|---:|---:|---:|---:|---:|---|
| Rahul | 5 | 3 | 1 | 1 | 72% | ✓ |
| Ankit | 4 | 4 | 0 | 0 | 100% | ✓ |
| Priya | 5 | 1 | 2 | 2 | 35% | ⚠ |

---

# Google Sheets

Use one spreadsheet with:

1. `EMPLOYEES`
2. `TASKS`

Avoid unnecessary spreadsheets/tabs in V0.

---

# Demo Mode

Use sample users:

- Rahul
- Ankit
- Priya
- Admin

Demo mode must allow the full workflow without credentials.

---

# Technical Principles

- Keep Google API calls server-side.
- Never expose credentials in frontend.
- Validate permissions server-side.
- Separate UI from data access.
- Keep the data layer replaceable.
- Provide useful error messages.
- Keep the code simple enough for another developer to understand.

---

# Future Ideas — NOT V0

Potential later additions:

- Google Workspace authentication.
- Google Chat task notifications.
- EOD reminders.
- Recurring tasks.
- Task history.
- Attachments.
- Search.
- Weekly reports.
- Performance analytics.
- Proper database.
- Audit logs.

Do not implement these unless specifically requested.

---

# V0 Definition of Done

The system is successful if:

1. A manager can assign a task.
2. Employee sees it.
3. Employee can update it.
4. Employee can add a task-level EOD note.
5. Employee can submit EOD.
6. Manager can see the updated task and note.
7. Manager can see who has/hasn't submitted EOD.
8. The whole workflow works without email.
9. The interface is simple enough that a new employee can understand it without training.
