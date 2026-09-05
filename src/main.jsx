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
  ['HR Management', [['Employees', '/employees', 'bi-people', ['HR Manager', 'HR Payroll Manager', 'Admin']], ['Onboarding', '/onboarding', 'bi-person-plus', ['HR Manager', 'HR Payroll Manager', 'Admin']], ['Departments', '/departments', 'bi-diagram-3', ['HR Manager', 'HR Payroll Manager', 'Admin']], ['Working Schedules', '/schedules', 'bi-calendar3', ['HR Manager', 'HR Payroll Manager', 'Admin']], ['Contracts', '/contracts', 'bi-file-earmark-text', ['HR Manager', 'HR Payroll Manager', 'Admin']]]],
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
  const content = info.type === 'dashboard' ? <Dashboard /> : info.type === 'settings' ? <Settings /> : info.type === 'reports' ? <ReportPage /> : <ResourcePage slug={info.slug} mode={info.mode} />;
  return <Shell active={info.slug || ''}>{content}</Shell>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
