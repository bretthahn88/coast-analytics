/**
 * Tiny fetch wrapper. Same-origin in production (Vercel), proxied to localhost
 * in dev via Vite (vite.config.js).
 */
async function request(path, opts = {}) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try { const body = await r.json(); if (body?.error) msg = body.error; } catch { /* noop */ }
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  health:        () => request('/api/health'),
  summary:       () => request('/api/summary'),
  stores:        () => request('/api/stores'),
  customers:     (params) => request(`/api/customers${qs(params)}`),
  experiments:   () => request('/api/experiments'),
  holdouts:      () => request('/api/holdouts'),
  model:         (id) => request(`/api/models/${id}`),
  nba:           () => request('/api/nba'),
  postLead:      (body) => request('/api/leads', { method: 'POST', body: JSON.stringify(body) }),
  postContact:   (body) => request('/api/contact', { method: 'POST', body: JSON.stringify(body) }),
  adminLeads:    (password) => request('/api/admin/leads', { headers: { 'x-admin-password': password } }),
};

function qs(params = {}) {
  const entries = Object.entries(params || {}).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
