'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const browserTimeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'Asia/Kolkata'; } };
const supportsPush = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { apiGet('/api/settings').then(setS).catch((e) => setMsg(e.message)); }, []);

  async function enable() {
    setBusy(true); setMsg('');
    try {
      if (!supportsPush()) throw new Error('This browser does not support push notifications. On iPhone, add Kaizen to your Home Screen first.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings, then try again.');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) });
      await apiSend('/api/push', 'POST', { subscription: sub.toJSON() });
      const reminders = { ...s.reminders, enabled: true, timeZone: browserTimeZone() };
      await apiSend('/api/settings', 'PUT', { reminders });
      setS({ ...s, reminders, devices: Math.max(1, s.devices) });
      setMsg('Reminders are on for this device.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMsg('');
    try {
      const reg = supportsPush() ? await navigator.serviceWorker.getRegistration() : null;
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await apiSend('/api/push', 'DELETE', { endpoint: sub.endpoint }); await sub.unsubscribe(); }
      const reminders = { ...s.reminders, enabled: false };
      await apiSend('/api/settings', 'PUT', { reminders });
      setS({ ...s, reminders });
      setMsg('Reminders are off.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function saveTimes() {
    setBusy(true); setMsg('');
    try { await apiSend('/api/settings', 'PUT', { reminders: { ...s.reminders, timeZone: browserTimeZone() } }); setMsg('Saved.'); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setMsg('');
    try { await apiSend('/api/push/test', 'POST'); setMsg('Test sent — check your notifications.'); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  const r = s?.reminders;
  const setTime = (k, v) => setS({ ...s, reminders: { ...r, [k]: v } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <p className="text-ink-600 text-sm mt-1">A well-timed prompt is one of the three things every habit needs (B = MAP).</p>

      {!s && !msg && <p className="text-sm text-ink-600 mt-4">Loading…</p>}
      {s && (
        <div className="card p-5 mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Daily reminders</h2>
              <p className="text-xs text-ink-500">Morning: pick your One Thing. Evening: 2-minute shutdown. Skipped if you've already done it.</p>
            </div>
            {r.enabled
              ? <button className="btn-ghost shrink-0" disabled={busy} onClick={disable}>Turn off</button>
              : <button className="btn-primary shrink-0" disabled={busy || !s.pushAvailable} onClick={enable}>Turn on</button>}
          </div>
          {!s.pushAvailable && <p className="text-xs text-amber-700">Push isn't configured on the server yet (VAPID keys missing).</p>}

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">☀️ Morning</label><input type="time" className="input" value={r.morning} onChange={(e) => setTime('morning', e.target.value)} /></div>
            <div><label className="label">🌙 Evening</label><input type="time" className="input" value={r.evening} onChange={(e) => setTime('evening', e.target.value)} /></div>
          </div>
          <p className="text-xs text-ink-500">Clear a time to skip that reminder. Timezone: {browserTimeZone()}.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={busy} onClick={saveTimes}>Save times</button>
            {r.enabled && s.devices > 0 && <button className="btn-ghost" disabled={busy} onClick={test}>Send a test</button>}
          </div>
        </div>
      )}
      {msg && <p className="text-sm text-brand-700 mt-3">{msg}</p>}
    </div>
  );
}
