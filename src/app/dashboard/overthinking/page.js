'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';
import Loader from '@/components/Loader';

export default function Overthinking() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ date: today(), thought: '', trigger: '', inControl: false, note: '' });
  const [loading, setLoading] = useState('');

  const load = useCallback(async () => { const r = await apiGet('/api/overthinking'); setItems(r.items || []); }, []);
  useEffect(() => { load(); }, [load]);
  const guard = useCallback((fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } }, []);

  const add = guard(async () => {
    if (!form.thought.trim()) return;
    setLoading('add');
    const prev = items;
    const tempId = `temp_${Date.now()}`;
    setItems((p) => [...p, { ...form, _id: tempId }]);
    setForm({ date: today(), thought: '', trigger: '', inControl: false, note: '' });
    try { await apiSend('/api/overthinking', 'POST', form); } catch (e) { setItems(prev); setForm(form); throw e; }
    finally { setLoading(''); }
    load();
  });

  const del = useCallback(guard(async (id) => {
    setLoading(`del_${id}`);
    const prev = items;
    setItems((p) => p.filter((z) => z._id !== id));
    try { await apiSend(`/api/overthinking/${id}`, 'DELETE'); } catch (e) { setItems(prev); throw e; }
    finally { setLoading(''); }
  }), [items, guard]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Overthinking</h1>
      <p className="text-ink-600 text-sm mt-1">Get it out of your head and onto the page. Naming the trigger takes away its power.</p>

      <div className="card p-4 mt-4 space-y-3">
        <textarea className="input min-h-[80px]" placeholder="What are you overthinking?" value={form.thought} disabled={locked} onChange={(e) => setForm({ ...form, thought: e.target.value })} />
        <input className="input" placeholder="What triggered it? (optional)" value={form.trigger} disabled={locked} onChange={(e) => setForm({ ...form, trigger: e.target.value })} />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]"><label className="label">Date</label><input type="date" className="input" value={form.date} max={today()} disabled={locked} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-ink-700 pb-2.5"><input type="checkbox" checked={form.inControl} disabled={locked} onChange={(e) => setForm({ ...form, inControl: e.target.checked })} /> Is this in my control?</label>
        </div>
        <button className="btn-primary w-full" disabled={locked || loading === 'add'} onClick={add}><span className="inline-flex items-center gap-2">{loading === 'add' && <Loader size="sm" />}{loading === 'add' ? 'Logging…' : 'Log it'}</span></button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5 text-xs">
          <span className="chip bg-brand-100 text-brand-800">🕊️ {items.filter((i) => i.status === 'released').length} released</span>
          <span className="chip bg-brand-100 text-brand-800">✅ {items.filter((i) => i.status === 'actioned').length} turned into action</span>
          <span className="chip bg-slate-100 text-ink-600">{items.filter((i) => !i.status || i.status === 'open').length} still open</span>
        </div>
      )}

      <div className="space-y-2 mt-3">
        {items.map((it) => (
          <div key={it._id} className={`card p-3 ${it.status === 'released' ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium flex-1 min-w-0 whitespace-pre-wrap break-words">{it.thought}</p>
              <span className={`chip ${it.inControl ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-ink-600'}`}>{it.inControl ? 'in control' : 'not in control'}</span>
              <button className="text-ink-400 hover:text-red-600" disabled={locked || loading === `del_${it._id}`} onClick={() => del(it._id)}>{loading === `del_${it._id}` ? <Loader size="sm" /> : '✕'}</button>
            </div>
            {it.trigger && <p className="text-xs text-ink-500 mt-1">Trigger: {it.trigger}</p>}
            <p className="text-xs text-ink-400 mt-1">{it.date}</p>
            {!String(it._id).startsWith('temp_') && <WorkThrough item={it} locked={locked} guard={guard} onSaved={load} />}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-500">Nothing logged. That's a good day.</p>}
      </div>
    </div>
  );
}

// CBT-style follow-up: in control -> smallest next action (optionally a todo); not in control -> reframe and release.
function WorkThrough({ item, locked, guard, onSaved }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ evidence: item.evidence || '', friendAdvice: item.friendAdvice || '', nextAction: item.nextAction || '' });
  const [busy, setBusy] = useState(false);
  const status = item.status || 'open';

  const send = guard(async (patch) => {
    setBusy(true);
    try { await apiSend(`/api/overthinking/${item._id}`, 'PUT', { ...f, ...patch }); setOpen(false); onSaved(); }
    finally { setBusy(false); }
  });

  if (status !== 'open' && !open) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className={`chip ${status === 'released' ? 'bg-slate-100 text-ink-600' : 'bg-brand-100 text-brand-800'}`}>{status === 'released' ? '🕊️ released' : '✅ actioned'}</span>
        {item.nextAction && <span className="text-ink-500 truncate">Next: {item.nextAction}</span>}
        <button className="text-brand-700 ml-auto" disabled={locked} onClick={() => setOpen(true)}>Revisit</button>
      </div>
    );
  }
  if (!open) {
    return <button className="mt-2 text-sm text-brand-700 font-medium" disabled={locked} onClick={() => setOpen(true)}>Work through it →</button>;
  }
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <div>
        <label className="label">What's the actual evidence — for and against?</label>
        <textarea className="input min-h-[60px]" value={f.evidence} disabled={locked} onChange={(e) => setF({ ...f, evidence: e.target.value })} placeholder="Facts only, not predictions." />
      </div>
      <div>
        <label className="label">What would you tell a friend thinking this?</label>
        <textarea className="input min-h-[60px]" value={f.friendAdvice} disabled={locked} onChange={(e) => setF({ ...f, friendAdvice: e.target.value })} placeholder="You'd probably be kinder to them than to yourself." />
      </div>
      {item.inControl ? (
        <div>
          <label className="label">It's in your control. What's the smallest next action?</label>
          <input className="input" value={f.nextAction} disabled={locked} onChange={(e) => setF({ ...f, nextAction: e.target.value })} placeholder="e.g. Send a 2-line email to my manager" />
          <div className="flex flex-wrap gap-2 mt-2">
            <button className="btn-primary" disabled={locked || busy || !f.nextAction.trim() || !!item.todoId} onClick={() => send({ makeTodo: true })}>{item.todoId ? 'Already a todo' : 'Make it a todo'}</button>
            <button className="btn-ghost" disabled={locked || busy} onClick={() => send({ status: 'actioned' })}>I'll handle it</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-ink-600">This one isn't in your control. Worrying won't change it — your energy is better spent elsewhere.</p>
          <button className="btn-primary mt-2" disabled={locked || busy} onClick={() => send({ status: 'released' })}>🕊️ Let it go</button>
        </div>
      )}
      <button className="text-xs text-ink-500" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}
