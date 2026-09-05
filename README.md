# PeoplePay360

PeoplePay360 is a React + Express HR and payroll workspace for onboarding, employee records, contracts, attendance, leave, departments, schedules, and payroll operations. The app uses SQLite persistence so the data is stored in a real database instead of browser local storage.

This project is prepared for a hackathon/demo environment and includes seeded MVP data so the evaluator can open the app and test the HR workflows immediately.

## Features

- Employee onboarding and employee lifecycle management
- Department management
- Working schedule management with start and end day/time data
- Contract creation linked to employee records
- Attendance tracking with employee-based autofill
- Leave types and leave requests
- User account management and admin role access
- SQLite-backed data model with seeded demo records
- Responsive UI for desktop and smaller screens

## Project structure

- `src/` — React frontend
- `server/` — Express API and SQLite database setup
- `server/data/peoplepay360.sqlite` — local SQLite database file used by the app
- `index.html` — app entry point
- `vite.config.js` — Vite config
- `package.json` — scripts and dependencies

## Requirements

- Node.js 18 or newer
- npm

## Quick start

From the project root:

```bash
npm install
npm run dev
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

To run the app in production-like mode:

```bash
npm run build
npm start
```

Then open `http://localhost:3000`.

## Database and seeded data

The app stores its data in SQLite at:

```text
server/data/peoplepay360.sqlite
```

The seeded dataset includes:

- 201 employee records
- 5 departments
- 3 working schedules:
  - Monday to Friday
  - Monday to Saturday
  - Night shift
- Leave types such as Paid Leave, Unpaid Leave, Sick Leave, Casual Leave, Maternity Leave, and Bereavement Leave
- Demo accounts for Admin, HR Manager, Payroll User, Payroll Manager, and Employee roles

This database file is included in the project so collaborators can use the same working MVP dataset without needing to recreate it manually.

## Demo accounts

The app seeds demo credentials for fast testing:

- Admin: `demo@peoplepay360.com` / `PeoplePay360123!`
- HR Manager: `hr.manager@peoplepay360.com` / `HRManager123!`
- HR Payroll User: `payroll.user@peoplepay360.com` / `PayrollUser123!`
- HR Payroll Manager: `payroll.manager@peoplepay360.com` / `PayrollManager123!`
- Employee: `employee@peoplepay360.com` / `Employee123!`

## API overview

The backend exposes API routes under `/api/<collection>` and a login route at `/api/auth/login`.

Examples:

- `/api/users`
- `/api/employees`
- `/api/onboarding`
- `/api/departments`
- `/api/schedules`
- `/api/contracts`
- `/api/attendance`
- `/api/leaveTypes`
- `/api/leaveRequests`

## Notes for collaborators

- This app is intentionally using SQLite for quick MVP development and evaluation.
- The database file is stored in the project so it is immediately usable after cloning and installing dependencies.
- If you want to reset the seeded data, delete or replace the SQLite file and restart the backend.

## Important

This project is set up so it can be pushed to GitHub and used by collaborators without manual DB setup. I have not pushed anything to GitHub here, as requested.
