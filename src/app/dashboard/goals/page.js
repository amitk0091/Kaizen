'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

export default function Goals() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [goals, setGoals] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', identity: '', targetDate: '', ifThenPlan: '', shieldingPlan: '' });

  const load = async () => { const r = await apiGet('/api/goals'); setGoals(r.goals || []); };
  useEffect(() => { load(); }, []);
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } };

  const add = guard(async () => { if (!form.title.trim()) return; await apiSend('/api/goals', 'POST', form); setForm({ title: '', identity: '', targetDate: '', ifThenPlan: '', shieldingPlan: '' }); setOpen(false); load(); });
  const save = guard(async (g) => { await apiSend(`/api/goals/${g._id}`, 'PUT', g); load(); });
  const del = guard(async (id) => { if (!confirm('Delete this goal?')) return; await apiSend(`/api/goals/${id}`, 'DELETE'); load(); });

  const pct = (g) => { const t = g.subGoals?.length || 0; if (!t) return 0; return Math.round((g.subGoals.filter((s) => s.done).length / t) * 100); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">Goals</h1><p className="text-ink-600 text-sm mt-1">Break big goals into sub-goals. Add an if-then plan — it roughly doubles follow-through.</p></div>
        <button className="btn-primary" disabled={locked} onClick={() => setOpen(!open)}>{open ? 'Close' : '+ New goal'}</button>
      </div>

      {open && (
        <div className="card p-4 mt-4 space-y-3">
          <input className="input" placeholder="Goal (e.g. Ship my side project)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" placeholder="I'm becoming… (e.g. a shipper)" value={form.identity} onChange={(e) => setForm({ ...form, identity: e.target.value })} />
          <div><label className="label">Target date</label><input type="date" className="input" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></div>
          <div><label className="label">If-then plan</label><input className="input" placeholder="If it's 7am, then I will write for 2 minutes" value={form.ifThenPlan} onChange={(e) => setForm({ ...form, ifThenPlan: e.target.value })} /></div>
          <div><label className="label">Shielding plan (optional)</label><input className="input" placeholder="If I feel like scrolling, then I will close the app for 10 minutes" value={form.shieldingPlan} onChange={(e) => setForm({ ...form, shieldingPlan: e.target.value })} /></div>
          <button className="btn-primary w-full" onClick={add}>Create goal</button>
        </div>
      )}

      <div className="space-y-4 mt-5">
        {goals.map((g) => (
          <div key={g._id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-bold text-lg">{g.title}</h2>
                {g.identity && <p className="text-xs text-brand-700">becoming {g.identity}</p>}
                {g.targetDate && <p className="text-xs text-ink-500">by {new Date(g.targetDate).toLocaleDateString()}</p>}
              </div>
              <button className="text-ink-400 hover:text-red-600" disabled={locked} onClick={() => del(g._id)}>✕</button>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-ink-500 mb-1"><span>Progress</span><span>{pct(g)}%</span></div>
              <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct(g)}%` }} /></div>
            </div>
            {(g.ifThenPlan || g.shieldingPlan) && (
              <div className="mt-3 text-xs text-ink-600 space-y-1">
                {g.ifThenPlan && <p>🎯 {g.ifThenPlan}</p>}
                {g.shieldingPlan && <p>🛡️ {g.shieldingPlan}</p>}
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              {(g.subGoals || []).map((s, i) => (
                <div key={s.subId} className="flex items-center gap-2 group">
                  <button disabled={locked} onClick={() => { const c = { ...g, subGoals: g.subGoals.map((x, xi) => xi === i ? { ...x, done: !x.done } : x) }; setGoals((p) => p.map((z) => z._id === g._id ? c : z)); save(c); }}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center text-[10px] ${s.done ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>{s.done ? '\u2713' : ''}</button>
                  <span className={`text-sm ${s.done ? 'line-through text-ink-400' : ''}`}>{s.title}</span>
                  <button className="opacity-0 group-hover:opacity-100 text-ink-400 text-xs ml-auto" disabled={locked} onClick={() => { const c = { ...g, subGoals: g.subGoals.filter((_, xi) => xi !== i) }; setGoals((p) => p.map((z) => z._id === g._id ? c : z)); save(c); }}>✕</button>
                </div>
              ))}
            </div>
            <AddSub locked={locked} onAdd={(title) => { const c = { ...g, subGoals: [...(g.subGoals || []), { subId: `s_${Date.now()}`, title, done: false }] }; setGoals((p) => p.map((z) => z._id === g._id ? c : z)); save(c); }} />
          </div>
        ))}
        {goals.length === 0 && <p className="text-sm text-ink-500">No goals yet. Add your first one.</p>}
      </div>
    </div>
  );
}

function AddSub({ onAdd, locked }) {
  const [v, setV] = useState('');
  return (
    <div className="flex gap-2 mt-3">
      <input className="input py-1.5 text-sm" placeholder="Add a sub-goal" value={v} disabled={locked} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }} />
      <button className="btn-ghost px-3 py-1.5 text-sm" disabled={locked} onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(''); } }}>Add</button>
    </div>
  );
}
