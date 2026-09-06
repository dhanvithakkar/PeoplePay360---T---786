import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'server', 'data'), { recursive: true });
const dbFile = path.join(root, 'server', 'data', 'peoplepay360.sqlite');
const SQL = await initSqlJs({ locateFile: file => path.join(root, 'node_modules', 'sql.js', 'dist', file) });
const db = fs.existsSync(dbFile) ? new SQL.Database(fs.readFileSync(dbFile)) : new SQL.Database();
db.run(`CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY, collection TEXT NOT NULL, data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
); CREATE INDEX IF NOT EXISTS records_collection_idx ON records(collection);`);
const collections = new Set(['users', 'employees', 'departments', 'schedules', 'contracts', 'attendance',
  'leaveRequests', 'leaveTypes', 'leaveAllocations', 'salaryStructures', 'salaryRules', 'payruns',
  'payslips', 'settings', 'myAttendance', 'onboarding']);
const rolePermissions = {
  Admin: {
    read: new Set([...collections]),
    write: new Set([...collections])
  },
  'HR Manager': {
    read: new Set(['employees', 'departments', 'schedules', 'contracts', 'attendance', 'leaveRequests', 'leaveTypes', 'leaveAllocations', 'myAttendance', 'onboarding']),
    write: new Set(['employees', 'departments', 'schedules', 'contracts', 'attendance', 'leaveRequests', 'leaveTypes', 'leaveAllocations', 'myAttendance', 'onboarding'])
  },
  'HR Payroll User': {
    read: new Set(['employees', 'departments', 'schedules', 'contracts', 'attendance', 'leaveRequests', 'leaveTypes', 'leaveAllocations', 'myAttendance', 'onboarding', 'salaryStructures', 'salaryRules', 'payruns', 'payslips']),
    write: new Set(['employees', 'departments', 'schedules', 'contracts', 'attendance', 'leaveRequests', 'leaveTypes', 'leaveAllocations', 'myAttendance', 'onboarding', 'payruns', 'payslips'])
  },
  'HR Payroll Manager': {
    read: new Set([...collections]),
    write: new Set([...collections])
  },
  Employee: {
    read: new Set(['employees', 'departments', 'schedules', 'contracts', 'attendance', 'leaveRequests', 'leaveTypes', 'leaveAllocations', 'myAttendance', 'onboarding', 'salaryStructures', 'salaryRules', 'payruns', 'payslips']),
    write: new Set(['myAttendance', 'leaveRequests'])
  }
};

function ensureSqlColumn(tableName, columnName, definition) {
  const columns = query(`PRAGMA table_info(${tableName})`);
  if (!columns.some(column => column.name === columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) return next();
  const segments = req.path.split('/').filter(Boolean);
  const collection = segments[0];
  if (!collection || !valid(collection)) return next();
  const role = getRequestRole(req);
  if (!canAccessCollection(role, collection, req.method)) {
    return res.status(403).json({ error: `Access denied for role "${role}" on collection "${collection}".` });
  }
  next();
});

const createSqlTables = `
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manager TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active'
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    startDay TEXT,
    endDay TEXT,
    startTime TEXT,
    endTime TEXT,
    status TEXT DEFAULT 'Active'
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    userId TEXT,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    company TEXT,
    phone TEXT,
    dob TEXT,
    address TEXT,
    employeeId TEXT,
    department TEXT,
    position TEXT,
    manager TEXT,
    joiningDate TEXT,
    schedule TEXT,
    salary REAL,
    contractType TEXT,
    status TEXT DEFAULT 'Active',
    password TEXT,
    accountType TEXT DEFAULT 'Employee',
    accountHolder TEXT,
    bankName TEXT,
    accountNumber TEXT,
    bankCode TEXT
  );
  CREATE TABLE IF NOT EXISTS leave_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    days INTEGER,
    type TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active'
  );
  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    date TEXT,
    checkIn TEXT,
    checkOut TEXT,
    status TEXT,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    leaveType TEXT,
    startDate TEXT,
    endDate TEXT,
    reason TEXT,
    status TEXT DEFAULT 'Pending'
  );
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    department TEXT,
    position TEXT,
    schedule TEXT,
    startDate TEXT,
    endDate TEXT,
    salary REAL,
    salaryStructure TEXT,
    status TEXT DEFAULT 'Active'
  );
`;
db.run(createSqlTables);
ensureSqlColumn('employees', 'password', 'TEXT');
ensureSqlColumn('employees', 'accountType', "TEXT DEFAULT 'Employee'");
ensureSqlColumn('employees', 'accountHolder', 'TEXT');
ensureSqlColumn('employees', 'bankName', 'TEXT');
ensureSqlColumn('employees', 'accountNumber', 'TEXT');
ensureSqlColumn('employees', 'bankCode', 'TEXT');

const valid = name => collections.has(name);
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalizeSchedule = record => {
  if (!record || typeof record !== 'object') return record;
  const next = { ...record };
  if (!next.startDay || !dayOptions.includes(next.startDay)) next.startDay = 'Monday';
  if (!next.endDay || !dayOptions.includes(next.endDay)) next.endDay = 'Friday';
  return next;
};
function query(sql, params = []) {
  const statement = db.prepare(sql);
  statement.bind(params);
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}
const readRecords = collection => query('SELECT data FROM records WHERE collection = ? ORDER BY created_at DESC', [collection])
  .map(row => JSON.parse(row.data));
const publicUser = user => {
  const { password, ...safeUser } = user;
  return safeUser;
};
const normaliseAccountEmail = value => String(value || '').trim().toLowerCase();
const normaliseAccountRole = user => {
  const role = user?.role || user?.accountType || 'Employee';
  return role === 'HR Payroll User' || role === 'HR Payroll Manager' || role === 'HR Manager' || role === 'Admin' || role === 'Employee' ? role : 'Employee';
};
const getRequestRole = req => {
  const headerRole = String(req.headers['x-user-role'] || req.headers['X-User-Role'] || '').trim();
  const bodyRole = req.body && typeof req.body === 'object' ? req.body.role || req.body.accountType : '';
  const fallbackRole = normaliseAccountRole({ role: headerRole || bodyRole || 'Employee' });
  return fallbackRole || 'Employee';
};
const canAccessCollection = (role, collection, method) => {
  const permissions = rolePermissions[role] || rolePermissions.Employee;
  if (!permissions) return false;
  const target = method === 'GET' ? permissions.read : permissions.write;
  return target.has(collection);
};
const mergeUserAccounts = () => {
  const users = readRecords('users').map(user => ({
   ...publicUser(user),
   id: user.id || user.userId || user.email || '',
   name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.employeeId || user.id || '',
   email: user.email || '',
   company: user.company || '',
   password: user.password || 'PeoplePay360123!',
   role: normaliseAccountRole(user),
   accountType: user.accountType || normaliseAccountRole(user),
   status: user.status || 'Active',
   ...(user.isDemo ? { isDemo: true } : {})
  }));
  const employees = readRecords('employees').map(employee => ({
   id: employee.userId || employee.id,
   name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || employee.employeeId || employee.id,
   email: employee.email || '',
   company: employee.company || '',
   password: employee.password || 'PeoplePay360123!',
   role: normaliseAccountRole(employee),
   accountType: employee.accountType || normaliseAccountRole(employee),
   status: employee.status || 'Active'
  }));
  const merged = new Map();
  for (const account of [...users, ...employees]) {
   const key = normaliseAccountEmail(account.email || account.id || account.name || '');
   if (!key) continue;
   const existing = merged.get(key);
   const next = existing ? { ...existing, ...account, id: account.id || existing.id || '', name: account.name || existing.name || '', email: account.email || existing.email || '', company: account.company || existing.company || '', password: account.password || existing.password || 'PeoplePay360123!', status: account.status || existing.status || 'Active', role: normaliseAccountRole({ ...existing, ...account }), accountType: account.accountType || existing.accountType || normaliseAccountRole({ ...existing, ...account }) } : account;
   merged.set(key, next);
  }
  return [...merged.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};
const persist = () => fs.writeFileSync(dbFile, Buffer.from(db.export()));

function upsertDepartmentRecord(record) {
 if (!record || !record.name) return;
 const row = {
   id: record.id || makeId('DEP'),
   name: record.name,
   manager: record.manager || '',
   description: record.description || '',
   status: record.status || 'Active'
 };
 db.run(`INSERT INTO departments(id, name, manager, description, status)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     name = excluded.name,
     manager = excluded.manager,
     description = excluded.description,
     status = excluded.status`,
 [row.id, row.name, row.manager, row.description, row.status]);
}

function upsertScheduleRecord(record) {
 if (!record || !record.name) return;
 const row = normalizeSchedule(record);
 const id = row.id || makeId('SCH');
 db.run(`INSERT INTO schedules(id, name, startDay, endDay, startTime, endTime, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     name = excluded.name,
     startDay = excluded.startDay,
     endDay = excluded.endDay,
     startTime = excluded.startTime,
     endTime = excluded.endTime,
     status = excluded.status`,
 [id, row.name, row.startDay || 'Monday', row.endDay || 'Friday', row.startTime || '09:00', row.endTime || '17:00', row.status || 'Active']);
}

function upsertEmployeeRecord(record) {
 if (!record || !record.email && !record.employeeId && !record.id) return;
 const row = {
   id: record.id || record.userId || record.employeeId || makeId('EMP'),
   userId: record.userId || '',
   firstName: record.firstName || '',
   lastName: record.lastName || '',
   email: record.email || '',
   company: record.company || '',
   phone: record.phone || '',
   dob: record.dob || '',
   address: record.address || '',
   employeeId: record.employeeId || `EMP-${String(record.firstName || 'EMP').slice(0, 3).toUpperCase()}-${String(record.id || '').slice(-4) || '0001'}`,
   department: record.department || '',
   position: record.position || '',
   manager: record.manager || '',
   joiningDate: record.joiningDate || '',
   schedule: record.schedule || '',
   salary: Number(record.salary || 0),
   contractType: record.contractType || '',
   status: record.status || 'Active',
   password: record.password || 'PeoplePay360123!',
   accountType: record.accountType || 'Employee',
   accountHolder: record.accountHolder || '',
   bankName: record.bankName || '',
   accountNumber: record.accountNumber || '',
   bankCode: record.bankCode || ''
 };
 db.run(`INSERT INTO employees(id, userId, firstName, lastName, email, company, phone, dob, address, employeeId, department, position, manager, joiningDate, schedule, salary, contractType, status, password, accountType, accountHolder, bankName, accountNumber, bankCode)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     userId = excluded.userId,
     firstName = excluded.firstName,
     lastName = excluded.lastName,
     email = excluded.email,
     company = excluded.company,
     phone = excluded.phone,
     dob = excluded.dob,
     address = excluded.address,
     employeeId = excluded.employeeId,
     department = excluded.department,
     position = excluded.position,
     manager = excluded.manager,
     joiningDate = excluded.joiningDate,
     schedule = excluded.schedule,
     salary = excluded.salary,
     contractType = excluded.contractType,
     status = excluded.status,
     password = excluded.password,
     accountType = excluded.accountType,
     accountHolder = excluded.accountHolder,
     bankName = excluded.bankName,
     accountNumber = excluded.accountNumber,
     bankCode = excluded.bankCode`,
 [row.id, row.userId, row.firstName, row.lastName, row.email, row.company, row.phone, row.dob, row.address, row.employeeId, row.department, row.position, row.manager, row.joiningDate, row.schedule, row.salary, row.contractType, row.status, row.password, row.accountType, row.accountHolder, row.bankName, row.accountNumber, row.bankCode]);
}

function upsertLeaveTypeRecord(record) {
 if (!record || !record.name) return;
 const row = {
   id: record.id || makeId('LT'),
   name: record.name,
   code: record.code || record.name.toUpperCase().replace(/\s+/g, '_'),
   days: Number(record.days || 0),
   type: record.type || 'Paid',
   description: record.description || '',
   status: record.status || 'Active'
 };
 db.run(`INSERT INTO leave_types(id, name, code, days, type, description, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     name = excluded.name,
     code = excluded.code,
     days = excluded.days,
     type = excluded.type,
     description = excluded.description,
     status = excluded.status`,
 [row.id, row.name, row.code, row.days, row.type, row.description, row.status]);
}

function upsertAttendanceRecord(record) {
 if (!record || !record.employeeId) return;
 const row = {
   id: record.id || makeId('ATT'),
   employeeId: record.employeeId,
   date: record.date || '',
   checkIn: record.checkIn || '',
   checkOut: record.checkOut || '',
   status: record.status || 'Present',
   notes: record.notes || ''
 };
 db.run(`INSERT INTO attendance(id, employeeId, date, checkIn, checkOut, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     employeeId = excluded.employeeId,
     date = excluded.date,
     checkIn = excluded.checkIn,
     checkOut = excluded.checkOut,
     status = excluded.status,
     notes = excluded.notes`,
 [row.id, row.employeeId, row.date, row.checkIn, row.checkOut, row.status, row.notes]);
}

function upsertLeaveRequestRecord(record) {
 if (!record || !record.employeeId) return;
 const row = {
   id: record.id || makeId('LR'),
   employeeId: record.employeeId,
   leaveType: record.leaveType || '',
   startDate: record.startDate || '',
   endDate: record.endDate || '',
   reason: record.reason || '',
   status: record.status || 'Pending'
 };
 db.run(`INSERT INTO leave_requests(id, employeeId, leaveType, startDate, endDate, reason, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     employeeId = excluded.employeeId,
     leaveType = excluded.leaveType,
     startDate = excluded.startDate,
     endDate = excluded.endDate,
     reason = excluded.reason,
     status = excluded.status`,
 [row.id, row.employeeId, row.leaveType, row.startDate, row.endDate, row.reason, row.status]);
}

function upsertContractRecord(record) {
 if (!record || !record.employeeId) return;
 const row = {
   id: record.id || makeId('CTR'),
   employeeId: record.employeeId,
   department: record.department || '',
   position: record.position || '',
   schedule: record.schedule || '',
   startDate: record.startDate || '',
   endDate: record.endDate || '',
   salary: Number(record.salary || 0),
   salaryStructure: record.salaryStructure || '',
   status: record.status || 'Active'
 };
 db.run(`INSERT INTO contracts(id, employeeId, department, position, schedule, startDate, endDate, salary, salaryStructure, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     employeeId = excluded.employeeId,
     department = excluded.department,
     position = excluded.position,
     schedule = excluded.schedule,
     startDate = excluded.startDate,
     endDate = excluded.endDate,
     salary = excluded.salary,
     salaryStructure = excluded.salaryStructure,
     status = excluded.status`,
 [row.id, row.employeeId, row.department, row.position, row.schedule, row.startDate, row.endDate, row.salary, row.salaryStructure, row.status]);
}

function writeRecord(collection, record) {
  const normalizedRecord = collection === 'schedules' ? normalizeSchedule(record) : record;
  const id = normalizedRecord.id || makeId(collection.slice(0, 3).toUpperCase());
  const value = { ...normalizedRecord, id };
  db.run(`INSERT INTO records(id, collection, data) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
  [id, collection, JSON.stringify(value)]);
  if (collection === 'departments') upsertDepartmentRecord(value);
  if (collection === 'schedules') upsertScheduleRecord(value);
  if (collection === 'employees') upsertEmployeeRecord(value);
  if (collection === 'leaveTypes') upsertLeaveTypeRecord(value);
  if (collection === 'attendance') upsertAttendanceRecord(value);
  if (collection === 'leaveRequests') upsertLeaveRequestRecord(value);
  if (collection === 'contracts') upsertContractRecord(value);
  persist();
  return value;
}

function getLeaveDays(employee, payrun, leaveRequests, leaveTypes) {
  const paid = new Set();
  const unpaid = new Set();
  const start = new Date(`${payrun.startDate}T00:00:00`);
  const end = new Date(`${payrun.endDate}T00:00:00`);
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const matchingRequests = leaveRequests.filter(request =>
    request.status === 'Approved' &&
    (request.employeeId === employee.id || request.employeeId === employee.employeeId) &&
    request.startDate <= payrun.endDate && request.endDate >= payrun.startDate
  );
  for (const request of matchingRequests) {
    const leaveType = leaveTypes.find(type =>
      type.id === request.leaveType || type.name === request.leaveType || type.code === request.leaveType
    );
    const target = leaveType?.type === 'Paid' ? paid : unpaid;
    const leaveStart = new Date(`${request.startDate}T00:00:00`) > start ? new Date(`${request.startDate}T00:00:00`) : start;
    const leaveEnd = new Date(`${request.endDate}T00:00:00`) < end ? new Date(`${request.endDate}T00:00:00`) : end;
    for (const date = new Date(leaveStart); date <= leaveEnd; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) target.add(formatDate(date));
    }
  }
  return { paid, unpaid };
}

function calculatePayrunPayslip(payrun, employee, rules, companyName, attendanceRecords, leaveDays) {
  const monthlySalary = Math.max(0, Number(employee.salary || 0));
  const start = new Date(`${payrun.startDate}T00:00:00`);
  const end = new Date(`${payrun.endDate}T00:00:00`);
  const validDates = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start;
  const periodDays = validDates ? Math.floor((end - start) / 86400000) + 1 : 0;
  const monthDays = validDates ? new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() : 0;
  const payableDates = new Set(attendanceRecords.filter(record => ['Present', 'Late'].includes(record.status)).map(record => record.date));
  leaveDays.paid.forEach(date => payableDates.add(date));
  const payableDays = payableDates.size;
  const proration = monthDays ? payableDays / monthDays : 0;
  const baseSalary = Math.round(monthlySalary * proration * 100) / 100;
  let gross = baseSalary;
  let deductions = 0;
  const paidLeaveLabel = leaveDays.paid.size ? ` (including ${leaveDays.paid.size} paid leave day${leaveDays.paid.size === 1 ? '' : 's'})` : '';
  const earnings = [{ description: `Basic salary${paidLeaveLabel}`, amount: baseSalary }];
  const deductionsList = [];

  for (const rule of rules) {
    const category = String(rule.category || '').toLowerCase();
    if (category === 'basic') continue;
    if (!['allowance', 'earning', 'deduction'].includes(category)) continue;
    const value = Number(rule.value || 0);
    const amount = rule.calculationType === 'Percentage'
      ? (baseSalary * value) / 100
      : value * proration;
    const roundedAmount = Math.round(amount * 100) / 100;
    if (category === 'deduction') {
      deductions += roundedAmount;
      deductionsList.push({ description: rule.name || 'Deduction', amount: roundedAmount });
    } else {
      gross += roundedAmount;
      earnings.push({ description: rule.name || 'Earning', amount: roundedAmount });
    }
  }

  gross = Math.round(gross * 100) / 100;
  deductions = Math.round(deductions * 100) / 100;
  return {
    employeeId: employee.id,
    employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || 'Employee',
    employeeNumber: employee.employeeId || employee.id,
    payrunId: payrun.id,
    payrunName: payrun.name,
    period: `${payrun.startDate || ''} to ${payrun.endDate || ''}`.trim() || 'N/A',
    structureId: payrun.structureId,
    structureName: payrun.structureName,
    companyName: companyName || 'PeoplePay360',
    attendanceDays: attendanceRecords.length,
    payableDays,
    paidLeaveDays: leaveDays.paid.size,
    unpaidLeaveDays: leaveDays.unpaid.size,
    gross,
    deductions,
    net: Math.max(0, Math.round((gross - deductions) * 100) / 100),
    status: 'Computed',
    earnings,
    deductionsList: deductionsList.length ? deductionsList : [{ description: 'Standard deduction', amount: 0 }],
    contract: employee.contractType || 'Full-time',
    department: employee.department || 'General',
    position: employee.position || 'Employee'
  };
}
function ensureOnboarding(user) {
  if (!user || user.role === 'Admin') return;
  const onboarding = readRecords('onboarding').find(item =>
    item.userId === user.id || item.email?.toLowerCase() === user.email?.toLowerCase()
  );
  const company = user.company || onboarding?.company || '';
  if (onboarding) {
    const nextRecord = {
      ...onboarding,
      userId: user.id,
      email: user.email || onboarding.email || '',
      company
    };
    if (onboarding.userId !== user.id || onboarding.email !== nextRecord.email || onboarding.company !== company) {
      writeRecord('onboarding', nextRecord);
    }
    return;
  }
  const nameParts = String(user.name || '').trim().split(/\s+/).filter(Boolean);
  writeRecord('onboarding', {
    id: `ONBOARDING-${user.id}`,
    userId: user.id,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    email: user.email || '',
    company,
    status: 'Pending'
  });
}
function syncOnboardingFromEmployee(onboarding, employee = null) {
  const source = employee || {};
  const merged = {
    ...onboarding,
    id: onboarding?.id || source.id || `ONBOARDING-${source.userId || source.id || Date.now()}`,
    userId: onboarding?.userId || source.userId || '',
    firstName: onboarding?.firstName || source.firstName || '',
    lastName: onboarding?.lastName || source.lastName || '',
    email: onboarding?.email || source.email || '',
    company: onboarding?.company || source.company || '',
    phone: onboarding?.phone || source.phone || '',
    dob: onboarding?.dob || source.dob || '',
    address: onboarding?.address || source.address || '',
    employeeId: onboarding?.employeeId || source.employeeId || '',
    department: onboarding?.department || source.department || '',
    position: onboarding?.position || source.position || '',
    manager: onboarding?.manager || source.manager || '',
    joiningDate: onboarding?.joiningDate || source.joiningDate || '',
    schedule: onboarding?.schedule || source.schedule || '',
    salary: onboarding?.salary ?? source.salary ?? 0,
    contractType: onboarding?.contractType || source.contractType || '',
    status: onboarding?.status || 'Completed'
  };
  return merged;
}

function syncEmployeeFromOnboarding(onboarding) {
  if (!onboarding) return;
  const existing = readRecords('employees').find(item =>
    item.userId === onboarding.userId ||
    item.email?.toLowerCase() === onboarding.email?.toLowerCase() ||
    item.employeeId === onboarding.employeeId
  );
  const employeeRecord = {
    ...existing,
    id: existing?.id || onboarding.userId || `EMP-${Date.now()}`,
    userId: onboarding.userId || existing?.userId || '',
    firstName: onboarding.firstName || existing?.firstName || '',
    lastName: onboarding.lastName || existing?.lastName || '',
    email: onboarding.email || existing?.email || '',
    company: onboarding.company || existing?.company || '',
    phone: onboarding.phone || existing?.phone || '',
    dob: onboarding.dob || existing?.dob || '',
    address: onboarding.address || existing?.address || '',
    employeeId: onboarding.employeeId || existing?.employeeId || `EMP-${(onboarding.userId || existing?.userId || '').replace(/[^A-Z0-9]/gi, '').slice(0, 8) || 'NEW'}`,
    department: onboarding.department || existing?.department || '',
    position: onboarding.position || existing?.position || '',
    manager: onboarding.manager || existing?.manager || '',
    joiningDate: onboarding.joiningDate || existing?.joiningDate || '',
    schedule: onboarding.schedule || existing?.schedule || '',
    salary: onboarding.salary ?? existing?.salary ?? 0,
    contractType: onboarding.contractType || existing?.contractType || '',
    status: 'Active',
    password: existing?.password || 'PeoplePay360123!',
    accountType: 'Employee'
  };
  const hydratedOnboarding = syncOnboardingFromEmployee(onboarding, employeeRecord);
  if (onboarding.status === 'Completed' || existing || hydratedOnboarding.phone || hydratedOnboarding.address || hydratedOnboarding.salary) {
    if (JSON.stringify(onboarding) !== JSON.stringify(hydratedOnboarding)) {
      writeRecord('onboarding', hydratedOnboarding);
    }
  }
  if (!existing || JSON.stringify(existing) !== JSON.stringify(employeeRecord)) {
    writeRecord('employees', employeeRecord);
  }
}
function reconcileOnboarding() {
  for (const user of readRecords('users')) ensureOnboarding(user);
  const employeeRecords = readRecords('employees');
  for (const employee of employeeRecords) {
    const onboarding = readRecords('onboarding').find(item =>
      item.userId === employee.userId ||
      item.email?.toLowerCase() === employee.email?.toLowerCase() ||
      item.employeeId === employee.employeeId
    );
    const merged = syncOnboardingFromEmployee(onboarding || {
      id: `ONBOARDING-${employee.userId || employee.id}`,
      userId: employee.userId || employee.id,
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      company: employee.company || '',
      phone: employee.phone || '',
      dob: employee.dob || '',
      address: employee.address || '',
      employeeId: employee.employeeId || '',
      department: employee.department || '',
      position: employee.position || '',
      manager: employee.manager || '',
      joiningDate: employee.joiningDate || '',
      schedule: employee.schedule || '',
      salary: employee.salary ?? 0,
      contractType: employee.contractType || '',
      status: 'Completed'
    }, employee);
    if (!onboarding || JSON.stringify(onboarding) !== JSON.stringify(merged)) {
      writeRecord('onboarding', merged);
    }
  }
  for (const record of readRecords('onboarding')) {
    const match = employeeRecords.find(item =>
      item.userId === record.userId ||
      item.email?.toLowerCase() === record.email?.toLowerCase() ||
      item.employeeId === record.employeeId
    );
    if (match) {
      const next = syncOnboardingFromEmployee(record, match);
      if (JSON.stringify(record) !== JSON.stringify(next)) {
        writeRecord('onboarding', next);
      }
      syncEmployeeFromOnboarding(next);
      continue;
    }
    syncEmployeeFromOnboarding(record);
  }
}

function buildSeedEmployees() {
  const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Ishaan', 'Rohan', 'Kabir', 'Ananya', 'Diya', 'Meera', 'Saanvi', 'Yash', 'Arjun', 'Krishna', 'Nisha', 'Pooja', 'Aisha', 'Riya', 'Kavya', 'Tanvi', 'Neha', 'Dev', 'Aditi', 'Rhea', 'Pranav', 'Ira', 'Shaurya', 'Harsh', 'Mira', 'Nayan', 'Tanya', 'Karan', 'Simran', 'Om', 'Jiya', 'Aayush', 'Zoya', 'Eshaan', 'Sara', 'Siddharth', 'Anvi', 'Varun', 'Ritika', 'Mohit', 'Priya', 'Vansh', 'Naina', 'Rahul', 'Aanya', 'Vikram', 'Swara', 'Kian', 'Mitali', 'Akash', 'Nitya', 'Vivaan', 'Sanvi', 'Piyush', 'Bhavya', 'Parth', 'Aastha', 'Yuvraj', 'Suhani', 'Dhruv', 'Arushi', 'Nakul', 'Kaira', 'Rishabh', 'Palak'];
  const lastNames = ['Sharma', 'Patel', 'Nair', 'Reddy', 'Singh', 'Kumar', 'Mehta', 'Kapoor', 'Saxena', 'Iyer', 'Verma', 'Chaudhary', 'Roy', 'Bhatt', 'Joshi', 'Gupta', 'Malhotra', 'Desai', 'Sen', 'Dutta', 'Mishra', 'Jain', 'Khanna', 'Menon', 'Vora', 'Sethi', 'Bhatia', 'Kulkarni', 'Rao', 'Naik', 'Shah', 'Tiwari', 'Banerjee', 'Lal', 'Dhawan', 'Agarwal', 'Bose', 'Khan', 'Pillai', 'Madan', 'Goyal', 'Chopra', 'Suri', 'Bedi', 'Rastogi', 'Mittal', 'Bhandari', 'Bharadwaj', 'Nandagopal', 'Narayan', 'Sawant', 'Saxena', 'Tripathi', 'Shetty', 'Iliyas', 'Upadhyay', 'Mathur', 'Purohit', 'Arora', 'Yadav'];
  const departments = ['Engineering', 'HR', 'Finance', 'Operations', 'Support'];
  const roles = ['Software Engineer', 'Senior Engineer', 'Product Manager', 'HR Business Partner', 'Finance Analyst', 'Operations Lead', 'Support Specialist', 'QA Engineer', 'Data Analyst', 'Business Analyst'];
  const weekendSchedules = ['Mon-Fri Standard', 'Mon-Sat Standard', 'Night Shift'];
  const employees = [];
  const seen = new Set();
  for (let i = 1; i <= 201; i += 1) {
    let firstName = firstNames[(i - 1) % firstNames.length];
    let lastName = lastNames[(i * 7 + 3) % lastNames.length];
    let key = `${firstName}-${lastName}`;
    let attempts = 0;
    while (seen.has(key) && attempts < 50) {
      firstName = firstNames[(i + attempts * 3) % firstNames.length];
      lastName = lastNames[(i * 11 + attempts * 5) % lastNames.length];
      key = `${firstName}-${lastName}`;
      attempts += 1;
    }
    seen.add(key);
    const department = departments[(i - 1) % departments.length];
    const role = roles[(i - 1) % roles.length];
    const employeeId = `PP360-${String(i).padStart(4, '0')}`;
    employees.push({
      id: `EMP-${String(i).padStart(4, '0')}`,
      userId: `USER-${String(i).padStart(4, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@peoplepay360.com`,
      company: 'PeoplePay360',
      phone: `+91 98${String((i * 17) % 90000000 + 10000000).padStart(8, '0')}`,
      dob: `199${(i % 7) + 1}-0${((i + 1) % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
      address: `${i} ${department} Lane, Bengaluru`,
      employeeId,
      department,
      position: role,
      manager: department === 'Engineering' ? 'Maya HR Manager' : 'Aarav Kapoor',
      joiningDate: `202${(i % 3) + 1}-0${((i + 2) % 9) + 1}-0${((i + 1) % 9) + 1}`,
      schedule: weekendSchedules[(i - 1) % weekendSchedules.length],
      salary: 42000 + (i * 1350),
      contractType: i % 2 === 0 ? 'Full-time' : 'Contract',
      status: 'Active',
      password: 'PeoplePay360123!',
      accountType: 'Employee',
      accountHolder: `${firstName} ${lastName}`,
      bankName: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra'][i % 5],
      accountNumber: `100${String((i * 117) % 90000000 + 10000000).padStart(8, '0')}`,
      bankCode: `IFSC${String((i * 17) % 9000 + 1000).padStart(4, '0')}`
    });
  }
  return employees;
}

function seedReferenceData() {
  db.run('DELETE FROM records WHERE collection IN (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['departments', 'schedules', 'leaveTypes', 'employees', 'attendance', 'leaveRequests', 'contracts', 'users', 'onboarding']);
  db.run('DELETE FROM departments');
  db.run('DELETE FROM schedules');
  db.run('DELETE FROM leave_types');
  db.run('DELETE FROM employees');
  db.run('DELETE FROM attendance');
  db.run('DELETE FROM leave_requests');
  db.run('DELETE FROM contracts');

  const deptSeed = [
    { id: 'DEP-ENG', name: 'Engineering', manager: 'Aarav Kapoor', description: 'Product engineering and platform delivery', status: 'Active' },
    { id: 'DEP-HR', name: 'HR', manager: 'Maya HR Manager', description: 'People operations and employee lifecycle', status: 'Active' },
    { id: 'DEP-FIN', name: 'Finance', manager: 'Isha Payroll Manager', description: 'Payroll, accounting and budgeting', status: 'Active' },
    { id: 'DEP-OPS', name: 'Operations', manager: 'Noah Payroll User', description: 'Process execution and facilities', status: 'Active' },
    { id: 'DEP-SUP', name: 'Support', manager: 'Aarav Kapoor', description: 'Customer and service support', status: 'Active' }
  ];
  for (const item of deptSeed) {
    writeRecord('departments', item);
    upsertDepartmentRecord(item);
  }

  const scheduleSeed = [
    { id: 'SCH-MF', name: 'Mon-Fri Standard', startDay: 'Monday', endDay: 'Friday', startTime: '09:00', endTime: '17:00', status: 'Active' },
    { id: 'SCH-MS', name: 'Mon-Sat Standard', startDay: 'Monday', endDay: 'Saturday', startTime: '09:00', endTime: '18:00', status: 'Active' },
    { id: 'SCH-NIGHT', name: 'Night Shift', startDay: 'Monday', endDay: 'Friday', startTime: '19:00', endTime: '03:00', status: 'Active' }
  ];
  for (const item of scheduleSeed) {
    writeRecord('schedules', item);
    upsertScheduleRecord(item);
  }

  const leaveTypeSeed = [
    { id: 'LT-PL', name: 'Paid Leave', code: 'PL', days: 18, type: 'Paid', description: 'Company-provided paid time off', status: 'Active' },
    { id: 'LT-SL', name: 'Sick Leave', code: 'SL', days: 10, type: 'Paid', description: 'Medical leave for illness or recovery', status: 'Active' },
    { id: 'LT-CL', name: 'Casual Leave', code: 'CL', days: 8, type: 'Paid', description: 'Short-notice leave for personal matters', status: 'Active' },
    { id: 'LT-UL', name: 'Unpaid Leave', code: 'UL', days: 30, type: 'Unpaid', description: 'Leave without pay for approved reasons', status: 'Active' },
    { id: 'LT-ML', name: 'Maternity Leave', code: 'ML', days: 90, type: 'Paid', description: 'Maternity or parental support leave', status: 'Active' },
    { id: 'LT-BL', name: 'Bereavement Leave', code: 'BL', days: 3, type: 'Paid', description: 'Time off for family emergencies', status: 'Active' }
  ];
  for (const item of leaveTypeSeed) {
    writeRecord('leaveTypes', item);
    upsertLeaveTypeRecord(item);
  }

  const salaryStructureSeed = [
    { id: 'SAL-REG', name: 'Regular Salary', description: 'Standard monthly compensation structure', currency: 'INR', frequency: 'Monthly', status: 'Active' },
    { id: 'SAL-OT', name: 'Overtime Salary', description: 'Additional overtime allowance', currency: 'INR', frequency: 'Monthly', status: 'Active' },
    { id: 'SAL-EXEC', name: 'Executive CTC', description: 'Executive monthly salary structure', currency: 'INR', frequency: 'Monthly', status: 'Active' }
  ];
  for (const item of salaryStructureSeed) {
    writeRecord('salaryStructures', item);
  }

  const salaryRuleSeed = [
    { id: 'SR-001', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculationType: 'Fixed amount', value: 30000, sequence: 1, status: 'Active' },
    { id: 'SR-002', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'House Rent Allowance', code: 'HRA', category: 'Allowance', calculationType: 'Percentage', value: 20, sequence: 10, status: 'Active' },
    { id: 'SR-003', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Standard Allowance', code: 'STA', category: 'Allowance', calculationType: 'Fixed amount', value: 5000, sequence: 20, status: 'Active' },
    { id: 'SR-004', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Performance Bonus', code: 'BONUS', category: 'Allowance', calculationType: 'Percentage', value: 10, sequence: 30, status: 'Active' },
    { id: 'SR-005', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculationType: 'Formula', value: 0, sequence: 60, status: 'Active' },
    { id: 'SR-006', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Provident Fund', code: 'PF', category: 'Deduction', calculationType: 'Percentage', value: 12, sequence: 80, status: 'Active' },
    { id: 'SR-007', structureId: 'SAL-REG', structureName: 'Regular Salary', name: 'Net Salary', code: 'NET', category: 'Net', calculationType: 'Formula', value: 0, sequence: 110, status: 'Active' },
    { id: 'SR-008', structureId: 'SAL-EXEC', structureName: 'Executive CTC', name: 'Base Salary', code: 'BASE', category: 'Basic', calculationType: 'Fixed amount', value: 60000, sequence: 1, status: 'Active' },
    { id: 'SR-009', structureId: 'SAL-EXEC', structureName: 'Executive CTC', name: 'Executive Allowance', code: 'EA', category: 'Allowance', calculationType: 'Fixed amount', value: 15000, sequence: 20, status: 'Active' },
    { id: 'SR-010', structureId: 'SAL-EXEC', structureName: 'Executive CTC', name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculationType: 'Formula', value: 0, sequence: 60, status: 'Active' },
    { id: 'SR-011', structureId: 'SAL-OT', structureName: 'Overtime Salary', name: 'Overtime Hours', code: 'OT', category: 'Allowance', calculationType: 'Fixed amount', value: 250, sequence: 10, status: 'Active' },
    { id: 'SR-012', structureId: 'SAL-OT', structureName: 'Overtime Salary', name: 'Net Overtime', code: 'OTNET', category: 'Net', calculationType: 'Formula', value: 0, sequence: 30, status: 'Active' }
  ];
  for (const item of salaryRuleSeed) {
    writeRecord('salaryRules', item);
  }

  const mockEmployees = buildSeedEmployees();
  for (const item of mockEmployees) {
    writeRecord('employees', item);
    upsertEmployeeRecord(item);
  }

  for (const item of mockEmployees) {
    const userName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const account = {
      id: item.userId || item.id,
      name: userName,
      email: item.email,
      password: item.password || 'PeoplePay360123!',
      company: item.company || 'PeoplePay360',
      role: item.accountType || 'Employee',
      accountType: item.accountType || 'Employee',
      status: item.status || 'Active'
    };
    const existing = readRecords('users').find(user => user.email?.toLowerCase() === item.email?.toLowerCase());
    if (!existing) {
      writeRecord('users', account);
    }
    const onboarding = readRecords('onboarding').find(record => record.email?.toLowerCase() === item.email?.toLowerCase() || record.userId === item.userId);
    if (!onboarding) {
      writeRecord('onboarding', {
        id: `ONBOARDING-${item.userId || item.id}`,
        userId: item.userId || item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        company: item.company || 'PeoplePay360',
        department: item.department || '',
        position: item.position || '',
        schedule: item.schedule || '',
        employeeId: item.employeeId || '',
        status: 'Completed'
      });
    }
  }
}
app.get('/api/health', (_req, res) => res.json({ ok: true, database: 'sqlite' }));
app.get('/api/:collection', (req, res) => {
  if (!valid(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' });
  if (req.params.collection === 'onboarding') reconcileOnboarding();
  const allRecords = req.params.collection === 'users' ? mergeUserAccounts() : readRecords(req.params.collection);
  const limit = Number.parseInt(req.query.limit, 10);
  const offset = Number.parseInt(req.query.offset, 10);
  const paginated = Number.isFinite(limit) && limit > 0
    ? allRecords.slice(Number.isFinite(offset) && offset > 0 ? offset : 0, (Number.isFinite(offset) && offset > 0 ? offset : 0) + limit)
    : allRecords;
  res.json({ data: paginated, total: allRecords.length, limit: Number.isFinite(limit) ? limit : null, offset: Number.isFinite(offset) ? offset : 0 });
});
app.post('/api/payruns/:id/compute', (req, res) => {
  const payrun = readRecords('payruns').find(item => item.id === req.params.id);
  if (!payrun) return res.status(404).json({ error: 'Payrun not found.' });
  if (payrun.status !== 'Draft') return res.status(409).json({ error: 'Only draft payruns can be computed.' });

  const rules = readRecords('salaryRules').filter(rule =>
    String(rule.structureId || rule.structure || '').toLowerCase() === String(payrun.structureId || '').toLowerCase() ||
    String(rule.structureName || '').toLowerCase() === String(payrun.structureName || '').toLowerCase()
  ).sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));
  const employeeIds = new Set(payrun.employeeIds || []);
  const employees = readRecords('employees').filter(employee => employeeIds.has(employee.id) || employeeIds.has(employee.employeeId));
  if (!employees.length) return res.status(400).json({ error: 'Select at least one employee before computing payroll.' });
  const attendance = readRecords('attendance');
  const leaveRequests = readRecords('leaveRequests');
  const leaveTypes = readRecords('leaveTypes');
  const attendanceByEmployee = new Map();
  const leaveDaysByEmployee = new Map();
  const missingAttendance = [];
  for (const employee of employees) {
    const employeeAttendance = attendance.filter(record =>
      (record.employeeId === employee.id || record.employeeId === employee.employeeId) &&
      record.date >= payrun.startDate && record.date <= payrun.endDate
    );
    attendanceByEmployee.set(employee.id, employeeAttendance);
    const leaveDays = getLeaveDays(employee, payrun, leaveRequests, leaveTypes);
    leaveDaysByEmployee.set(employee.id, leaveDays);
    if (!employeeAttendance.length && !leaveDays.paid.size && !leaveDays.unpaid.size) {
      missingAttendance.push(employee.employeeId || employee.id);
    }
  }
  const uniqueMissingAttendance = [...new Set(missingAttendance)];
  if (uniqueMissingAttendance.length) {
    return res.status(422).json({
      error: `Cannot compute payroll: attendance or approved leave is missing for ${uniqueMissingAttendance.length} selected employee(s) in the pay period.`,
      missingEmployees: uniqueMissingAttendance
    });
  }
  const settings = readRecords('settings')[0] || {};
  const existing = readRecords('payslips').filter(item => item.payrunId === payrun.id);
  const generated = employees.map(employee => {
    const payslip = calculatePayrunPayslip(payrun, employee, rules, settings.companyName, attendanceByEmployee.get(employee.id) || [], leaveDaysByEmployee.get(employee.id) || { paid: new Set(), unpaid: new Set() });
    const prior = existing.find(item => item.employeeId === employee.id || item.employeeId === employee.employeeId);
    return writeRecord('payslips', { ...payslip, id: prior?.id || `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  });
  const updatedPayrun = writeRecord('payruns', { ...payrun, status: 'Computed' });
  res.json({ data: { payrun: updatedPayrun, payslips: generated } });
});
app.post('/api/:collection', (req, res) => {
  if (!valid(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' });
  if (req.params.collection === 'users') {
    const { name, email, password, role, accountType } = req.body || {};
    const selectedRole = role || accountType || 'Employee';
    if (!name || !email || !password || !selectedRole) return res.status(400).json({ error: 'Name, email, password, and account type are required.' });
    const existing = mergeUserAccounts().find(user => user.email?.toLowerCase() === String(email).toLowerCase());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
    req.body = { ...req.body, role: selectedRole, accountType: selectedRole === 'Employee' ? 'Employee' : (accountType || selectedRole), status: req.body?.status || 'Active' };
  }
  const record = writeRecord(req.params.collection, req.body || {});
  if (req.params.collection === 'users') {
    const onboarding = readRecords('onboarding');
    if (!onboarding.some(item => item.userId === record.id)) {
      writeRecord('onboarding', {
        userId: record.id,
        firstName: record.name?.split(/\s+/)[0] || '',
        lastName: record.name?.split(/\s+/).slice(1).join(' ') || '',
        email: record.email,
        company: record.company || '',
        status: 'Pending'
      });
    }
  }
  if (req.params.collection === 'onboarding') {
    syncEmployeeFromOnboarding(record);
  }
  const response = req.params.collection === 'users' ? publicUser(record) : record;
  res.status(201).json({ data: response });
});
app.put('/api/:collection/:id', (req, res) => {
  if (!valid(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' });
  const record = writeRecord(req.params.collection, { ...(req.body || {}), id: req.params.id });
  if (req.params.collection === 'users') ensureOnboarding(record);
  if (req.params.collection === 'onboarding') syncEmployeeFromOnboarding(record);
  res.json({ data: req.params.collection === 'users' ? publicUser(record) : record });
});
app.delete('/api/:collection/:id', (req, res) => {
  if (!valid(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' });
  const { collection, id } = req.params;

  const deleteCollectionRows = (targetCollection, predicate) => {
    for (const record of readRecords(targetCollection)) {
      if (predicate(record)) {
        db.run('DELETE FROM records WHERE collection = ? AND id = ?', [targetCollection, record.id]);
      }
    }
  };

  const normalize = value => String(value ?? '').trim().toLowerCase();

  if (collection === 'users') {
    const user = readRecords('users').find(item => item.id === id);
    if (user) {
      const matchingEmployees = readRecords('employees').filter(item =>
        item.id === user.id ||
        item.userId === user.id ||
        normalize(item.email) === normalize(user.email) ||
        normalize(item.employeeId) === normalize(user.id) ||
        normalize(item.employeeId) === normalize(user.email)
      );
      const employeeIds = new Set(matchingEmployees.map(item => item.id));
      const employeeCodes = new Set(matchingEmployees.map(item => item.employeeId).filter(Boolean));
      const userValues = new Set([
        user.id,
        user.email,
        user.name,
        user.employeeId,
        user.accountType,
      ].filter(Boolean).map(value => normalize(value)));

      for (const employee of matchingEmployees) {
        db.run('DELETE FROM employees WHERE id = ? OR userId = ? OR email = ? OR employeeId = ?', [employee.id, employee.userId, employee.email, employee.employeeId]);
      }

      deleteCollectionRows('onboarding', record =>
        record.userId === user.id ||
        normalize(record.email) === normalize(user.email) ||
        employeeCodes.has(record.employeeId) ||
        employeeIds.has(record.userId) ||
        employeeIds.has(record.id)
      );

      for (const collectionName of ['attendance', 'contracts', 'leaveRequests', 'leaveAllocations', 'myAttendance']) {
        deleteCollectionRows(collectionName, record => {
          const employeeIdentifier = normalize(record.employeeId);
          const userIdentifier = normalize(record.userId);
          const emailIdentifier = normalize(record.email);
          return employeeIds.has(record.employeeId) ||
            employeeCodes.has(record.employeeId) ||
            employeeIds.has(record.userId) ||
            employeeIds.has(record.id) ||
            userValues.has(employeeIdentifier) ||
            userValues.has(userIdentifier) ||
            userValues.has(emailIdentifier) ||
            normalize(record.employeeId) === normalize(user.id) ||
            normalize(record.userId) === normalize(user.id);
        });
      }
    }
  }

  if (collection === 'employees') {
    const employee = readRecords('employees').find(item => item.id === id);
    if (employee) {
      const userMatch = readRecords('users').find(item =>
        item.id === employee.userId ||
        normalize(item.email) === normalize(employee.email)
      );
      if (userMatch) db.run('DELETE FROM records WHERE collection = ? AND id = ?', ['users', userMatch.id]);

      const employeeCodes = new Set([employee.employeeId, employee.id, employee.userId].filter(Boolean).map(value => normalize(value)));
      deleteCollectionRows('onboarding', record =>
        record.userId === employee.userId ||
        normalize(record.email) === normalize(employee.email) ||
        employeeCodes.has(normalize(record.employeeId)) ||
        employeeCodes.has(normalize(record.userId))
      );

      for (const collectionName of ['attendance', 'contracts', 'leaveRequests', 'leaveAllocations', 'myAttendance']) {
        deleteCollectionRows(collectionName, record =>
          employeeCodes.has(normalize(record.employeeId)) ||
          employeeCodes.has(normalize(record.userId)) ||
          normalize(record.email) === normalize(employee.email) ||
          normalize(record.id) === normalize(employee.id)
        );
      }
      db.run('DELETE FROM employees WHERE id = ?', [id]);
    }
  }

  db.run('DELETE FROM records WHERE collection = ? AND id = ?', [collection, id]);
  if (collection === 'employees') db.run('DELETE FROM employees WHERE id = ?', [id]);
  persist();
  res.status(204).end();
});
const ensureDemoAccounts = () => {
  const demoAccounts = [
    { id: 'DEMO-ADMIN', name: 'Aarav Kapoor', email: 'demo@peoplepay360.com', password: 'PeoplePay360123!', company: 'PeoplePay360', role: 'Admin', accountType: 'Admin', status: 'Active' },
    { id: 'DEMO-HR-MANAGER', name: 'Maya HR Manager', email: 'hr.manager@peoplepay360.com', password: 'HRManager123!', company: 'PeoplePay360', role: 'HR Manager', accountType: 'HR Manager', status: 'Active' },
    { id: 'DEMO-PAYROLL-USER', name: 'Noah Payroll User', email: 'payroll.user@peoplepay360.com', password: 'PayrollUser123!', company: 'PeoplePay360', role: 'HR Payroll User', accountType: 'HR Payroll User', status: 'Active' },
    { id: 'DEMO-PAYROLL-MANAGER', name: 'Isha Payroll Manager', email: 'payroll.manager@peoplepay360.com', password: 'PayrollManager123!', company: 'PeoplePay360', role: 'HR Payroll Manager', accountType: 'HR Payroll Manager', status: 'Active' },
    { id: 'DEMO-EMPLOYEE', name: 'Ethan Employee', email: 'employee@peoplepay360.com', password: 'Employee123!', company: 'PeoplePay360', role: 'Employee', accountType: 'Employee', status: 'Active' }
  ];

  for (const account of demoAccounts) {
    const existing = readRecords('users').find(user =>
      String(user.email || '').trim().toLowerCase() === String(account.email).trim().toLowerCase() ||
      String(user.id || '').trim() === String(account.id).trim()
    );

    const record = {
      ...existing,
      id: existing?.id || account.id,
      name: account.name,
      email: account.email,
      password: account.password,
      company: account.company,
      role: account.role,
      accountType: account.accountType,
      status: account.status || 'Active'
    };

    if (!existing) {
      writeRecord('users', record);
      continue;
    }

    const changed = JSON.stringify(existing) !== JSON.stringify(record);
    if (changed) {
      writeRecord('users', record);
    }
  }
};

function ensureAttendanceHistory() {
  const employees = readRecords('employees');
  if (!employees.length) return;

  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const attendanceRecords = readRecords('attendance');
  const generatedHistory = attendanceRecords.filter(record => String(record.id || '').startsWith('ATT-HISTORY-'));
  for (const record of generatedHistory) db.run('DELETE FROM attendance WHERE id = ?', [record.id]);
  db.run("DELETE FROM records WHERE collection = 'attendance' AND id LIKE 'ATT-HISTORY-%'");
  const existingKeys = new Set(readRecords('attendance').map(item => `${item.employeeId}|${item.date}`));
  let created = 0;

  db.run('BEGIN TRANSACTION');
  try {
    for (const employee of employees) {
      for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const day = date.getDay();
        if (day === 0 || day === 6) continue;
        const dateValue = formatDate(date);
        const employeeId = employee.employeeId || employee.id;
        const key = `${employeeId}|${dateValue}`;
        if (existingKeys.has(key)) continue;

        const seed = [...`${employee.id}-${dateValue}`].reduce((sum, character) => sum + character.charCodeAt(0), 0);
        const status = seed % 20 === 0 ? 'Absent' : seed % 9 === 0 ? 'Late' : 'Present';
        const record = {
          id: `ATT-HISTORY-${employee.id}-${dateValue}`,
          employeeId,
          date: dateValue,
          checkIn: status === 'Absent' ? '' : status === 'Late' ? '09:24' : '09:00',
          checkOut: status === 'Absent' ? '' : '17:30',
          status,
          notes: status === 'Absent' ? 'Scheduled absence' : status === 'Late' ? 'Late arrival' : 'Regular workday'
        };
        db.run(`INSERT INTO records(id, collection, data) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
        [record.id, 'attendance', JSON.stringify(record)]);
        upsertAttendanceRecord(record);
        existingKeys.add(key);
        created += 1;
      }
    }
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  if (created) persist();
  console.log(`Attendance history ready: ${created} records added for ${employees.length} employees.`);
}

function ensureLeaveHistory() {
  const employees = readRecords('employees');
  const leaveTypes = readRecords('leaveTypes');
  if (!employees.length || !leaveTypes.length) return;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const existing = new Set(readRecords('leaveRequests').map(item => item.id));
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  let created = 0;

  db.run('BEGIN TRANSACTION');
  try {
    for (const [index, employee] of employees.entries()) {
      const seed = [...employee.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
      const monthStart = new Date(start.getFullYear(), start.getMonth() + (seed % 3), 1);
      const leaveDate = new Date(monthStart);
      leaveDate.setDate(1 + (seed % 18));
      while (leaveDate.getDay() === 0 || leaveDate.getDay() === 6) leaveDate.setDate(leaveDate.getDate() + 1);
      const duration = 1 + (seed % 3);
      const leaveEnd = new Date(leaveDate);
      let workdays = 1;
      while (workdays < duration) {
        leaveEnd.setDate(leaveEnd.getDate() + 1);
        if (leaveEnd.getDay() !== 0 && leaveEnd.getDay() !== 6) workdays += 1;
      }
      const leaveType = leaveTypes[index % leaveTypes.length];
      const id = `LEAVE-HISTORY-${employee.id}-${formatDate(leaveDate)}`;
      if (existing.has(id)) continue;
      const record = {
        id,
        employeeId: employee.employeeId || employee.id,
        leaveType: leaveType.name,
        year: String(leaveDate.getFullYear()),
        allocated: leaveType.days || 0,
        used: duration,
        status: seed % 5 === 0 ? 'Pending' : 'Approved',
        startDate: formatDate(leaveDate),
        endDate: formatDate(leaveEnd),
        reason: `Demo ${leaveType.name.toLowerCase()} request`
      };
      db.run(`INSERT INTO records(id, collection, data) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
      [record.id, 'leaveRequests', JSON.stringify(record)]);
      upsertLeaveRequestRecord(record);
      existing.add(id);
      created += 1;
    }
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  if (created) persist();
  console.log(`Leave history ready: ${created} demo requests added for ${employees.length} employees.`);
}
ensureDemoAccounts();
ensureAttendanceHistory();
ensureLeaveHistory();
app.post('/api/auth/login', (req, res) => {
  ensureDemoAccounts();
  const emailInput = String(req.body?.email || '').trim().toLowerCase();
  const passwordInput = String(req.body?.password || '');

  const user = readRecords('users').find(item =>
    String(item.email || '').trim().toLowerCase() === emailInput &&
    String(item.password || '') === passwordInput &&
    item.status !== 'Inactive'
  ) || mergeUserAccounts().find(item =>
    String(item.email || '').trim().toLowerCase() === emailInput &&
    String(item.password || '') === passwordInput &&
    item.status !== 'Inactive'
  );

  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json({ data: { id: user.id, company: user.company || 'PeoplePay360', name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email, email: user.email, role: normaliseAccountRole(user) } });
});
const dist = path.join(root, 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), error => error && res.status(404).json({ error: 'Build the frontend first.' }));
});
const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`PeoplePay360 server listening on http://localhost:${port}`));
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.warn(`Port ${port} is already in use. Using the existing PeoplePay360 API server.`);
    return;
  }
  throw error;
});
