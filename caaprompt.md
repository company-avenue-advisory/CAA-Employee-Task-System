# Antigravity Build Prompt — CAA Daily Task & EOD System

Build a simple internal employee task management web app for **CAA**.

## 1. Product Goal

We need a lightweight system to replace scattered email-based daily task assignment and EOD reporting.

The workflow is:

**Manager assigns tasks → Employee works → Employee updates each task → Employee adds an EOD note to each task → Employee submits today's EOD → Manager sees team status.**

### Critical product decision

**EOD reporting is TASK-LEVEL, not a separate generic daily report.**

Each task must have its own EOD note.

Example:

| Task | Status | Progress | EOD Note |
|---|---|---:|---|
| Research 20 fleet companies | Completed | 100% | Found 23 relevant companies and added them to the sheet. |
| Contact 10 managers | In Progress | 60% | Contacted 6. Remaining 4 will be completed tomorrow. |
| Competitor research | Blocked | 30% | Could not access pricing information from 2 competitors. |

Do not create a complicated separate EOD reporting workflow.

---

# 2. Scope

Build V0 only.

Required:

- Manager task assignment
- Employee daily task dashboard
- Task status updates
- Task progress updates
- Task-level EOD notes
- Optional output/work link
- Employee EOD submission
- Manager team dashboard
- Google Sheets backend
- Demo/mock mode if Google credentials are unavailable

Do NOT add:

- Payroll
- Attendance
- Leave management
- HR management
- Performance reviews
- Complex analytics
- Chat
- AI
- Calendar integrations
- WhatsApp
- Complex project-management features

Keep it brutally simple.

---

# 3. Recommended Architecture

Use:

- React / Next.js
- Responsive modern UI
- Google Sheets as the V0 database
- Server-side Google Sheets API or Google Apps Script integration
- Demo/mock data layer for development

Structure the data layer so Google Sheets can later be replaced with a real database without rewriting the UI.

Never expose Google credentials in frontend code.

---

# 4. Google Spreadsheet

Use ONE Google Spreadsheet.

Create these sheets:

## Sheet: EMPLOYEES

Columns:

| Field |
|---|
| Employee ID |
| Name |
| Email |
| Role |
| Active |

Roles:

- Employee
- Manager

---

## Sheet: TASKS

Columns:

| Field |
|---|
| Task ID |
| Date |
| Employee |
| Task |
| Description |
| Priority |
| Due Time |
| Status |
| Progress |
| EOD Note |
| Output Link |
| EOD Submitted |
| Created At |
| Updated At |

### Task ID

Generate IDs:

TASK-0001
TASK-0002
TASK-0003

### Priority

- High
- Medium
- Low

### Status

- Not Started
- In Progress
- Blocked
- Completed

### Progress

0–100%.

### EOD Submitted

Boolean / Yes-No.

---

# 5. Employee Experience

Employee opens the application and immediately sees:

**CAA**

**Today's Tasks**

**[Employee Name]**

**[Today's Date]**

Only show tasks assigned to that employee for today.

---

## Task Card

Each task should look approximately like:

### TASK-0012

**Research 20 potential fleet partners**

Priority: HIGH

Due: 5:00 PM

Status:
[ In Progress ▼ ]

Progress:
[ slider 0–100% ]

### EOD NOTE

[ What happened with this task today? ]

### Output Link

[ optional ]

[ SAVE UPDATE ]

The employee should be able to update status, progress, EOD note, and output link.

---

# 6. EOD Workflow

At the bottom of today's task list show:

## End of Day

Show a simple summary:

**5 Tasks**
**3 Completed**
**1 In Progress**
**1 Blocked**

Then:

**[ SUBMIT TODAY'S EOD ]**

When clicked:

1. Validate that every today's task has a status.
2. Save the latest task-level EOD notes.
3. Mark today's tasks as EOD Submitted.
4. Record the employee's EOD submission state.
5. Show:

**✓ Today's EOD submitted successfully**

The employee should NOT have to write a separate generic EOD report.

The task notes ARE the EOD report.

---

# 7. EOD Editing

Before submission:

- Employee can freely edit task status, progress and EOD note.

After submission:

- Prefer locking the day's EOD updates.
- If an edit is necessary, provide a simple "Edit EOD" action or allow managers to reopen it.

Do not make this complicated.

---

# 8. Manager Dashboard

Managers need a simple overview.

Header:

**CAA — Team Dashboard**

Show today's date.

## Summary

- Total Tasks
- Completed
- In Progress
- Blocked
- Not Started
- EOD Submitted
- EOD Pending

---

## Employee Summary

Example:

| Employee | Tasks | Completed | In Progress | Blocked | Progress | EOD |
|---|---:|---:|---:|---:|---:|---|
| Rahul | 5 | 3 | 1 | 1 | 72% | ✓ |
| Ankit | 4 | 4 | 0 | 0 | 100% | ✓ |
| Priya | 5 | 1 | 2 | 2 | 35% | ! |

Clicking an employee should show their task details.

---

# 9. Manager Task Assignment

Manager should have a simple form:

Employee:
[ dropdown ]

Task:
[ text ]

Description:
[ optional ]

Priority:
[ High / Medium / Low ]

Due Time:
[ time ]

[ ASSIGN TASK ]

On submit:

- Generate Task ID.
- Create task in Google Sheets.
- Set status = Not Started.
- Set progress = 0.
- Set EOD Submitted = No.

---

# 10. Manager Task Management

Manager can:

- View today's tasks
- View all tasks
- Filter by employee
- Filter by status
- Filter by priority
- Edit task
- Reassign task
- Change deadline
- Cancel/delete task if necessary

Manager can view each employee's EOD note directly inside the task details.

Example:

**Research fleet companies**

Status: Completed

Progress: 100%

EOD Note:
"Found 23 companies and added them to the prospect list."

Output:
[Open Link]

---

# 11. EOD Visibility

The manager dashboard must clearly show employees who have NOT submitted EOD.

Example:

**EOD STATUS**

Rahul ✓ Submitted

Ankit ✓ Submitted

Priya ⚠ Pending

Clicking "Pending" should show which tasks still need EOD updates.

---

# 12. Employee Permissions

Employees can:

- View their own tasks
- Update their own tasks
- Add EOD notes
- Submit their own EOD

Employees cannot:

- Create tasks
- Assign tasks
- Delete tasks
- Reassign tasks
- View other employees' tasks
- Modify other employees' EOD notes

Do not rely only on frontend hiding. Validate permissions server-side.

---

# 13. Manager Permissions

Managers can:

- Assign tasks
- View all tasks
- Edit tasks
- Reassign tasks
- View all EOD notes
- View team status
- Reopen EOD if necessary

---

# 14. Demo Mode

If Google Sheets credentials are not available, the app MUST still run.

Create a mock data layer with:

Employees:

- Rahul — Employee
- Ankit — Employee
- Priya — Employee
- Admin — Manager

Create realistic sample tasks.

Provide an obvious configuration switch:

DEMO_MODE=true

and:

GOOGLE_SHEETS_MODE=true

Do not make Google integration a blocker to seeing the working UI.

---

# 15. Authentication — V0

Do not build a complex authentication system.

For demo mode, provide a simple user selector/login:

[ Rahul ]
[ Ankit ]
[ Priya ]
[ Admin ]

Clearly label this as DEMO LOGIN.

Structure authentication so proper Google Workspace authentication can be added later.

---

# 16. UI/UX

The app should feel like a small internal operations tool.

Use:

- Clean
- Minimal
- Professional
- Fast
- Responsive
- Mobile-first employee view
- Desktop-friendly manager view

Use CAA branding.

Avoid:

- Excessive animations
- Huge dashboards
- Unnecessary charts
- Too many colors
- Complicated navigation

Use clear visual states:

- Completed
- In Progress
- Blocked
- Not Started
- EOD Submitted
- EOD Pending

---

# 17. Navigation

Employee:

- Today's Tasks
- EOD

Manager:

- Dashboard
- Assign Task
- Tasks

Keep navigation minimal.

---

# 18. Error Handling

Handle:

- Google Sheets unavailable
- Invalid task
- Missing employee
- Missing status
- Failed update
- Failed EOD submission

Show clear human-readable messages.

Example:

"Unable to save your update. Please try again."

Do not expose API credentials or technical stack traces to employees.

---

# 19. Future Notification Hook

Do not build notification integrations in V0.

However, create a small service/interface such as:

notificationService.sendTaskAssignment()
notificationService.sendEODReminder()

Leave these as stubs.

Later we may connect Google Chat or email.

---

# 20. Final Acceptance Criteria

The application is complete when the following works end-to-end in DEMO MODE:

### Manager

1. Login as Admin.
2. Assign a task to Rahul.
3. Task appears in Rahul's dashboard.
4. Login as Rahul.
5. Update task status.
6. Update progress.
7. Add an EOD note.
8. Add optional output link.
9. Submit today's EOD.
10. Login as Admin.
11. See Rahul's updated task.
12. See Rahul's EOD note.
13. See Rahul as EOD Submitted.

Also verify:

- An employee cannot access another employee's tasks.
- Manager can see all employees.
- Blocked tasks are clearly visible.
- EOD Pending employees are clearly visible.
- Google Sheets integration works when configured.
- Demo mode works without Google credentials.

---

# 21. Build Philosophy

Before adding any feature, ask:

**Does this directly improve Assign → Work → Update → EOD → Manager Visibility?**

If not, leave it out.

The goal is not to build another Jira/Asana/ClickUp.

The goal is:

**One simple daily task board that employees actually use.**
