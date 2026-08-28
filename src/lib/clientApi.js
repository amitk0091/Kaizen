'use client';
// Thin client fetch wrapper. Throws { code, message } on error.
// On 402 (trial expired) code is 'trial_expired'; UI redirects to /dashboard/subscribe.
async function handle(res) {
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Request failed');
    err.code = data.error || String(res.status);
    err.status = res.status;
    throw err;
  }
  return data;
}
export const apiGet = (url) => fetch(url).then(handle);
export const apiSend = (url, method, body) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(handle);
export function today() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
