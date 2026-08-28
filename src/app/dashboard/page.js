'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';
import DynamicField from '@/components/DynamicField';

export default function TodayPage() {
  const { access } = useAccess();
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [schemaVersion, setSchemaVersion] = useState(1);
  const [streak, setStreak] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const day = today();
  const locked = access && !access.canWrite;

  useEffect(() => {
    (async () => {
      try {
        const s = await apiGet('/api/tracker/schema');
        const active = (s.schema.fields || []).filter((f) => f.isActive).sort((a, b) => a.order - b.order);
        setFields(active); setSchemaVersion(s.schema.version || 1);
        const e = await apiGet(`/api/tracker/entries?date=${day}`);
        if (e.entry) setValues(e.entry.values || {});
        // streak
        const from = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
        const list = await apiGet(`/api/tracker/entries?from=${from}&to=${day}`);
        setStreak(computeStreak(list.entries || [], day));
      } catch (e) { setErr(e.message); }
    })();
  }, [day]);

  function onChange(id, v) { setValues((p) => ({ ...p, [id]: v })); setSaved(false); }

  async function save() {
    setSaving(true); setErr('');
    try {
      await apiSend('/api/tracker/entries', 'POST', { date: day, values, schemaVersion });
      setSaved(true);
      const from = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
      const list = await apiGet(`/api/tracker/entries?from=${from}&to=${day}`);
      setStreak(computeStreak(list.entries || [], day));
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe';
      else setErr(e.message);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Today</h1>
          <p className="text-ink-600 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-center card px-4 py-2">
          <div className="text-2xl font-extrabold text-brand-600">{streak}🔥</div>
          <div className="text-xs text-ink-500">day streak</div>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="font-bold mb-1">Daily check-in</h2>
        <p className="text-xs text-ink-500 mb-4">Logging itself drives change. Keep it quick — 20 seconds is enough.</p>
        {fields.length === 0 && <p className="text-sm text-ink-600">No fields yet. <a href="/dashboard/tracker" className="text-brand-700 underline">Customize your tracker</a>.</p>}
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.fieldId}>
              <label className="label">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
              {f.helpText && <p className="text-xs text-ink-500 mb-1">{f.helpText}</p>}
              <DynamicField field={f} value={values[f.fieldId]} onChange={onChange} disabled={locked} />
            </div>
          ))}
        </div>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        {fields.length > 0 && (
          <button onClick={save} disabled={saving || locked} className="btn-primary w-full mt-5">
            {saving ? 'Saving…' : saved ? 'Saved \u2713 Nice work!' : "Save today's check-in"}
          </button>
        )}
        {saved && <p className="text-center text-sm text-brand-700 mt-2">One more vote for who you're becoming. 🌱</p>}
      </div>
    </div>
  );
}

function computeStreak(entries, day) {
  const set = new Set(entries.map((e) => e.date));
  let streak = 0;
  let d = new Date(day + 'T00:00:00');
  // allow today to be unlogged without breaking streak
  if (!set.has(day)) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
