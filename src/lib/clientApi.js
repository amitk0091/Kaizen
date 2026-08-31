'use client';

const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function handle(res) {
  let data = {};
  try { data = await res.json(); } catch (e) {
    console.warn('Failed to parse response JSON:', e);
  }
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.code = data.error || (res.status === 402 ? 'trial_expired' : String(res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

function withTimeout(promise, ms = API_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms))
  ]);
}

async function withRetry(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      if (!isRetryable(e)) throw e;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}

function isRetryable(error) {
  return error.message === 'Request timeout' ||
         (error.status >= 500) ||
         (error.status === 429);
}

export const apiGet = (url) =>
  withRetry(() => withTimeout(fetch(url)).then(handle));

export const apiSend = (url, method, body) =>
  withRetry(() =>
    withTimeout(
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      })
    ).then(handle)
  );

export function today() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
