'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

const STATUS = [{ v: 'pending', l: 'Pending' }, { v: 'ongoing', l: 'Ongoing' }, { v: 'completed', l: 'Completed' }];
const PRIO = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600' };

export default function Todos() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: '', priority: 'medium', deadline: '' });

  const load = async () => { const r = await apiGet('/api/todos'); setTodos(r.todos || []); };
  useEffect(() => { load(); }, []);
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe'; else alert(e.message); } };

  const add = guard(async () => { if (!form.title.trim()) return; await apiSend('/api/todos', 'POST', form); setForm({ title: '', priority: 'medium', deadline: '' }); load(); });
  const upd = guard(async (id, patch) => { await apiSend(`/api/todos/${id}`, 'PUT', patch); load(); });
  const del = guard(async (id) => { await apiSend(`/api/todos/${id}`, 'DELETE'); load(); });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Todos</h1>
      <p className="text-ink-600 text-sm mt-1">Do the most important thing first. Tie tasks to a deadline.</p>

      <div className="card p-4 mt-4 space-y-2">
        <input className="input" placeholder="What needs doing?" value={form.title} disabled={locked} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <select className="input max-w-[130px]" value={form.priority} disabled={locked} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <input type="date" className="input max-w-[170px]" value={form.deadline} disabled={locked} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <button className="btn-primary ml-auto" disabled={locked} onClick={add}>Add</button>
        </div>
      </div>

      <div className="space-y-5 mt-5">
        {STATUS.map((s) => {
          const items = todos.filter((t) => t.status === s.v);
          return (
            <div key={s.v}>
              <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wide mb-2">{s.l} ({items.length})</h2>
              <div className="space-y-2">
                {items.map((t) => {
                  const overdue = t.deadline && t.status !== 'completed' && new Date(t.deadline) < new Date();
                  return (
                    <div key={t._id} className="card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${t.status === 'completed' ? 'line-through text-ink-400' : ''}`}>{t.title}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className={`chip ${PRIO[t.priority]}`}>{t.priority}</span>
                          {t.deadline && <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}>{new Date(t.deadline).toLocaleDateString()}{overdue ? ' · overdue' : ''}</span>}
                        </div>
                      </div>
                      <select className="input max-w-[120px] shrink-0 py-1.5" value={t.status} disabled={locked} onChange={(e) => upd(t._id, { status: e.target.value })}>
                        {STATUS.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                      </select>
                      <button className="text-ink-400 hover:text-red-600 shrink-0" disabled={locked} onClick={() => del(t._id)}>✕</button>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="text-sm text-ink-400">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
