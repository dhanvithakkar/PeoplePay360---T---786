import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import './styles.css';
import '../shared/css/main.css';
import '../shared/css/components.css';
import '../shared/css/dashboard.css';
import '../shared/css/forms.css';
import '../shared/css/responsive.css';
import '../shared/css/employees.css';
import '../shared/css/leave.css';
import '../shared/css/organization.css';
import '../shared/css/payroll.css';
import '../shared/css/payslips.css';
import '../shared/css/reports.css';
import '../shared/css/settings.css';

const navGroups = [
  ['Overview', [['Dashboard', '/', 'bi-grid-1x2']]],
  ['HR Management', [['Employees', '/employees', 'bi-people', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Onboarding', '/onboarding', 'bi-person-plus', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Departments', '/departments', 'bi-diagram-3', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Working Schedules', '/schedules', 'bi-calendar3', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Contracts', '/contracts', 'bi-file-earmark-text', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']]]],
  ['Attendance', [['Attendance', '/attendance', 'bi-clock-history', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['My Attendance', '/my-attendance', 'bi-person-check']]],
  ['Time Off', [['Leave Types', '/leave-types', 'bi-tags', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Leave Allocations', '/leave-allocations', 'bi-pie-chart', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Leave Requests', '/leave-requests', 'bi-calendar2-check']]],
  ['Payroll', [['Salary Structures', '/salary-structures', 'bi-layers', ['HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Salary Rules', '/salary-rules', 'bi-list-check', ['HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Payruns', '/payruns', 'bi-calculator', ['HR Payroll User', 'HR Payroll Manager', 'Admin']], ['Payslips', '/payslips', 'bi-receipt', ['HR Payroll User', 'HR Payroll Manager', 'Admin']]]],
  ['Analytics', [['Reports', '/reports', 'bi-bar-chart', ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']]]],
  ['System', [['Users', '/users', 'bi-person-gear', ['Admin']], ['Settings', '/settings', 'bi-gear', ['Admin']]]]
];

const configs = {
  employees: { title: 'Employees', singular: 'employee', collection: 'employees', subtitle: 'Keep your people directory, employment details, and payroll inputs in one place.', fields: [
    ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Work email', 'email'], ['phone', 'Phone'], ['dob', 'Date of birth', 'date'], ['address', 'Address', 'textarea'], ['employeeId', 'Employee ID'], ['department', 'Department'], ['position', 'Position'], ['manager', 'Manager'], ['joiningDate', 'Joining date', 'date'], ['status', 'Status', 'select', ['Active', 'Inactive']], ['schedule', 'Working schedule'], ['salary', 'Monthly salary', 'number'], ['contractType', 'Contract type'], ['accountHolder', 'Account holder'], ['bankName', 'Bank name'], ['accountNumber', 'Account number'], ['bankCode', 'Bank code']
  ], columns: [['name', 'Name'], ['email', 'Email'], ['department', 'Department'], ['position', 'Position'], ['status', 'Status']] },
  departments: { title: 'Departments', singular: 'department', collection: 'departments', subtitle: 'Organize teams and assign managers across your company.', fields: [['name', 'Department name'], ['manager', 'Manager'], ['description', 'Description', 'textarea'], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Department'], ['manager', 'Manager'], ['status', 'Status']] },
  schedules: { title: 'Working schedules', singular: 'schedule', collection: 'schedules', subtitle: 'Define the schedules used for attendance and employee planning.', fields: [['name', 'Schedule name'], ['startDay', 'Start day', 'select', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']], ['endDay', 'End day', 'select', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']], ['description', 'Description', 'textarea'], ['startTime', 'Start time', 'time'], ['endTime', 'End time', 'time'], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Schedule'], ['startDay', 'Start day'], ['endDay', 'End day'], ['startTime', 'Start'], ['endTime', 'End'], ['status', 'Status']] },
  contracts: { title: 'Contracts', singular: 'contract', collection: 'contracts', subtitle: 'Track employment contracts, compensation, and dates.', fields: [['employeeId', 'Employee ID', 'select'], ['department', 'Department', 'select'], ['position', 'Position'], ['schedule', 'Working schedule', 'select'], ['startDate', 'Start date', 'date'], ['endDate', 'End date', 'date'], ['salary', 'Salary', 'number'], ['salaryStructure', 'Salary structure'], ['status', 'Status', 'select', ['Active', 'Expired', 'Draft']]], columns: [['employeeId', 'Employee'], ['position', 'Position'], ['schedule', 'Working schedule'], ['startDate', 'Start date'], ['salary', 'Salary'], ['status', 'Status']] },
  attendance: { title: 'Attendance', singular: 'attendance record', collection: 'attendance', subtitle: 'Review check-ins, check-outs, and attendance health for your workforce.', fields: [['employeeId', 'Employee ID', 'select'], ['date', 'Date', 'date'], ['checkIn', 'Check in', 'time'], ['checkOut', 'Check out', 'time'], ['status', 'Status', 'select', ['Present', 'Absent', 'Late', 'On leave']], ['notes', 'Notes', 'textarea']], columns: [['employeeId', 'Employee'], ['date', 'Date'], ['checkIn', 'Check in'], ['checkOut', 'Check out'], ['status', 'Status']] },
  'my-attendance': { title: 'My attendance', singular: 'attendance record', collection: 'myAttendance', subtitle: 'Check in, check out, and review your attendance history.', fields: [['date', 'Date', 'date'], ['checkIn', 'Check in', 'time'], ['checkOut', 'Check out', 'time'], ['status', 'Status', 'select', ['Present', 'Remote', 'On leave']]], columns: [['date', 'Date'], ['checkIn', 'Check in'], ['checkOut', 'Check out'], ['status', 'Status']] },
  'leave-types': { title: 'Leave types', singular: 'leave type', collection: 'leaveTypes', subtitle: 'Configure the time off categories available to your teams.', fields: [['name', 'Leave type'], ['code', 'Code'], ['days', 'Annual days', 'number'], ['color', 'Color'], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Leave type'], ['code', 'Code'], ['days', 'Days'], ['status', 'Status']] },
  'leave-allocations': { title: 'Leave allocations', singular: 'leave allocation', collection: 'leaveAllocations', subtitle: 'Allocate available leave balances to employees.', fields: [['employeeId', 'Employee ID'], ['leaveType', 'Leave type'], ['year', 'Year', 'number'], ['allocated', 'Allocated days', 'number'], ['used', 'Used days', 'number'], ['status', 'Status', 'select', ['Active', 'Closed']]], columns: [['employeeId', 'Employee'], ['leaveType', 'Type'], ['allocated', 'Allocated'], ['used', 'Used'], ['status', 'Status']] },
  'leave-requests': { title: 'Leave requests', singular: 'leave request', collection: 'leaveRequests', subtitle: 'Review and manage employee time off requests.', fields: [['employeeId', 'Employee ID'], ['leaveType', 'Leave type'], ['startDate', 'Start date', 'date'], ['endDate', 'End date', 'date'], ['reason', 'Reason', 'textarea'], ['status', 'Status', 'select', ['Pending', 'Approved', 'Rejected']]], columns: [['employeeId', 'Employee'], ['leaveType', 'Type'], ['startDate', 'From'], ['endDate', 'To'], ['status', 'Status']] },
  'salary-structures': { title: 'Salary structures', singular: 'salary structure', collection: 'salaryStructures', subtitle: 'Build reusable compensation structures for payroll.', fields: [['name', 'Structure name'], ['description', 'Description', 'textarea'], ['currency', 'Currency'], ['frequency', 'Frequency', 'select', ['Monthly', 'Annual']], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Structure'], ['currency', 'Currency'], ['frequency', 'Frequency'], ['status', 'Status']] },
  'salary-rules': { title: 'Salary rules', singular: 'salary rule', collection: 'salaryRules', subtitle: 'Define earnings, deductions, and payroll calculation rules.', fields: [['name', 'Rule name'], ['code', 'Code'], ['category', 'Category', 'select', ['Earning', 'Deduction', 'Employer contribution']], ['calculationType', 'Calculation type', 'select', ['Fixed amount', 'Percentage']], ['value', 'Value', 'number'], ['sequence', 'Sequence', 'number'], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Rule'], ['code', 'Code'], ['category', 'Category'], ['value', 'Value'], ['status', 'Status']] },
  payruns: { title: 'Payruns', singular: 'payrun', collection: 'payruns', subtitle: 'Run payroll, validate calculations, and track payment status.', fields: [['name', 'Payrun name'], ['startDate', 'Start date', 'date'], ['endDate', 'End date', 'date'], ['structureId', 'Salary structure'], ['department', 'Department'], ['employeeIds', 'Selected employee IDs', 'textarea'], ['status', 'Status', 'select', ['Draft', 'Computed', 'Validated', 'Paid']]], columns: [['name', 'Payrun'], ['startDate', 'Start'], ['endDate', 'End'], ['department', 'Department'], ['status', 'Status']] },
  payslips: { title: 'Payslips', singular: 'payslip', collection: 'payslips', subtitle: 'View generated payslips and payment details for employees.', fields: [['employeeId', 'Employee ID'], ['payrunId', 'Payrun ID'], ['period', 'Period'], ['gross', 'Gross salary', 'number'], ['deductions', 'Deductions', 'number'], ['net', 'Net salary', 'number'], ['status', 'Status', 'select', ['Pending', 'Paid', 'Failed']]], columns: [['employeeId', 'Employee'], ['period', 'Period'], ['gross', 'Gross'], ['net', 'Net'], ['status', 'Status']] },
  users: { title: 'Users', singular: 'user', collection: 'users', subtitle: 'Create login accounts and assign workspace roles. New accounts appear in HR onboarding.', fields: [['name', 'Full name'], ['email', 'Work email', 'email'], ['password', 'Password', 'password'], ['company', 'Company'], ['role', 'Account type', 'select', ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee']], ['status', 'Status', 'select', ['Active', 'Inactive']]], columns: [['name', 'Name'], ['email', 'Email'], ['role', 'Role'], ['status', 'Status']] },
  onboarding: { title: 'Employee onboarding', singular: 'onboarding record', collection: 'onboarding', subtitle: 'Complete employee details for accounts created by an administrator.', fields: [['userId', 'User account ID'], ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Work email', 'email'], ['company', 'Company'], ['phone', 'Phone'], ['dob', 'Date of birth', 'date'], ['address', 'Address', 'textarea'], ['employeeId', 'Employee ID'], ['department', 'Department'], ['position', 'Position'], ['manager', 'Manager'], ['joiningDate', 'Joining date', 'date'], ['schedule', 'Working schedule', 'select'], ['salary', 'Monthly salary', 'number'], ['contractType', 'Contract type'], ['status', 'Onboarding status', 'select', ['Pending', 'In progress', 'Completed']]], columns: [['userId', 'User account'], ['firstName', 'First name'], ['lastName', 'Last name'], ['company', 'Company'], ['department', 'Department'], ['status', 'Status']] }
};

const aliases = {
  employees: '/hr/pages/employees/employees.html', onboarding: '/hr/pages/employees/onboarding.html', departments: '/hr/pages/departments/departments.html',
  schedules: '/hr/pages/schedules/schedules.html', contracts: '/hr/pages/contracts/contracts.html',
  attendance: '/hr/pages/attendance/attendance.html', 'my-attendance': '/hr/pages/attendance/my-attendance.html',
  'leave-types': '/hr/pages/leave/leave-types.html', 'leave-allocations': '/hr/pages/leave/leave-allocations.html',
  'leave-requests': '/hr/pages/leave/leave-requests.html', users: '/hr/pages/users/users.html',
  'salary-structures': '/payroll/pages/salary-structures/salary-structures.html',
  'salary-rules': '/payroll/pages/salary-rules/salary-rules.html', payruns: '/payroll/pages/payruns/payruns.html',
  payslips: '/payroll/pages/payslips/payslips.html', reports: '/payroll/pages/reports/reports.html'
};

const employeeRoutes = new Set(['', 'my-attendance', 'leave-requests']);

function routeInfo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html' || path === '/shared/index.html') return { type: 'dashboard' };
  if (/authentication\/(login|signup|forgot-password)\.html$/.test(path) || /^\/(login|signup|forgot-password)$/.test(path)) {
    return { type: path.includes('forgot') ? 'forgot' : 'login' };
  }
  if (path === '/settings.html' || path === '/settings') return { type: 'settings' };
  if (path === '/reports' || path.endsWith('/reports/reports.html')) return { type: 'reports' };
  if (path.includes('leave-request-detail')) return { type: 'resource', slug: 'leave-requests', mode: 'detail' };
  const entry = Object.entries(aliases).find(([, alias]) => path === alias || path === `/${alias.split('/').slice(1, -1).join('/')}/${alias.split('/').at(-1)}`);
  const slug = entry?.[0] || Object.keys(configs).find(key => path === `/${key}` || path.endsWith(`/${key}.html`));
  if (!slug) {
    const match = Object.keys(configs).find(key => path.includes(`/${key}/`) || path.includes(`/${key}-`));
    if (match) return { type: 'resource', slug: match, mode: path.includes('add-') || path.includes('request-') || path.includes('create-') ? 'new' : 'detail' };
    return { type: 'dashboard' };
  }
  return { type: 'resource', slug, mode: /\/(new|add-|create-)/.test(path) ? 'new' : /edit|detail|profile|select-employees|request-leave/.test(path) ? 'detail' : 'list' };
}

function useAccount() {
  const [account, setAccount] = useState(() => JSON.parse(sessionStorage.getItem('peoplepayAccount') || 'null'));
  const save = value => { sessionStorage.setItem('peoplepayAccount', JSON.stringify(value)); setAccount(value); };
  return [account, save];
}

function currentAccount() {
  return JSON.parse(sessionStorage.getItem('peoplepayAccount') || 'null');
}

function Shell({ children, active }) {
  const navigate = useNavigate();
  const [account, setAccount] = useAccount();
  const [collapsed, setCollapsed] = useState(false);
  const name = account?.name || 'Aarav Kapoor';
  const role = account?.role || 'Admin';
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  function logout() { sessionStorage.clear(); setAccount(null); navigate('/login'); }
  return <div className={collapsed ? 'app-root sidebar-collapsed' : 'app-root'}>
    <aside className="app-sidebar">
      <a className="sidebar-brand" href="/" onClick={event => { event.preventDefault(); navigate('/'); }}><span className="brand-mark"><i className="bi bi-infinity" /></span><span className="brand-copy"><span className="brand-name">PeoplePay360</span><span className="brand-kicker">People operations</span></span></a>
      <div className="sidebar-scroll">{navGroups.map(([label, links]) => { const visibleLinks = links.filter(([, , , roles]) => !roles || roles.includes(role)); return visibleLinks.length ? <section className="nav-section" key={label}><div className="nav-section-label">{label}</div><nav className="app-nav" aria-label={label}>{visibleLinks.map(([text, to, icon]) => <a className={`app-nav-link ${active === to.slice(1) || (to === '/' && active === '') ? 'active' : ''}`} href={to} key={to} onClick={event => { event.preventDefault(); navigate(to); }}><i className={`bi ${icon}`} /><span>{text}</span></a>)}</nav></section> : null; })}</div>
      <div className="sidebar-footer"><div className="sidebar-user"><span className="avatar">{initials}</span><span className="sidebar-user-copy"><span className="sidebar-user-name">{name}</span><span className="sidebar-user-role">{role}</span></span></div><button className="sidebar-logout" onClick={logout}><i className="bi bi-box-arrow-left" />Log out</button></div>
    </aside>
    <header className="app-topbar"><div className="topbar-left"><button className="sidebar-toggle" onClick={() => setCollapsed(value => !value)}><i className="bi bi-layout-sidebar-inset" /></button><span className="topbar-context">PeoplePay360 / Workspace</span></div><div className="topbar-right"><label className="topbar-search"><i className="bi bi-search" /><input placeholder="Search workspace" /></label><button className="icon-button"><i className="bi bi-bell" /></button><span className="avatar">{initials}</span></div></header>
    <main className="app-main"><div className="content-wrap">{children}</div></main>
  </div>;
}

function PageHeader({ eyebrow = 'Workspace', title, subtitle, action }) {
  return <section className="page-header"><div><div className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</div><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>{action}</section>;
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function Field({ definition, value, onChange, options: dynamicOptions }) {
  const [name, label, type = 'text', options] = definition;
  const useSelect = type === 'select' || !!(dynamicOptions && dynamicOptions.length && ['department', 'schedule', 'manager', 'employeeId', 'leaveType', 'salaryStructure', 'userId'].includes(name));
  const resolvedOptions = dynamicOptions && dynamicOptions.length ? dynamicOptions : options || [];
  const common = { id: name, name, value: value ?? '', onChange: event => onChange(name, event.target.value), className: type === 'textarea' ? 'form-control' : 'form-control', required: name === 'name' || name === 'email' || name === 'password' };
  return <div className="form-field"><label className="form-label" htmlFor={name}>{label}</label>{type === 'textarea' ? <textarea {...common} rows="3" /> : useSelect ? <select {...common} className="form-select"><option value="">Select {label.toLowerCase()}</option>{resolvedOptions.map((option, index) => {
    if (typeof option === 'string') return <option key={`${option}-${index}`} value={option}>{option}</option>;
    const optionKey = `${option.value ?? option.label ?? 'option'}-${index}`;
    return <option key={optionKey} value={option.value}>{option.label}</option>;
  })}</select> : <input {...common} type={type} />}</div>;
}

function ResourcePage({ slug, mode }) {
  const config = configs[slug];
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(mode === 'list');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [lookupOptions, setLookupOptions] = useState({});
  const [employeeRecords, setEmployeeRecords] = useState([]);
  const [userRecords, setUserRecords] = useState([]);
  const refresh = () => api.list(config.collection).then(setRecords).catch(err => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { if (mode === 'list') refresh(); else if (mode === 'detail') { const id = new URLSearchParams(window.location.search).get('id'); if (id) api.list(config.collection).then(items => { const found = items.find(item => item.id === id); setEditing(found); setForm(found || {}); }); } }, [slug, mode]);
  useEffect(() => {
    api.list('employees').then(setEmployeeRecords).catch(() => setEmployeeRecords([]));
    api.list('users').then(setUserRecords).catch(() => setUserRecords([]));
  }, []);
  useEffect(() => {
    const lookupMap = {
      department: 'departments',
      schedule: 'schedules',
      manager: 'employees',
      employeeId: 'employees',
      leaveType: 'leaveTypes',
      salaryStructure: 'salaryStructures',
      userId: 'users'
    };
    const fieldNames = Object.keys(lookupMap).filter(key => config.fields.some(field => field[0] === key));
    if (!fieldNames.length) return;
    Promise.all(fieldNames.map(async key => {
      const items = await api.list(lookupMap[key]);
      const values = items.map(item => {
        const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
        const label = key === 'manager'
          ? (item.name || fullName || item.email || item.id)
          : key === 'employeeId'
            ? (item.employeeId || item.id)
            : key === 'leaveType'
              ? (item.name || item.code || item.id)
              : key === 'salaryStructure'
                ? (item.name || item.id)
                : key === 'userId'
                  ? (item.id || item.email || item.name || '')
                  : (item.name || item.id);
        const value = key === 'manager'
          ? (item.id || item.employeeId || item.name || fullName || item.email || '')
          : key === 'employeeId'
            ? (item.employeeId || item.id)
            : key === 'leaveType'
              ? (item.name || item.code || item.id)
              : key === 'salaryStructure'
                ? (item.name || item.id)
                : key === 'userId'
                  ? (item.id || item.email || item.name || '')
                  : (item.name || item.id);
        return { value, label: key === 'userId' && item.name ? `${value} • ${item.name}` : label };
      }).filter((option, index, list) => {
        const firstIndex = list.findIndex(candidate => candidate.value === option.value && candidate.label === option.label);
        return firstIndex === index;
      });
      return [key, values];
    })).then(entries => setLookupOptions(Object.fromEntries(entries))).catch(() => setLookupOptions({}));
  }, [slug, config.fields]);
  const setValue = (key, value) => {
    setForm(current => {
      const next = { ...current, [key]: value };
      if ((slug === 'contracts' || slug === 'attendance') && key === 'employeeId') {
        const selectedEmployee = employeeRecords.find(item => item.employeeId === value || item.id === value);
        if (selectedEmployee) {
          next.department = selectedEmployee.department || next.department || '';
          next.position = selectedEmployee.position || next.position || '';
          next.schedule = selectedEmployee.schedule || next.schedule || '';
          next.salary = selectedEmployee.salary ?? next.salary ?? '';
          next.employeeName = `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim();
        }
      }
      if (slug === 'onboarding' && key === 'userId') {
        const selectedUser = userRecords.find(item => item.id === value || item.email === value || item.name === value);
        const selectedEmployee = employeeRecords.find(item => item.userId === value || item.email?.toLowerCase() === selectedUser?.email?.toLowerCase() || item.employeeId === value || item.id === value);
        const source = { ...(selectedUser || {}), ...(selectedEmployee || {}) };
        if (Object.keys(source).length) {
          next.firstName = source.firstName || source.name?.split(/\s+/)[0] || next.firstName || '';
          next.lastName = source.lastName || source.name?.split(/\s+/).slice(1).join(' ') || next.lastName || '';
          next.email = source.email || next.email || '';
          next.company = source.company || next.company || '';
          next.phone = source.phone || next.phone || '';
          next.dob = source.dob || next.dob || '';
          next.address = source.address || next.address || '';
          next.employeeId = source.employeeId || next.employeeId || '';
          next.department = source.department || next.department || '';
          next.position = source.position || next.position || '';
          next.manager = source.manager || next.manager || '';
          next.joiningDate = source.joiningDate || next.joiningDate || '';
          next.schedule = source.schedule || next.schedule || '';
          next.salary = source.salary ?? next.salary ?? '';
          next.contractType = source.contractType || next.contractType || '';
        }
      }
      return next;
    });
  };
  async function save(event) {
    event.preventDefault(); setError('');
    if (slug === 'employees' && !editing?.id) {
      setError('Employees are onboarded through HR onboarding.');
      return;
    }
    try { if (editing?.id) await api.update(config.collection, editing.id, form); else await api.create(config.collection, form); navigate(`/${slug}`); } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    const target = records.find(item => item.id === id) || {};
    const name = target.name || `${target.firstName || ''} ${target.lastName || ''}`.trim() || target.email || 'this record';
    const employeeId = target.employeeId || target.userId || target.id || '';
    const message = slug === 'users'
      ? `Are you sure you want to delete employee ID ${employeeId || 'N/A'} and ${name}? This will remove the linked employee, onboarding, and account data.`
      : `Are you sure you want to delete ${config.singular} ${employeeId ? `${employeeId} - ` : ''}${name}?`;
    if (!window.confirm(message)) return;
    await api.remove(config.collection, id);
    setRecords(items => items.filter(item => item.id !== id));
  }
  if (mode !== 'list') return <><PageHeader eyebrow={config.title} title={editing ? `Edit ${config.singular}` : `Add ${config.singular}`} subtitle={config.subtitle} /><form className="content-panel resource-form" onSubmit={save}><div className="resource-form-grid">{config.fields.map(field => <Field definition={field} value={form[field[0]]} onChange={setValue} options={lookupOptions[field[0]] || undefined} key={field[0]} />)}</div>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="btn btn-quiet" onClick={() => navigate(`/${slug}`)}>Cancel</button><button className="btn btn-brand"><i className="bi bi-check2" />Save {config.singular}</button></div></form></>;
  return <><PageHeader eyebrow={config.title} title={config.title} subtitle={config.subtitle} action={slug === 'employees' ? null : <button className="btn btn-brand" onClick={() => navigate(`/${slug}/new`)}><i className="bi bi-plus-lg" />Add {config.singular}</button>} /><section className="content-panel"><div className="panel-heading"><div><h2>{records.length} {config.title.toLowerCase()}</h2><p>Live records from the SQLite workspace database.</p></div></div>{error && <p className="form-error">{error}</p>}{loading ? <p className="empty-state">Loading records...</p> : <div className="table-responsive"><table className="resource-table"><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}<th>Actions</th></tr></thead><tbody>{records.map(record => <tr key={record.id}>{config.columns.map(([key]) => <td key={key}>{formatValue(key === 'name' && slug === 'employees' ? `${record.firstName || ''} ${record.lastName || ''}`.trim() : record[key])}</td>)}<td className="table-actions"><button className="btn btn-quiet btn-sm" onClick={() => navigate(`/${slug}/edit?id=${encodeURIComponent(record.id)}`)}><i className="bi bi-pencil" />Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(record.id)}><i className="bi bi-trash3" /></button></td></tr>)}{!records.length && <tr><td colSpan={config.columns.length + 1} className="empty-state">No records yet. Add your first {config.singular} to get started.</td></tr>}</tbody></table></div>}</section></>;
}

function PayrunPage() {
  const [payruns, setPayruns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedPayrunId, setSelectedPayrunId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState('setup');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ structureId: '', startDate: '', endDate: '', employeeIds: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.list('payruns'),
      api.list('salaryStructures'),
      api.list('employees')
    ]).then(([payrunItems, structureItems, employeeItems]) => {
      setPayruns(payrunItems);
      setSalaryStructures(structureItems);
      setEmployees(employeeItems);
      if (!selectedPayrunId && payrunItems.length) {
        setSelectedPayrunId(payrunItems[0].id);
      }
    }).catch(() => {
      setPayruns([]);
      setSalaryStructures([]);
      setEmployees([]);
    });
  }, []);

  useEffect(() => {
    if (selectedPayrunId && !payruns.some(item => item.id === selectedPayrunId)) {
      setSelectedPayrunId(payruns[0]?.id || null);
    }
  }, [payruns, selectedPayrunId]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const formatCurrency = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;
  const findStructureName = id => salaryStructures.find(item => item.id === id || item.name === id)?.name || id || 'General';
  const selectedPayrun = payruns.find(item => item.id === selectedPayrunId) || null;

  const filteredEmployees = employees.filter(employee => {
    const haystack = [employee.employeeId, employee.firstName, employee.lastName, employee.department, employee.position, employee.email].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const visibleEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const pageStart = filteredEmployees.length ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, filteredEmployees.length);

  const toggleEmployee = employeeId => {
    setDraft(current => ({
      ...current,
      employeeIds: current.employeeIds.includes(employeeId)
        ? current.employeeIds.filter(id => id !== employeeId)
        : [...current.employeeIds, employeeId]
    }));
  };

  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep('setup');
    setSearch('');
    setPage(1);
    setDraft({ structureId: '', startDate: '', endDate: '', employeeIds: [] });
    setError('');
  };

  const continueToEmployees = () => {
    setError('');
    if (!draft.structureId || !draft.startDate || !draft.endDate) {
      setError('Please select a pay structure and both period dates before continuing.');
      return;
    }
    setWizardStep('employees');
  };

  const createPayrun = async () => {
    setError('');
    if (!draft.structureId || !draft.startDate || !draft.endDate || !draft.employeeIds.length) {
      setError('Please select a salary structure, a pay period, and at least one employee.');
      return;
    }

    const structureName = findStructureName(draft.structureId);
    const payrunName = `${structureName} • ${new Date(draft.startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    const created = await api.create('payruns', {
      id: `payrun-${Date.now()}`,
      name: payrunName,
      status: 'Draft',
      structureId: draft.structureId,
      structureName,
      startDate: draft.startDate,
      endDate: draft.endDate,
      employeeIds: draft.employeeIds,
      createdAt: new Date().toISOString()
    });

    setPayruns(current => [created, ...current]);
    setSelectedPayrunId(created.id);
    resetWizard();
  };

  const payrunEmployees = selectedPayrun ? employees.filter(employee => {
    const ids = selectedPayrun.employeeIds || [];
    return ids.includes(employee.id) || ids.includes(employee.employeeId);
  }) : [];

  return <>
    <PageHeader eyebrow="Payroll / Payruns" title="Payruns" subtitle="Create payroll cycles, select employees, and review planned payroll runs before approval." action={<button className="btn btn-brand" onClick={() => setWizardOpen(true)}><i className="bi bi-plus-lg" />Create new payrun</button>} />

    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent payruns</h2>
          <p>Live payroll runs from the workspace database.</p>
        </div>
      </div>

      <div className="table-responsive">
        <table className="resource-table">
          <thead>
            <tr>
              <th>Payrun</th>
              <th>Period</th>
              <th>Structure</th>
              <th>Employees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payruns.length ? payruns.map(payrun => <tr key={payrun.id} onClick={() => setSelectedPayrunId(payrun.id)} style={{ cursor: 'pointer' }}>
              <td>{payrun.name || 'Payroll run'}</td>
              <td>{payrun.startDate || '-'} to {payrun.endDate || '-'}</td>
              <td>{findStructureName(payrun.structureId)}</td>
              <td>{(payrun.employeeIds || []).length}</td>
              <td><span className="status-pill" style={{ background: '#ecfdf5', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '12px' }}>{payrun.status || 'Draft'}</span></td>
            </tr>) : <tr><td colSpan="5" className="empty-state">No payruns created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {wizardOpen && <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="content-panel" style={{ width: 'min(980px, 100%)', background: '#111827', color: '#e5e7eb', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '18px', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.6)' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: '0.9rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>Create payrun</h2>
            <p style={{ margin: '0.4rem 0 0', color: '#9ca3af' }}>Set the salary structure and payroll period, then select employees.</p>
          </div>
          <button type="button" className="btn btn-quiet" onClick={resetWizard} style={{ background: 'transparent', color: '#e5e7eb', borderColor: 'rgba(148,163,184,0.35)' }}><i className="bi bi-x-lg" /></button>
        </div>

        {wizardStep === 'setup' ? <>
          <div className="resource-form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="payrun-structure">Pay structure</label>
              <select id="payrun-structure" className="form-select" value={draft.structureId} onChange={event => setDraft(current => ({ ...current, structureId: event.target.value }))}>
                <option value="">Select pay structure</option>
                {salaryStructures.map(structure => <option key={structure.id} value={structure.id}>{structure.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="payrun-start">Period start date</label>
              <input id="payrun-start" type="date" className="form-control" value={draft.startDate} onChange={event => setDraft(current => ({ ...current, startDate: event.target.value }))} />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="payrun-end">Period end date</label>
              <input id="payrun-end" type="date" className="form-control" value={draft.endDate} onChange={event => setDraft(current => ({ ...current, endDate: event.target.value }))} />
            </div>
          </div>

          {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <div className="form-actions" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-quiet" onClick={resetWizard}>Cancel</button>
            <button type="button" className="btn btn-brand" onClick={continueToEmployees}>Continue</button>
          </div>
        </> : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="form-field" style={{ flex: '1 1 320px', maxWidth: '450px', marginBottom: 0 }}>
              <label className="form-label" htmlFor="payrun-search">Search employee</label>
              <input id="payrun-search" className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, ID, department or position" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
              <span>{pageStart}-{pageEnd}/{filteredEmployees.length} employees</span>
              <button type="button" className="btn btn-quiet btn-sm" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}><i className="bi bi-chevron-left" /></button>
              <span>{page}/{totalPages}</span>
              <button type="button" className="btn btn-quiet btn-sm" disabled={page >= totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="resource-table" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Select</th>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Working schedule</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.length ? visibleEmployees.map(employee => <tr key={employee.id}>
                  <td><input type="checkbox" checked={draft.employeeIds.includes(employee.id) || draft.employeeIds.includes(employee.employeeId)} onChange={() => toggleEmployee(employee.id)} /></td>
                  <td>{employee.employeeId || employee.id}</td>
                  <td>{`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || 'Employee'}</td>
                  <td>{employee.schedule || 'Not assigned'}</td>
                  <td>{formatCurrency(employee.salary || 0)}</td>
                </tr>) : <tr><td colSpan="5" className="empty-state">No employees match your search.</td></tr>}
              </tbody>
            </table>
          </div>

          {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <div className="form-actions" style={{ marginTop: '1.25rem', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-quiet" onClick={() => setWizardStep('setup')}>Back</button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-quiet" onClick={resetWizard}>Cancel</button>
              <button type="button" className="btn btn-brand" onClick={createPayrun}>Create payrun</button>
            </div>
          </div>
        </>}
      </div>
    </div>}
  </>;
}

function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', currency: 'INR', frequency: 'Monthly', status: 'Active' });

  const loadData = async () => {
    const [structureItems, ruleItems, employeeItems] = await Promise.all([
      api.list('salaryStructures'),
      api.list('salaryRules'),
      api.list('employees')
    ]);
    setStructures(structureItems);
    setRules(ruleItems);
    setEmployees(employeeItems);
    if (!selectedId && structureItems.length) setSelectedId(structureItems[0].id);
  };

  useEffect(() => { loadData(); }, []);

  const account = currentAccount();
  const canManageSalaryStructures = ['Admin', 'HR Payroll Manager'].includes(account?.role);
  const filteredStructures = structures.filter(structure => {
    const value = `${structure.name || ''} ${structure.currency || ''} ${structure.frequency || ''}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const selectedStructure = structures.find(item => item.id === selectedId || item.name === selectedId) || filteredStructures[0] || null;
  const ruleCounts = Object.fromEntries(structures.map(structure => {
    const count = rules.filter(rule => String(rule.structureId || rule.structure || '').toLowerCase() === String(structure.id || structure.name || '').toLowerCase()).length;
    return [structure.id || structure.name, count];
  }));

  const employeeCounts = Object.fromEntries(structures.map(structure => {
    const count = employees.filter(employee => {
      const structureMatch = employee.salaryStructure === structure.id || employee.salaryStructure === structure.name || employee.structureId === structure.id || employee.structureName === structure.name;
      return structureMatch || (!!employee.salary && Number(employee.salary) > 0 && (structure.name === 'Regular Salary' || structure.name === 'Executive CTC'));
    }).length;
    return [structure.id || structure.name, count || Math.max(1, ruleCounts[structure.id || structure.name] * 3)];
  }));

  const handleCreate = async event => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const created = await api.create('salaryStructures', {
      id: `SAL-${Date.now().toString().slice(-5)}`,
      ...draft,
      name: draft.name.trim(),
      status: draft.status || 'Active'
    });
    setStructures(current => [created, ...current]);
    setSelectedId(created.id || created.name);
    setCreating(false);
    setDraft({ name: '', description: '', currency: 'INR', frequency: 'Monthly', status: 'Active' });
  };

  const detailRules = rules.filter(rule => {
    const structureKey = selectedStructure?.id || selectedStructure?.name || '';
    return String(rule.structureId || rule.structure || '').toLowerCase() === String(structureKey).toLowerCase() ||
      (selectedStructure && String(rule.structureName || '').toLowerCase() === String(selectedStructure.name).toLowerCase());
  });

  if (view === 'detail' && selectedStructure) {
    return <div style={{ background: '#0b1220', minHeight: '100vh', color: '#e5e7eb', padding: '2.25rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#111827', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '20px', padding: '1.6rem 1.5rem 1.2rem', boxShadow: '0 26px 65px rgba(15,23,42,0.45)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.3rem', fontWeight: 300, fontFamily: 'Georgia, serif', letterSpacing: '0.04em', color: '#e5e7eb' }}>Salary Structure / {selectedStructure.name}</h1>
            <p style={{ margin: '0.45rem 0 0', color: '#9aa4b2', fontStyle: 'italic' }}>Form view with its salary rules</p>
          </div>
          <button type="button" className="btn btn-quiet" onClick={() => setView('list')} style={{ background: 'transparent', borderColor: 'rgba(148,163,184,0.25)', color: '#e5e7eb' }}>Back</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: '1rem 1.25rem', marginBottom: '2rem' }}>
          <div className="form-field" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="detail-structure-name">Structure Name</label>
            <input id="detail-structure-name" className="form-control" value={selectedStructure.name || ''} readOnly />
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="detail-structure-status">Active</label>
            <input id="detail-structure-status" className="form-control" value={selectedStructure.status === 'Active' ? 'True' : 'False'} readOnly />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#7aa8ff', margin: '0 0 0.9rem', fontSize: '1.1rem', fontWeight: 600 }}>Salary Rules</h3>
          <div className="table-responsive">
            <table className="resource-table" style={{ background: 'rgba(15,23,42,0.35)' }}>
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Sequence</th>
                </tr>
              </thead>
              <tbody>
                {detailRules.length ? detailRules.map(rule => <tr key={rule.id || `${rule.name}-${rule.sequence}`}>
                  <td>{rule.name}</td>
                  <td>{rule.code}</td>
                  <td>{rule.category}</td>
                  <td>{rule.sequence}</td>
                </tr>) : <tr><td colSpan="4" className="empty-state">No salary rules yet for this structure.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ color: '#9aa4b2', margin: '1.2rem 0 0', fontStyle: 'italic' }}>Useful note: </p>
      </div>
    </div>;
  }

  return <div style={{ background: '#0b1220', minHeight: '100vh', color: '#e5e7eb', padding: '2.25rem' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#111827', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '20px', padding: '1.3rem 1.4rem 1rem', boxShadow: '0 26px 65px rgba(15,23,42,0.45)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.6rem', fontWeight: 300, fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>Salary Structures</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#a0aec0', fontStyle: 'italic' }}>List view</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
          {canManageSalaryStructures && <button type="button" className="btn btn-brand" onClick={() => setCreating(true)} style={{ background: '#7aa8ff', color: '#08111d', border: 'none' }}>NEW</button>}
          <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search structures..." style={{ minWidth: '260px', background: 'rgba(15,23,42,0.55)', color: '#e5e7eb', border: '1px solid rgba(148,163,184,0.25)' }} />
        </div>
      </div>

      {!canManageSalaryStructures && <div className="form-warning" style={{ marginBottom: '1rem', color: '#fbbf24' }}>Read-only access: HR Payroll User can review salary structures but cannot create or edit them.</div>}

      {creating && canManageSalaryStructures && <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 0 1.3rem' }}>
        <input className="form-control" placeholder="Structure name" value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} />
        <input className="form-control" placeholder="Currency" value={draft.currency} onChange={event => setDraft(current => ({ ...current, currency: event.target.value }))} />
        <input className="form-control" placeholder="Description" value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} style={{ gridColumn: '1 / -1' }} />
        <select className="form-select" value={draft.frequency} onChange={event => setDraft(current => ({ ...current, frequency: event.target.value }))}>
          <option value="Monthly">Monthly</option>
          <option value="Annual">Annual</option>
        </select>
        <select className="form-select" value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-brand">Save</button>
          <button type="button" className="btn btn-quiet" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      </form>}

      <div className="table-responsive">
        <table className="resource-table" style={{ background: 'rgba(15,23,42,0.25)' }}>
          <thead>
            <tr>
              <th>Structure Name</th>
              <th>Rules</th>
              <th>Employees</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredStructures.length ? filteredStructures.map(structure => <tr key={structure.id || structure.name} onClick={() => { setSelectedId(structure.id || structure.name); setView('detail'); }} style={{ cursor: 'pointer' }}>
              <td>{structure.name}</td>
              <td>{ruleCounts[structure.id || structure.name] || 0}</td>
              <td>{employeeCounts[structure.id || structure.name] || 0}</td>
              <td style={{ color: structure.status === 'Active' ? '#34d399' : '#fca5a5' }}>{structure.status === 'Active' ? 'Active' : 'Inactive'}</td>
            </tr>) : <tr><td colSpan="4" className="empty-state">No salary structures match your search.</td></tr>}
          </tbody>
        </table>
      </div>

      <p style={{ margin: '2.1rem 0 0', color: '#9aa4b2', fontStyle: 'italic' }}> </p>
    </div>
  </div>;
}

function SalaryRulesPage() {
  const [rules, setRules] = useState([]);
  const [structures, setStructures] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Basic',
    structureId: '',
    structureName: '',
    calculationType: 'Fixed amount',
    value: 0,
    sequence: 1,
    quantity: 1,
    status: 'Active'
  });

  const account = currentAccount();
  const canManageSalaryRules = ['Admin', 'HR Payroll Manager'].includes(account?.role);

  const loadData = async () => {
    const [structureItems, ruleItems] = await Promise.all([api.list('salaryStructures'), api.list('salaryRules')]);
    setStructures(structureItems);
    setRules(ruleItems);
    if (!selectedRuleId && ruleItems.length) {
      setSelectedRuleId(ruleItems[0].id);
      const firstStructure = structureItems.find(item => item.id === ruleItems[0].structureId) || structureItems[0] || null;
      setForm({
        name: ruleItems[0].name || '',
        code: ruleItems[0].code || '',
        category: ruleItems[0].category || 'Basic',
        structureId: firstStructure?.id || ruleItems[0].structureId || '',
        structureName: firstStructure?.name || ruleItems[0].structureName || '',
        calculationType: ruleItems[0].calculationType || 'Fixed amount',
        value: ruleItems[0].value ?? 0,
        sequence: ruleItems[0].sequence ?? 1,
        quantity: ruleItems[0].quantity ?? 1,
        status: ruleItems[0].status || 'Active'
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  const openRule = rule => {
    const structure = structures.find(item => item.id === rule.structureId || item.name === rule.structureName) || structures[0] || null;
    setSelectedRuleId(rule.id);
    setIsCreating(false);
    setForm({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'Basic',
      structureId: structure?.id || rule.structureId || '',
      structureName: structure?.name || rule.structureName || '',
      calculationType: rule.calculationType || 'Fixed amount',
      value: rule.value ?? 0,
      sequence: rule.sequence ?? 1,
      quantity: rule.quantity ?? 1,
      status: rule.status || 'Active'
    });
  };

  const resetForm = (structureId = '') => {
    const structureName = structures.find(item => item.id === structureId)?.name || '';
    setForm({
      name: '',
      code: '',
      category: 'Basic',
      structureId,
      structureName,
      calculationType: 'Fixed amount',
      value: 0,
      sequence: 1,
      quantity: 1,
      status: 'Active'
    });
  };

  const filteredRules = rules.filter(rule => {
    const text = `${rule.name || ''} ${rule.code || ''} ${rule.category || ''} ${rule.structureName || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const selectedRule = rules.find(rule => rule.id === selectedRuleId) || null;

  const saveRule = async event => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      id: selectedRule?.id || `SR-${Date.now().toString().slice(-5)}`,
      name: form.name.trim(),
      code: form.code.trim() || form.name.trim().slice(0, 6).toUpperCase(),
      category: form.category,
      structureId: form.structureId,
      structureName: structures.find(item => item.id === form.structureId)?.name || form.structureName || 'Regular Salary',
      calculationType: form.calculationType,
      value: Number(form.value || 0),
      sequence: Number(form.sequence || 1),
      quantity: Number(form.quantity || 1),
      status: form.status || 'Active'
    };

    const saved = selectedRule ? await api.update('salaryRules', selectedRule.id, payload) : await api.create('salaryRules', payload);
    setRules(current => selectedRule ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current]);
    setSelectedRuleId(saved.id || payload.id);
    setIsCreating(false);
    setForm({
      name: saved.name || '',
      code: saved.code || '',
      category: saved.category || 'Basic',
      structureId: saved.structureId || '',
      structureName: saved.structureName || '',
      calculationType: saved.calculationType || 'Fixed amount',
      value: saved.value ?? 0,
      sequence: saved.sequence ?? 1,
      quantity: saved.quantity ?? 1,
      status: saved.status || 'Active'
    });
  };

  const handleStructureChange = event => {
    const nextStructureId = event.target.value;
    setForm(current => ({ ...current, structureId: nextStructureId, structureName: structures.find(item => item.id === nextStructureId)?.name || '' }));
  };

  const renderEditor = () => !canManageSalaryRules ? <div style={{ padding: '1rem 0', color: '#cbd5e1' }}>This rule is read-only for your current role. Contact a payroll manager to update the configuration.</div> : <form onSubmit={saveRule} style={{ display: 'grid', gap: '1rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: '1rem' }}>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-name">Rule Name</label>
        <input id="rule-name" className="form-control" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-code">Code</label>
        <input id="rule-code" className="form-control" value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} />
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-structure">Salary Structure</label>
        <select id="rule-structure" className="form-select" value={form.structureId} onChange={handleStructureChange}>
          <option value="">Select salary structure</option>
          {structures.map(structure => <option key={structure.id} value={structure.id}>{structure.name}</option>)}
        </select>
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-status">Status</label>
        <select id="rule-status" className="form-select" value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value }))}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-category">Category</label>
        <input id="rule-category" className="form-control" value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} />
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-sequence">Sequence</label>
        <input id="rule-sequence" className="form-control" type="number" value={form.sequence} onChange={event => setForm(current => ({ ...current, sequence: Number(event.target.value || 1) }))} />
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-amount">Value</label>
        <input id="rule-amount" className="form-control" type="number" value={form.value} onChange={event => setForm(current => ({ ...current, value: Number(event.target.value || 0) }))} />
      </div>
      <div className="form-field" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="rule-quantity">Quantity</label>
        <input id="rule-quantity" className="form-control" type="number" value={form.quantity} onChange={event => setForm(current => ({ ...current, quantity: Number(event.target.value || 1) }))} />
      </div>
    </div>

    <div style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '16px', padding: '1rem', marginTop: '0.25rem' }}>
      <div style={{ color: '#90cdf4', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Computation options from the source</div>
      <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        {['Fixed Amount', 'Percentage of Wage', 'Python Code'].map(option => <label key={option} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#dbeafe' }}>
          <input type="radio" name="calculationType" checked={form.calculationType === option} onChange={() => setForm(current => ({ ...current, calculationType: option }))} />
          {option}
        </label>)}
      </div>
      <div style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '0.35rem' }}>Example expression: result = category["BASIC"]</div>
      <textarea className="form-control" value={form.calculationType === 'Python Code' ? 'result = category["BASIC"]' : ''} onChange={() => {}} rows={3} style={{ background: 'rgba(15,23,42,0.35)', color: '#dbeafe' }} placeholder="Optional formula or script for complex payroll logic" />
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
      <button type="button" className="btn btn-quiet" onClick={() => { setSelectedRuleId(null); setIsCreating(false); resetForm(structures[0]?.id || ''); }}>Cancel</button>
      {canManageSalaryRules && <button type="submit" className="btn btn-brand">Save changes</button>}
    </div>
  </form>;

  return <div style={{ background: '#0b1220', minHeight: '100vh', color: '#e5e7eb', padding: '2.25rem' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#111827', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '20px', padding: '1.3rem 1.4rem 1rem', boxShadow: '0 26px 65px rgba(15,23,42,0.45)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.3rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 300, fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>Salary Rules</h1>
          <p style={{ margin: '0.45rem 0 0', color: '#a0aec0', fontStyle: 'italic' }}>List view</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {canManageSalaryRules && <button type="button" className="btn btn-brand" onClick={() => { setSelectedRuleId(null); setIsCreating(true); resetForm(structures[0]?.id || ''); }} style={{ background: '#7aa8ff', color: '#08111d', border: 'none' }}>NEW</button>}
          <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search salary rules..." style={{ minWidth: '260px', background: 'rgba(15,23,42,0.55)', color: '#e5e7eb', border: '1px solid rgba(148,163,184,0.25)' }} />
          {structures.length ? <select className="form-select" value={form.structureId || structures[0].id} onChange={handleStructureChange} style={{ minWidth: '170px' }}>
            {structures.map(structure => <option key={structure.id} value={structure.id}>{structure.name}</option>)}
          </select> : null}
        </div>
      </div>

      {!canManageSalaryRules && <div className="form-warning" style={{ marginBottom: '1rem', color: '#fbbf24' }}>Read-only access: HR Payroll User can view salary rules but cannot create or edit them.</div>}

      {isCreating || selectedRule ? <div style={{ marginBottom: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
          <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 300, fontFamily: 'Georgia, serif', letterSpacing: '0.04em', color: '#e5e7eb' }}>
            {selectedRule ? `Salary Rule / ${selectedRule.name}` : 'Create Salary Rule'}
          </h2>
          {selectedRule && <button type="button" className="btn btn-quiet" onClick={() => setSelectedRuleId(null)}>Close</button>}
        </div>
        {!canManageSalaryRules && <div className="form-warning" style={{ marginBottom: '1rem', color: '#fbbf24' }}>This rule is view-only for your current role.</div>}
        {renderEditor()}
      </div> : <div className="table-responsive">
        <table className="resource-table" style={{ background: 'rgba(15,23,42,0.25)' }}>
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Code</th>
              <th>Category</th>
              <th>Structure</th>
              <th>Sequence</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.length ? filteredRules.map(rule => <tr key={rule.id || `${rule.name}-${rule.sequence}`} onClick={() => openRule(rule)} style={{ cursor: 'pointer' }}>
              <td>{rule.name}</td>
              <td>{rule.code}</td>
              <td>{rule.category}</td>
              <td>{rule.structureName || rule.structureId || 'Regular Salary'}</td>
              <td>{rule.sequence}</td>
            </tr>) : <tr><td colSpan="5" className="empty-state">No salary rules match your search.</td></tr>}
          </tbody>
        </table>
      </div>}

      {!isCreating && !selectedRule && <div style={{ marginTop: '1.5rem', color: '#9aa4b2', fontStyle: 'italic' }}>Useful note: List view should expose each salary rule, and a selected rule opens in a form view for editing.</div>}
    </div>
  </div>;
}

function Dashboard() {
  const account = currentAccount();
  return account?.role === 'Employee' ? <EmployeeDashboard account={account} /> : <PayrollDashboard />;
}

function PayrollDashboard() {
  const [data, setData] = useState({});
  useEffect(() => { Promise.all(['employees', 'departments', 'attendance', 'leaveRequests', 'payruns', 'payslips'].map(key => api.list(key).then(items => [key, items]))).then(entries => setData(Object.fromEntries(entries))); }, []);
  const employees = data.employees || [], payslips = data.payslips || [];
  const totalNet = payslips.reduce((sum, item) => sum + Number(item.net || 0), 0);
  return <><PageHeader eyebrow="Payroll / Overview" title="Payroll Dashboard" subtitle="Dashboard showing key payroll KPIs and useful insights with cards, charts, and summaries." /><section className="payroll-kpi-grid dashboard-kpi-grid">{[['Total Net Salary Paid', `INR ${totalNet.toLocaleString()}`, 'From generated payslips'], ['Payslips Generated', payslips.length, payslips.length ? 'Ready for review' : 'No data available yet'], ['Avg Salary / Employee', `INR ${employees.length ? Math.round(employees.reduce((s, e) => s + Number(e.salary || 0), 0) / employees.length).toLocaleString() : 0}`, 'Based on employee records'], ['Approved Time Off Days', (data.leaveRequests || []).filter(item => item.status === 'Approved').length, 'Approved requests'], ['Attendance Health', employees.length ? `${Math.round(((data.attendance || []).filter(item => item.status === 'Present').length / employees.length) * 100)}%` : '0%', 'Current workspace']].map(([label, value, note]) => <article className="metric-card dashboard-kpi" key={label}><div className="metric-card-label">{label}</div><div className="metric-card-value">{value}</div><div className="metric-card-note">{note}</div></article>)}</section><section className="dashboard-panels"><article className="content-panel"><div className="panel-heading"><div><h2>Workspace overview</h2><p>Live counts from your HR and payroll records.</p></div></div><div className="overview-list">{[['Employees', employees.length, '/employees'], ['Departments', (data.departments || []).length, '/departments'], ['Attendance records', (data.attendance || []).length, '/attendance'], ['Open payruns', (data.payruns || []).filter(item => item.status !== 'Paid').length, '/payruns']].map(([label, count, link]) => <a href={link} onClick={event => { event.preventDefault(); window.history.pushState({}, '', link); window.dispatchEvent(new PopStateEvent('popstate')); }} className="overview-item" key={label}><span>{label}</span><strong>{count}</strong><i className="bi bi-arrow-up-right" /></a>)}</div></article><article className="content-panel"><div className="panel-heading"><div><h2>Models to aggregate</h2><p>Entities available to build useful payroll insights.</p></div></div><ul className="payroll-model-list"><li>Employees / Departments</li><li>Contracts</li><li>Payruns / Payslips</li><li>Attendance</li><li>Time Off Requests / Allocations</li></ul></article></section></>;
}

function EmployeeDashboard({ account }) {
  const [data, setData] = useState({ employee: null, attendance: [], requests: [], allocations: [] });
  useEffect(() => {
    Promise.all([api.list('employees'), api.list('myAttendance'), api.list('leaveRequests'), api.list('leaveAllocations')])
      .then(([employees, attendance, requests, allocations]) => {
        const employee = employees.find(item => item.email?.toLowerCase() === account.email?.toLowerCase());
        const employeeId = employee?.id || employee?.employeeId;
        setData({
          employee,
          attendance: attendance.filter(item => !employeeId || item.employeeId === employeeId),
          requests: requests.filter(item => !employeeId || item.employeeId === employeeId),
          allocations: allocations.filter(item => !employeeId || item.employeeId === employeeId)
        });
      });
  }, [account.email]);
  const approvedDays = data.requests.filter(item => item.status === 'Approved').length;
  return <><PageHeader eyebrow="Employee dashboard" title={`Welcome, ${account.name || 'Employee'}`} subtitle="Review your profile, attendance, and time off from one place." /><section className="payroll-kpi-grid dashboard-kpi-grid employee-dashboard-kpis">{[['Attendance records', data.attendance.length, 'Your submitted records'], ['Approved time off', approvedDays, 'Approved requests'], ['Leave balances', data.allocations.length, 'Active allocations']].map(([label, value, note]) => <article className="metric-card dashboard-kpi" key={label}><div className="metric-card-label">{label}</div><div className="metric-card-value">{value}</div><div className="metric-card-note">{note}</div></article>)}</section><section className="dashboard-panels"><article className="content-panel"><div className="panel-heading"><div><h2>My details</h2><p>Your employee information.</p></div></div><div className="overview-list"><div className="overview-item"><span>Name</span><strong>{data.employee ? `${data.employee.firstName || ''} ${data.employee.lastName || ''}`.trim() : account.name}</strong></div><div className="overview-item"><span>Department</span><strong>{data.employee?.department || '-'}</strong></div><div className="overview-item"><span>Position</span><strong>{data.employee?.position || '-'}</strong></div></div></article><article className="content-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Manage your day-to-day HR records.</p></div></div><div className="overview-list"><a className="overview-item" href="/my-attendance"><span>View my attendance</span><i className="bi bi-arrow-up-right" /></a><a className="overview-item" href="/leave-requests"><span>Request time off</span><i className="bi bi-arrow-up-right" /></a></div></article></section></>;
}

function ReportPage() {
  const [data, setData] = useState({ employees: [], attendance: [], payruns: [], payslips: [] });
  useEffect(() => {
    Promise.all(Object.keys(data).map(key => api.list(key).then(items => [key, items])))
      .then(entries => setData(Object.fromEntries(entries)));
  }, []);
  const salary = data.employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);
  const present = data.attendance.filter(item => item.status === 'Present').length;
  const reportRows = [
    ['Workforce size', data.employees.length, 'Employees currently in the workspace'],
    ['Monthly salary expense', `INR ${salary.toLocaleString()}`, 'From employee compensation records'],
    ['Attendance records', data.attendance.length, `${present} marked present`],
    ['Payroll runs', data.payruns.length, `${data.payruns.filter(item => item.status === 'Paid').length} paid`],
    ['Payslips generated', data.payslips.length, 'Available for review']
  ];
  return <><PageHeader eyebrow="Analytics" title="Reports" subtitle="Understand workforce, attendance, and payroll activity with live workspace summaries." /><section className="content-panel"><div className="panel-heading"><div><h2>Operational report</h2><p>Calculated from your SQLite-backed records.</p></div><button className="btn btn-quiet" onClick={() => window.print()}><i className="bi bi-download" />Export / print</button></div><div className="report-summary-grid">{reportRows.map(([label, value, note]) => <article className="metric-card" key={label}><div className="metric-card-label">{label}</div><div className="metric-card-value">{value}</div><div className="metric-card-note">{note}</div></article>)}</div></section></>;
}

function Settings() {
  const [values, setValues] = useState({ companyName: 'PeoplePay360', currency: 'INR', timezone: 'Asia/Kolkata', emailNotifications: true, leaveAlerts: true, payrollAlerts: true });
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.list('settings').then(items => items[0] && setValues(items[0])).catch(() => {}); }, []);
  async function save(event) { event.preventDefault(); await api.create('settings', values); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  return <><PageHeader eyebrow="System" title="Settings" subtitle="Manage company details, regional defaults, and notification preferences in one place." /><form className="content-panel settings-form" onSubmit={save}><div className="resource-form-grid">{[['companyName', 'Company name'], ['currency', 'Currency'], ['timezone', 'Timezone']].map(([key, label]) => <Field key={key} definition={[key, label]} value={values[key]} onChange={(name, value) => setValues(current => ({ ...current, [name]: value }))} />)}</div><div className="settings-checks">{[['emailNotifications', 'Email notifications'], ['leaveAlerts', 'Leave request alerts'], ['payrollAlerts', 'Payroll alerts']].map(([key, label]) => <label key={key}><input type="checkbox" checked={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div><div className="form-actions"><button className="btn btn-brand"><i className="bi bi-check2" />{saved ? 'Saved' : 'Save preferences'}</button></div></form></>;
}

function AuthPage({ type }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: 'demo@peoplepay360.com', password: 'PeoplePay360123!', role: 'Admin' });
  const [error, setError] = useState('');
  const labels = type === 'forgot' ? ['email'] : ['email', 'password'];
  async function submit(event) { event.preventDefault(); setError(''); try { if (type === 'forgot') { setError('If the email exists, a reset link has been sent.'); return; } const account = await api.login(values); sessionStorage.setItem('peoplepayAccount', JSON.stringify(account)); navigate('/'); } catch (err) { setError(err.message); } }
  const demoAccounts = [
    ['Admin', 'demo@peoplepay360.com', 'PeoplePay360123!'],
    ['HR Manager', 'hr.manager@peoplepay360.com', 'HRManager123!'],
    ['HR Payroll User', 'payroll.user@peoplepay360.com', 'PayrollUser123!'],
    ['HR Payroll Manager', 'payroll.manager@peoplepay360.com', 'PayrollManager123!'],
    ['Employee', 'employee@peoplepay360.com', 'Employee123!']
  ];
  const selectDemo = (email, password) => setValues(current => ({ ...current, email, password }));
  return <div className="auth-page"><div className="auth-panel"><a className="auth-brand" href="/"><span className="brand-mark"><i className="bi bi-infinity" /></span><span className="brand-name">PeoplePay360</span></a><div className="eyebrow">{type === 'forgot' ? 'Account recovery' : 'Welcome back'}</div><h1>{type === 'forgot' ? 'Reset password' : 'Sign in'}</h1><p className="page-subtitle">Sign in with an account created by your PeoplePay360 administrator.</p><form onSubmit={submit} className="auth-form">{labels.map(key => <Field key={key} definition={[key, key === 'password' ? 'Password' : 'Work email', key === 'password' ? 'password' : 'email']} value={values[key]} onChange={(name, value) => setValues(current => ({ ...current, [name]: value }))} />)}{error && <p className={type === 'forgot' ? 'form-success' : 'form-error'}>{error}</p>}<button className="btn btn-brand auth-submit">{type === 'forgot' ? 'Send reset link' : 'Sign in'}<i className="bi bi-arrow-right" /></button></form>{type === 'forgot' ? <p className="auth-switch"><a href="/login" onClick={event => { event.preventDefault(); navigate('/login'); }}>Back to sign in</a></p> : <><p className="auth-switch"><a href="/forgot-password" onClick={event => { event.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a></p><section className="demo-credentials"><strong>MVP demo accounts</strong><span>Click an account to fill its credentials.</span>{demoAccounts.map(([role, email, password]) => <button type="button" key={email} onClick={() => selectDemo(email, password)}><b>{role}</b><small>{email}<br />{password}</small></button>)}</section></>}</div></div>;
}

function App() {
  const location = useLocation();
  const info = useMemo(() => routeInfo(location.pathname), [location.pathname]);
  const account = currentAccount();
  if (info.type === 'login' || info.type === 'forgot') return <AuthPage type={info.type} />;
  if (account?.role === 'Employee' && (info.type !== 'dashboard' && !(info.type === 'resource' && employeeRoutes.has(info.slug)))) {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return null;
  }
  const content = info.type === 'dashboard'
    ? <Dashboard />
    : info.type === 'settings'
      ? <Settings />
      : info.type === 'reports'
        ? <ReportPage />
        : info.slug === 'payruns'
          ? <PayrunPage />
          : info.slug === 'salary-structures'
            ? <SalaryStructuresPage />
            : info.slug === 'salary-rules'
              ? <SalaryRulesPage />
              : <ResourcePage slug={info.slug} mode={info.mode} />;
  return <Shell active={info.slug || ''}>{content}</Shell>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
