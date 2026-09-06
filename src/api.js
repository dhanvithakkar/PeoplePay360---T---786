const base = import.meta.env.VITE_API_URL || '/api';

function currentAccount() {
  try {
    return JSON.parse(sessionStorage.getItem('peoplepayAccount') || 'null');
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const account = currentAccount();
  const response = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(account ? { 'X-User-Role': account.role || 'Employee', 'X-User-Email': account.email || '' } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  list: collection => request(`/${collection}`).then(result => result.data || []),
  create: (collection, record) => request(`/${collection}`, { method: 'POST', body: JSON.stringify(record) }).then(result => result.data),
  update: (collection, id, record) => request(`/${collection}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(record) }).then(result => result.data),
  remove: (collection, id) => request(`/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  computePayrun: id => request(`/payruns/${encodeURIComponent(id)}/compute`, { method: 'POST' }).then(result => result.data),
  login: values => request('/auth/login', { method: 'POST', body: JSON.stringify(values) }).then(result => result.data)
};
