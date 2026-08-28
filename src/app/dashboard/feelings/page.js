'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

const EMOTIONS = ['Happy', 'Calm', 'Motivated', 'Grateful', 'Tired', 'Stressed', 'Anxious', 'Sad', 'Angry', 'Neutral'];

export default function Feelings() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ date: today(), emotion: 'Calm', intensity: 3, note: '' });

  const load = async () => { const r = await apiGet('/api/feelings'); setItems(r.items || []); };
  useEffect(() => { load(); }, []);
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } };
  const add = guard(async () => { await apiSend('/api/feelings', 'POST', form); setForm({ ...form, note: '' }); load(); });
  const del = guard(async (id) => { await apiSend(`/api/feelings/${id}`, 'DELETE'); load(); });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Feelings</h1>
      <p className="text-ink-600 text-sm mt-1">Name what you feel. You can log past days too. Emotions are signals, not problems.</p>

      <div className="card p-4 mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => (
            <button key={e} disabled={locked} onClick={() => setForm({ ...form, emotion: e })} className={`chip border ${form.emotion === e ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>{e}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]"><label className="label">Date</label><input type="date" className="input" value={form.date} max={today()} disabled={locked} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="label">Intensity</label>
            <div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} disabled={locked} onClick={() => setForm({ ...form, intensity: n })} className={`h-9 w-9 rounded-full text-sm border ${form.intensity === n ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300'}`}>{n}</button>)}</div>
          </div>
        </div>
        <textarea className="input min-h-[70px]" placeholder="Anything you want to note (optional)" value={form.note} disabled={locked} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="btn-primary w-full" disabled={locked} onClick={add}>Log feeling</button>
      </div>

      <div className="space-y-2 mt-5">
        {items.map((it) => (
          <div key={it._id} className="card p-3 flex items-center gap-3">
            <div className="flex-1"><p className="font-medium">{it.emotion} <span className="text-ink-400 text-sm">· {it.intensity}/5</span></p>{it.note && <p className="text-sm text-ink-600">{it.note}</p>}</div>
            <div className="text-xs text-ink-500">{it.date}</div>
            <button className="text-ink-400 hover:text-red-600" disabled={locked} onClick={() => del(it._id)}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-500">No entries yet.</p>}
      </div>
    </div>
  );
}
