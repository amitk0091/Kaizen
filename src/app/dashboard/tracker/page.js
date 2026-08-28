'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

const TYPES = [
  { v: 'text', l: 'Short text' }, { v: 'longtext', l: 'Long text' }, { v: 'number', l: 'Number' },
  { v: 'scale', l: 'Rating 1–5' }, { v: 'boolean', l: 'Yes / No' },
  { v: 'select', l: 'Single choice' }, { v: 'multiselect', l: 'Multiple choice' }, { v: 'time', l: 'Time' },
];
const newField = () => ({ fieldId: `f_${Date.now()}_${Math.floor(Math.random()*999)}`, label: '', type: 'text', options: [], required: false, helpText: '', isActive: true });

export default function TrackerBuilder() {
  const { access } = useAccess();
  const [fields, setFields] = useState([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = access && !access.canWrite;

  useEffect(() => { (async () => {
    const s = await apiGet('/api/tracker/schema');
    setFields((s.schema.fields || []).filter((f) => f.isActive).sort((a, b) => a.order - b.order));
  })(); }, []);

  const update = (i, patch) => setFields((p) => p.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const move = (i, dir) => setFields((p) => {
    const j = i + dir; if (j < 0 || j >= p.length) return p;
    const c = [...p]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  const remove = (i) => {
    if (!confirm('Delete this field?\n\nYour past entries keep their old data, but this field will no longer be tracked and new check-ins will have no value for it. This cannot be undone.')) return;
    setFields((p) => p.filter((_, idx) => idx !== i));
  };

  async function save() {
    setSaving(true); setMsg('');
    try {
      const payload = fields.map((f, i) => ({ ...f, order: i, options: (f.optionsText != null ? f.optionsText.split(',').map((s) => s.trim()).filter(Boolean) : f.options) }));
      await apiSend('/api/tracker/schema', 'PUT', { fields: payload });
      setMsg('Saved. Your daily check-in is updated.');
    } catch (e) {
      if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe';
      else setMsg(e.message);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Customize your tracker</h1>
      <p className="text-ink-600 text-sm mt-1">Design the daily check-in form that fits your life. Fewer, tinier fields get done more often.</p>

      <div className="space-y-3 mt-5">
        {fields.map((f, i) => (
          <div key={f.fieldId} className="card p-4">
            <div className="flex gap-2">
              <input className="input" placeholder="Field label" value={f.label} disabled={locked} onChange={(e) => update(i, { label: e.target.value })} />
              <select className="input max-w-[140px]" value={f.type} disabled={locked} onChange={(e) => update(i, { type: e.target.value })}>
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            {(f.type === 'select' || f.type === 'multiselect') && (
              <input className="input mt-2" placeholder="Options, comma separated" defaultValue={(f.options || []).join(', ')} disabled={locked} onChange={(e) => update(i, { optionsText: e.target.value })} />
            )}
            <input className="input mt-2" placeholder="Help text (optional)" value={f.helpText} disabled={locked} onChange={(e) => update(i, { helpText: e.target.value })} />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" checked={f.required} disabled={locked} onChange={(e) => update(i, { required: e.target.checked })} /> Required</label>
              <div className="flex gap-1">
                <button className="btn-ghost px-2 py-1" disabled={locked} onClick={() => move(i, -1)}>↑</button>
                <button className="btn-ghost px-2 py-1" disabled={locked} onClick={() => move(i, 1)}>↓</button>
                <button className="btn-danger px-3 py-1" disabled={locked} onClick={() => remove(i)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button className="btn-ghost" disabled={locked} onClick={() => setFields((p) => [...p, newField()])}>+ Add field</button>
        <button className="btn-primary sm:ml-auto" disabled={saving || locked} onClick={save}>{saving ? 'Saving…' : 'Save tracker'}</button>
      </div>
      {msg && <p className="text-sm text-brand-700 mt-3">{msg}</p>}
    </div>
  );
}
