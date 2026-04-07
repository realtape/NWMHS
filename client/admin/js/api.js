/* ── API client — all fetch calls go through here ────────── */
// Update PROD_API_URL when you move to your final backend host
const PROD_API_URL = '';  // e.g. 'https://api.nwmhs.com/api'
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : (PROD_API_URL || '/api');

async function request(method, path, body) {
  const token = localStorage.getItem('crm_token');
  const res   = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  if (res.status === 401) { logout(); return; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  auth: {
    login:    (b) => request('POST', '/auth/login', b),
    register: (b) => request('POST', '/auth/register', b)
  },
  dashboard: { get: () => request('GET', '/dashboard') },
  contacts: {
    list:   (q = '') => request('GET', `/contacts${q ? '?search=' + encodeURIComponent(q) : ''}`),
    get:    (id) => request('GET', `/contacts/${id}`),
    create: (b)  => request('POST', '/contacts', b),
    update: (id, b) => request('PATCH', `/contacts/${id}`, b),
    remove: (id) => request('DELETE', `/contacts/${id}`)
  },
  deals: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/deals${qs ? '?' + qs : ''}`);
    },
    create: (b)     => request('POST', '/deals', b),
    update: (id, b) => request('PATCH', `/deals/${id}`, b),
    remove: (id)    => request('DELETE', `/deals/${id}`)
  },
  tasks: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/tasks${qs ? '?' + qs : ''}`);
    },
    create: (b)     => request('POST', '/tasks', b),
    update: (id, b) => request('PATCH', `/tasks/${id}`, b),
    remove: (id)    => request('DELETE', `/tasks/${id}`)
  }
};

/* ── Auth helpers ────────────────────────────────────────── */
function saveSession(token, user) {
  localStorage.setItem('crm_token', token);
  localStorage.setItem('crm_user',  JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('crm_user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_user');
  window.location.href = 'login.html';
}

function requireAuth() {
  if (!localStorage.getItem('crm_token')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* ── Toast notifications ─────────────────────────────────── */
function toast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function initSidebar(activePage) {
  const user = getUser();
  if (!user) return;
  document.querySelector('.sidebar__user-name').textContent  = user.fullName || user.full_name || 'User';
  document.querySelector('.sidebar__user-role').textContent  = user.role || 'member';
  document.querySelector('.sidebar__avatar').textContent     = (user.fullName || user.full_name || 'U')[0].toUpperCase();
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.dataset.page === activePage) el.classList.add('active');
  });
  document.querySelector('.btn-logout').addEventListener('click', logout);
}
