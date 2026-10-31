const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
export const getToken = () => localStorage.getItem('ss_token');

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => { throw new Error('Cannot reach the server. Make sure the backend is running.'); });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (res.status === 401 && getToken()) { localStorage.removeItem('ss_token'); window.location.href = '/login'; }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}
