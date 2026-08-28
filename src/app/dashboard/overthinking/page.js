'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

export default function Overthinking() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ date: today(), thought: '', trigger: '', inControl: false, note: '' });

  const load = async () => { const r = await apiGet('/api/overthinking'); setItems(r.items || []); };
  useEffect(() => { load(); }, []);
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } };
  const add = guard(async () => { if (!form.thought.trim()) return; await apiSend('/api/overthinking', 'POST', form); setForm({ ...form, thought: '', trigger: '', note: '' }); load(); });
  const del = guard(async (id) => { await apiSend(`/api/overthinking/${id}`, 'DELETE'); load(); });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Overthinking</h1>
      <p className="text-ink-600 text-sm mt-1">Get it out of your head and onto the page. Naming the trigger takes away its power.</p>

      <div className="card p-4 mt-4 space-y-3">
        <textarea className="input min-h-[80px]" placeholder="What are you overthinking?" value={form.thought} disabled={locked} onChange={(e) => setForm({ ...form, thought: e.target.value })} />
        <input className="input" placeholder="What triggered it? (optional)" value={form.trigger} disabled={locked} onChange={(e) => setForm({ ...form, trigger: e.target.value })} />
        <div className="flex gap-3 items-end">
          <div className="flex-1"><label className="label">Date</label><input type="date" className="input" value={form.date} max={today()} disabled={locked} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-ink-700 pb-2.5"><input type="checkbox" checked={form.inControl} disabled={locked} onChange={(e) => setForm({ ...form, inControl: e.target.checked })} /> Is this in my control?</label>
        </div>
        <button className="btn-primary w-full" disabled={locked} onClick={add}>Log it</button>
      </div>

      <div className="space-y-2 mt-5">
        {items.map((it) => (
          <div key={it._id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium flex-1">{it.thought}</p>
              <span className={`chip ${it.inControl ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-ink-600'}`}>{it.inControl ? 'in control' : 'not in control'}</span>
              <button className="text-ink-400 hover:text-red-600" disabled={locked} onClick={() => del(it._id)}>✕</button>
            </div>
            {it.trigger && <p className="text-xs text-ink-500 mt-1">Trigger: {it.trigger}</p>}
            <p className="text-xs text-ink-400 mt-1">{it.date}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-500">Nothing logged. That's a good day.</p>}
      </div>
    </div>
  );
}
