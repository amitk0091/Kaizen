'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

export default function Checklists() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');

  const load = useCallback(async () => { const r = await apiGet('/api/checklists'); setLists(r.checklists || []); }, []);
  useEffect(() => { load(); }, [load]);

  const guard = useCallback((fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } }, []);

  const addList = guard(async () => {
    if (!name.trim()) return;
    const prev = lists;
    setName('');
    try { await apiSend('/api/checklists', 'POST', { name }); } catch (e) { setName(name); throw e; }
    load();
  });

  const saveList = useCallback(guard(async (l) => {
    const prev = lists;
    setLists((p) => p.map((x) => x._id === l._id ? l : x));
    try { await apiSend(`/api/checklists/${l._id}`, 'PUT', { name: l.name, items: l.items }); } catch (e) { setLists(prev); throw e; }
  }), [lists, guard]);

  const delList = guard(async (id) => {
    if (!confirm('Delete this checklist?')) return;
    const prev = lists;
    setLists((p) => p.filter((x) => x._id !== id));
    try { await apiSend(`/api/checklists/${id}`, 'DELETE'); } catch (e) { setLists(prev); throw e; }
  });

  const mutate = (id, fn) => setLists((p) => p.map((l) => l._id === id ? fn({ ...l }) : l));

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Checklists</h1>
      <p className="text-ink-600 text-sm mt-1">Reusable checklists. Tick items each time; hit reset to start fresh.</p>

      <div className="flex gap-2 mt-4">
        <input className="input" placeholder="New checklist name (e.g. Morning routine)" value={name} disabled={locked} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={locked} onClick={addList}>Add</button>
      </div>

      <div className="space-y-4 mt-5">
        {lists.map((l) => (
          <div key={l._id} className="card p-4">
            <div className="flex items-center justify-between">
              <input className="font-bold text-lg bg-transparent outline-none" value={l.name} disabled={locked}
                onChange={(e) => mutate(l._id, (x) => { x.name = e.target.value; return x; })}
                onBlur={() => saveList(l)} />
              <div className="flex gap-1">
                <button className="btn-ghost px-3 py-1 text-xs" disabled={locked} onClick={() => { mutate(l._id, (x) => { x.items = x.items.map((it) => ({ ...it, done: false })); return x; }); setTimeout(() => saveList(lists.find((x) => x._id === l._id)), 0); }}>Reset</button>
                <button className="btn-danger px-3 py-1 text-xs" disabled={locked} onClick={() => delList(l._id)}>Delete</button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {(l.items || []).map((it, i) => (
                <div key={it.itemId} className="flex items-center gap-2 group">
                  <button disabled={locked} onClick={() => { mutate(l._id, (x) => { x.items[i] = { ...it, done: !it.done }; return x; }); const upd = { ...l, items: l.items.map((z, zi) => zi === i ? { ...z, done: !z.done } : z) }; saveList(upd); }}
                    className={`h-6 w-6 rounded-md border flex items-center justify-center text-xs ${it.done ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>{it.done ? '\u2713' : ''}</button>
                  <input className={`flex-1 bg-transparent outline-none text-sm ${it.done ? 'line-through text-ink-400' : ''}`} value={it.text} disabled={locked}
                    onChange={(e) => mutate(l._id, (x) => { x.items[i] = { ...it, text: e.target.value }; return x; })} onBlur={() => saveList(lists.find((x) => x._id === l._id))} />
                  <button className="opacity-0 group-hover:opacity-100 text-ink-400 text-xs" disabled={locked} onClick={() => { const upd = { ...l, items: l.items.filter((_, zi) => zi !== i) }; mutate(l._id, () => upd); saveList(upd); }}>✕</button>
                </div>
              ))}
            </div>
            <button className="mt-3 text-sm text-brand-700" disabled={locked}
              onClick={() => { const upd = { ...l, items: [...(l.items || []), { itemId: `i_${Date.now()}`, text: 'New item', done: false, order: (l.items || []).length }] }; mutate(l._id, () => upd); saveList(upd); }}>+ Add item</button>
          </div>
        ))}
        {lists.length === 0 && <p className="text-sm text-ink-500">No checklists yet.</p>}
      </div>
    </div>
  );
}
