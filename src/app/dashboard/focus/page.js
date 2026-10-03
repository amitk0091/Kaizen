'use client';
import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';
import { addDays } from '@/lib/dates';

const PRESETS = [25, 50, 90];
const STORAGE_KEY = 'kaizen_focus_session';

// Timer state survives refreshes/tab closes via localStorage.
function loadRunning() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function storeRunning(s) {
  try { s ? localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) : localStorage.removeItem(STORAGE_KEY); } catch {}
}
const elapsedMs = (s, now = Date.now()) => s.accumulatedMs + (s.runningSince ? now - s.runningSince : 0);
const fmtClock = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = [660, 880, 1040][i];
      g.gain.setValueAtTime(0.15, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.4);
    });
  } catch {}
}

async function notifyDone(minutes) {
  try {
    if (Notification?.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration();
    const opts = { body: `${minutes} minutes of deep work. Take a short break.`, icon: '/icons/icon-192.png', tag: 'kaizen-focus' };
    if (reg) reg.showNotification('Focus session complete 🎯', opts);
    else new Notification('Focus session complete 🎯', opts);
  } catch {}
}

export default function FocusPage() {
  return <Suspense fallback={<p className="text-sm text-ink-600">Loading…</p>}><Focus /></Suspense>;
}

function Focus() {
  const router = useRouter();
  const params = useSearchParams();
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [todos, setTodos] = useState([]);
  const [me, setMe] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [todoId, setTodoId] = useState(params.get('todo') || '');
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState(50);
  const [running, setRunning] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [parkText, setParkText] = useState('');
  const [review, setReview] = useState(null); // { session, distractions: [{text, state}] }
  const [err, setErr] = useState('');
  const finishing = useRef(false);
  const day = today();

  const onError = useCallback((e) => {
    if (e.code === 'trial_expired') router.push('/dashboard/subscribe');
    else setErr(e.message || 'Something went wrong');
  }, [router]);

  const load = useCallback(async () => {
    const [t, m, s] = await Promise.all([
      apiGet('/api/todos'),
      apiGet('/api/me'),
      apiGet(`/api/focus?from=${addDays(day, -6)}&to=${day}`),
    ]);
    setTodos((t.todos || []).filter((x) => x.status !== 'completed'));
    setMe(m.user);
    setSessions(s.sessions || []);
  }, [day]);

  useEffect(() => { load().catch(onError); setRunning(loadRunning()); }, [load, onError]);

  useEffect(() => {
    if (!running?.runningSince) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running?.runningSince]);

  const update = (s) => { setRunning(s); storeRunning(s); };

  const start = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    const todo = todos.find((t) => t._id === todoId);
    update({ todoId: todo?._id || null, label: todo?.title || label.trim() || 'Deep work', plannedMin: minutes, date: day, accumulatedMs: 0, runningSince: Date.now(), distractions: [] });
    setNow(Date.now());
  };
  const pause = () => update({ ...running, accumulatedMs: elapsedMs(running), runningSince: null });
  const resume = () => update({ ...running, runningSince: Date.now() });
  const park = () => {
    if (!parkText.trim()) return;
    update({ ...running, distractions: [...running.distractions, { text: parkText.trim(), at: new Date().toISOString() }] });
    setParkText('');
  };

  const finish = useCallback(async (s, completedNaturally) => {
    if (finishing.current) return;
    finishing.current = true;
    const actualMin = Math.min(s.plannedMin, Math.round(elapsedMs(s) / 60000));
    if (completedNaturally) { chime(); notifyDone(actualMin); }
    try {
      const r = await apiSend('/api/focus', 'POST', { date: s.date, todoId: s.todoId, label: s.label, plannedMin: s.plannedMin, actualMin, distractions: s.distractions });
      update(null);
      setReview({ session: r.session, distractions: s.distractions.map((d) => ({ ...d, state: 'open' })) });
      load();
    } catch (e) {
      // Freeze the timer so the auto-finish effect doesn't retry in a loop; user retries manually.
      update({ ...s, accumulatedMs: elapsedMs(s), runningSince: null, saveFailed: true });
      onError(e);
    } finally { finishing.current = false; }
  }, [load, onError]);

  // Auto-finish when time is up (also catches up after a refresh/reopen).
  useEffect(() => {
    if (running && !running.saveFailed && elapsedMs(running, now) >= running.plannedMin * 60000) finish(running, true);
  }, [running, now, finish]);

  const sortDistraction = async (i, to) => {
    const d = review.distractions[i];
    try {
      if (to === 'todo') await apiSend('/api/todos', 'POST', { title: d.text, priority: 'medium' });
      if (to === 'overthinking') await apiSend('/api/overthinking', 'POST', { date: day, thought: d.text, trigger: 'Came up during a focus session' });
      setReview((r) => ({ ...r, distractions: r.distractions.map((x, xi) => (xi === i ? { ...x, state: to } : x)) }));
    } catch (e) { onError(e); }
  };

  const markTaskDone = async () => {
    try {
      await apiSend(`/api/todos/${review.session.todoId}`, 'PUT', { status: 'completed' });
      setReview((r) => ({ ...r, taskDone: true }));
      load();
    } catch (e) { onError(e); }
  };

  const todayMin = sessions.filter((s) => s.date === day).reduce((n, s) => n + s.actualMin, 0);
  const weekMin = sessions.reduce((n, s) => n + s.actualMin, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Focus</h1>
      <p className="text-ink-600 text-sm mt-1">One task. One timer. Park every distraction and keep going.</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card p-4 text-center"><div className="text-2xl font-extrabold text-brand-600">{todayMin}m</div><div className="text-xs text-ink-500">deep work today</div></div>
        <div className="card p-4 text-center"><div className="text-2xl font-extrabold text-brand-600">{(weekMin / 60).toFixed(1)}h</div><div className="text-xs text-ink-500">last 7 days</div></div>
      </div>
      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

      {review ? (
        <div className="card p-5 mt-5">
          <h2 className="font-bold text-lg">{review.session.completed ? 'Session complete 🎯' : 'Session saved'}</h2>
          <p className="text-sm text-ink-600 mt-1">{review.session.actualMin} minutes on <b>{review.session.label}</b>. Every minute is a vote for who you're becoming.</p>
          {review.session.todoId && !review.taskDone && (
            <button className="btn-ghost mt-3" disabled={locked} onClick={markTaskDone}>✓ Mark the task done</button>
          )}
          {review.taskDone && <p className="text-sm text-brand-700 mt-3">Task completed. 🏆</p>}

          {review.distractions.length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold text-sm">Sort your parked thoughts</h3>
              <p className="text-xs text-ink-500 mb-2">You didn't act on them mid-session — now decide where they belong.</p>
              <div className="space-y-2">
                {review.distractions.map((d, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-2.5 flex flex-wrap items-center gap-2">
                    <span className={`flex-1 min-w-[150px] text-sm ${d.state !== 'open' ? 'text-ink-400 line-through' : ''}`}>{d.text}</span>
                    {d.state === 'open' ? (
                      <>
                        <button className="btn-ghost px-2.5 py-1 text-xs" disabled={locked} onClick={() => sortDistraction(i, 'todo')}>→ Todo</button>
                        <button className="btn-ghost px-2.5 py-1 text-xs" disabled={locked} onClick={() => sortDistraction(i, 'overthinking')}>→ Overthinking</button>
                        <button className="text-xs text-ink-500 px-2" onClick={() => setReview((r) => ({ ...r, distractions: r.distractions.map((x, xi) => (xi === i ? { ...x, state: 'dismissed' } : x)) }))}>Let go</button>
                      </>
                    ) : <span className="text-xs text-ink-500">{d.state === 'dismissed' ? 'let go' : `→ ${d.state}`}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button className="btn-primary w-full mt-5" onClick={() => setReview(null)}>Done</button>
        </div>
      ) : running ? (
        <div className="card p-6 mt-5 text-center">
          <p className="text-sm text-ink-500">Focusing on</p>
          <p className="font-bold text-lg">{running.label}</p>
          <div className="text-6xl font-extrabold tabular-nums my-5">{fmtClock(running.plannedMin * 60000 - elapsedMs(running, now))}</div>
          <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(100, (elapsedMs(running, now) / (running.plannedMin * 60000)) * 100)}%` }} /></div>
          {running.saveFailed ? (
            <div className="mt-5">
              <p className="text-sm text-red-600 mb-2">Couldn't save this session.</p>
              <button className="btn-primary" disabled={locked} onClick={() => finish(running, false)}>Retry saving</button>
            </div>
          ) : (
          <div className="flex gap-2 justify-center mt-5">
            {running.runningSince ? <button className="btn-ghost" onClick={pause}>Pause</button> : <button className="btn-primary" onClick={resume}>Resume</button>}
            <button className="btn-ghost" disabled={locked} onClick={() => { if (confirm('End this session early? Your minutes so far will be saved.')) finish(running, false); }}>Stop early</button>
          </div>
          )}

          <div className="text-left mt-6">
            <label className="label">Distraction parking lot</label>
            <p className="text-xs text-ink-500 mb-2">Urge to check something? Write it here and get back to work. You'll sort it after.</p>
            <div className="flex gap-2">
              <input className="input" placeholder="e.g. reply to Rahul, check bank balance" value={parkText} onChange={(e) => setParkText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && park()} />
              <button className="btn-ghost" onClick={park}>Park</button>
            </div>
            {running.distractions.length > 0 && (
              <ul className="mt-2 text-sm text-ink-600 space-y-1">{running.distractions.map((d, i) => <li key={i}>🅿️ {d.text}</li>)}</ul>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-5 mt-5 space-y-4">
          {(me?.distraction || me?.focusTime) && (
            <div className="rounded-xl bg-brand-50 text-brand-800 text-sm p-3 space-y-1">
              {me.focusTime && <p>⏰ You said you focus best: <b>{me.focusTime}</b>. Protect that window.</p>}
              {me.distraction && <p>🛡️ Your usual derailer: <b>{me.distraction}</b>. Put it out of reach before you start.</p>}
            </div>
          )}
          <div>
            <label className="label">What will you work on?</label>
            <select className="input" value={todoId} onChange={(e) => setTodoId(e.target.value)}>
              <option value="">Something else (type below)</option>
              {todos.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
            {!todoId && <input className="input mt-2" placeholder="e.g. Write the proposal draft" value={label} onChange={(e) => setLabel(e.target.value)} />}
          </div>
          <div>
            <label className="label">How long?</label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESETS.map((m) => (
                <button key={m} onClick={() => setMinutes(m)} className={`chip border text-sm px-3 py-1.5 ${minutes === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>{m} min</button>
              ))}
              <input type="number" min={5} max={240} className="input max-w-[100px]" value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 0)))} />
            </div>
          </div>
          <button className="btn-primary w-full" disabled={locked} onClick={start}>▶ Start focus session</button>
        </div>
      )}

      {sessions.length > 0 && !running && (
        <div className="card mt-5 overflow-hidden">
          <h2 className="font-bold text-sm px-4 pt-4">Recent sessions</h2>
          <div className="divide-y divide-slate-100">
            {sessions.slice(0, 10).map((s) => (
              <div key={s._id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="flex-1 min-w-0 truncate">{s.label || 'Deep work'}</span>
                <span className="text-ink-500 text-xs">{s.date.slice(5)}</span>
                <span className={`chip ${s.completed ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-ink-600'}`}>{s.actualMin}/{s.plannedMin}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
