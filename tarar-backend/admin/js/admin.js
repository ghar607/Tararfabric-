const API = '/api';

function getToken() {
  return localStorage.getItem('tarar_admin_token');
}
function requireLogin() {
  if (!getToken()) window.location.href = '/admin/login.html';
}
function logout() {
  fetch(API + '/admin/logout', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() }
  }).finally(() => {
    localStorage.removeItem('tarar_admin_token');
    window.location.href = '/admin/login.html';
  });
}

async function apiGet(path) {
  const res = await fetch(API + path, {
    headers: { Authorization: 'Bearer ' + getToken() }
  });
  if (res.status === 401) { localStorage.removeItem('tarar_admin_token'); window.location.href = '/admin/login.html'; return; }
  return res.json();
}
async function apiJSON(path, method, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
    body: JSON.stringify(body)
  });
  if (res.status === 401) { localStorage.removeItem('tarar_admin_token'); window.location.href = '/admin/login.html'; return; }
  return res.json();
}
async function apiForm(path, method, formData) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: 'Bearer ' + getToken() },
    body: formData
  });
  if (res.status === 401) { localStorage.removeItem('tarar_admin_token'); window.location.href = '/admin/login.html'; return; }
  return res.json();
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function fmtMoney(n) {
  return 'Rs. ' + (Number(n) || 0).toLocaleString();
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
