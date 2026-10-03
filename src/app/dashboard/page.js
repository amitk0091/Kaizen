'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';
import { addDays, weekStart, dayOfWeek } from '@/lib/dates';
import { computeStreak } from '@/lib/streak';
import DynamicField from '@/components/DynamicField';

const STREAK_LOOKBACK_DAYS = 120;
const SAVED_MESSAGE_TIMEOUT = 2500;
const SHUTDOWN_HOUR = 17; // evening shutdown opens by default after 5pm
const MAX_TOP = 3;

export default function TodayPage() {
  const router = useRouter();
  const { access } = useAccess();
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [schemaVersion, setSchemaVersion] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]);
  const [plan, setPlan] = useState(undefined); // undefined = not loaded yet, null = no plan
  const [loggedDates, setLoggedDates] = useState([]);
  const [focusMin, setFocusMin] = useState(0);
  const savedTimeoutRef = useRef(null);
  const day = today();
  const locked = access && !access.canWrite;
  const streak = computeStreak(loggedDates, day);

  const onError = useCallback((e) => {
    if (e.code === 'trial_expired') router.push('/dashboard/subscribe');
    else setErr(e.message || 'Something went wrong');
  }, [router]);

  const loadPlanning = useCallback(async () => {
    const [t, g, p, f] = await Promise.all([
      apiGet('/api/todos'),
      apiGet('/api/goals'),
      apiGet(`/api/plan?date=${day}`),
      apiGet(`/api/focus?from=${day}&to=${day}`),
    ]);
    setTodos(t.todos || []);
    setGoals(g.goals || []);
    setPlan(p.plan);
    setFocusMin((f.sessions || []).reduce((n, s) => n + (s.actualMin || 0), 0));
  }, [day]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const from = addDays(day, -STREAK_LOOKBACK_DAYS);
        const [sRes, eRes, lRes] = await Promise.all([
          apiGet('/api/tracker/schema'),
          apiGet(`/api/tracker/entries?date=${day}`),
          apiGet(`/api/tracker/entries?from=${from}&to=${day}`),
          loadPlanning(),
        ]);
        const active = (sRes.schema?.fields || [])
          .filter((f) => f.isActive)
          .sort((a, b) => a.order - b.order);
        setFields(active);
        setSchemaVersion(sRes.schema?.version || 1);
        if (eRes.entry) setValues(eRes.entry.values || {});
        setLoggedDates((lRes.entries || []).map((e) => e.date));
        setErr('');
      } catch (e) {
        setErr(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [day, loadPlanning]);

  const onChange = useCallback((id, v) => {
    setValues((p) => ({ ...p, [id]: v }));
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setErr('');
    try {
      await apiSend('/api/tracker/entries', 'POST', { date: day, values, schemaVersion });
      setSaved(true);
      setLoggedDates((p) => (p.includes(day) ? p : [...p, day]));
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), SAVED_MESSAGE_TIMEOUT);
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }, [day, values, schemaVersion, onError]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const savePlan = useCallback(async (patch) => {
    setPlan((p) => ({ ...(p || {}), ...patch }));
    try {
      const r = await apiSend('/api/plan', 'PUT', { date: day, ...patch });
      setPlan(r.plan);
    } catch (e) { onError(e); }
  }, [day, onError]);

  const completeTodo = useCallback(async (id) => {
    setTodos((p) => p.map((t) => (t._id === id ? { ...t, status: 'completed' } : t)));
    try { await apiSend(`/api/todos/${id}`, 'PUT', { status: 'completed' }); } catch (e) { onError(e); loadPlanning(); }
  }, [onError, loadPlanning]);

  // Week planning nudge: Sun/Mon, when goals exist but no sub-goal is picked for this week.
  const thisWeek = weekStart(day);
  const openSubGoals = goals.flatMap((g) => (g.subGoals || []).filter((s) => !s.done));
  const needsWeekPlan = [0, 1].includes(dayOfWeek(day)) && openSubGoals.length > 0
    && !openSubGoals.some((s) => s.focusWeek === thisWeek);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Today</h1>
          <p className="text-ink-600 text-sm" suppressHydrationWarning>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/focus" className="text-center card px-4 py-2 hover:border-brand-500">
            <div className="text-2xl font-extrabold text-brand-600">{focusMin}<span className="text-sm">m</span></div>
            <div className="text-xs text-ink-500">deep work</div>
          </Link>
          <div className="text-center card px-4 py-2" title={streak.freezesUsed ? `${streak.freezesUsed} streak freeze(s) used — one missed day per week is forgiven` : 'One missed day per week is forgiven'}>
            <div className="text-2xl font-extrabold text-brand-600">{streak.streak}🔥{streak.freezesUsed > 0 && <span className="text-sm">🧊</span>}</div>
            <div className="text-xs text-ink-500">day streak</div>
          </div>
        </div>
      </div>

      {streak.missedYesterday && (
        <div className="card p-4 mt-4 border-amber-300 bg-amber-50 text-amber-900 text-sm">
          <b>You missed yesterday — that's fine.</b> Your streak is protected by a freeze 🧊. The rule is <i>never miss twice</i>: a 20-second check-in today keeps the chain alive.
        </div>
      )}

      {needsWeekPlan && (
        <Link href="/dashboard/goals#week" className="card p-4 mt-4 flex items-center gap-3 hover:border-brand-500">
          <span className="text-2xl">🗓️</span>
          <span className="flex-1 text-sm"><b>Plan your week.</b> Pick the 1–3 sub-goals that would make this week a win. It takes 2 minutes.</span>
          <span className="text-brand-700 text-sm font-semibold">Plan →</span>
        </Link>
      )}

      <TopThree todos={todos} goals={goals} plan={plan} locked={locked} onSave={savePlan} onComplete={completeTodo} />

      <div className="card p-5 mt-5">
        <h2 className="font-bold mb-1">Daily check-in</h2>
        <p className="text-xs text-ink-500 mb-4">Logging itself drives change. Keep it quick — 20 seconds is enough.</p>

        {loading && <p className="text-sm text-ink-600">Loading...</p>}
        {!loading && fields.length === 0 && (
          <p className="text-sm text-ink-600">
            No fields yet.{' '}
            <a href="/dashboard/tracker" className="text-brand-700 underline">
              Customize your tracker
            </a>
            .
          </p>
        )}

        {!loading && fields.length > 0 && (
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.fieldId}>
                <label className="label">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                {f.helpText && <p className="text-xs text-ink-500 mb-1">{f.helpText}</p>}
                <DynamicField
                  field={f}
                  value={values[f.fieldId]}
                  onChange={onChange}
                  disabled={locked}
                />
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        {!loading && fields.length > 0 && (
          <button onClick={save} disabled={saving || locked} className="btn-primary w-full mt-5">
            {saving ? 'Saving…' : saved ? 'Saved ✓ Nice work!' : "Save today's check-in"}
          </button>
        )}
        {saved && (
          <p className="text-center text-sm text-brand-700 mt-2">One more vote for who you're becoming. 🌱</p>
        )}
      </div>

      <Shutdown day={day} plan={plan} todos={todos} locked={locked} onSaved={(p) => { setPlan(p); loadPlanning(); }} onError={onError} />
    </div>
  );
}

function TopThree({ todos, goals, plan, locked, onSave, onComplete }) {
  const [adding, setAdding] = useState('');
  const byId = Object.fromEntries(todos.map((t) => [t._id, t]));
  const goalName = Object.fromEntries(goals.map((g) => [g._id, g.title]));
  const top = (plan?.top || []).map(String).filter((id) => byId[id]);
  const oneThing = plan?.oneThing ? String(plan.oneThing) : null;
  const candidates = todos.filter((t) => t.status !== 'completed' && !top.includes(t._id));
  const doneCount = top.filter((id) => byId[id].status === 'completed').length;

  const add = (id) => {
    if (!id) return;
    const next = [...top, id].slice(0, MAX_TOP);
    onSave({ top: next, oneThing: oneThing || id });
    setAdding('');
  };
  const remove = (id) => onSave({ top: top.filter((x) => x !== id), oneThing: oneThing === id ? null : oneThing });

  return (
    <div className="card p-5 mt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Today's Top 3</h2>
        {top.length > 0 && <span className="text-xs text-ink-500">{doneCount}/{top.length} done</span>}
      </div>
      <p className="text-xs text-ink-500 mb-3">Pick up to 3 tasks. Star your <b>One Thing</b> — do it first, before anything else.</p>

      <div className="space-y-2">
        {top.map((id) => {
          const t = byId[id];
          const done = t.status === 'completed';
          const isOne = oneThing === id;
          return (
            <div key={id} className={`flex items-center gap-2 rounded-xl border p-2.5 ${isOne ? 'border-brand-500 bg-brand-50/40' : 'border-slate-200'}`}>
              <button disabled={locked || done} onClick={() => onComplete(id)} aria-label="Mark done"
                className={`h-6 w-6 shrink-0 rounded-md border flex items-center justify-center text-xs ${done ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>{done ? '✓' : ''}</button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${done ? 'line-through text-ink-400' : ''}`}>{t.title}</p>
                {t.goalId && goalName[t.goalId] && <p className="text-[11px] text-brand-700 truncate">→ {goalName[t.goalId]}</p>}
              </div>
              <button disabled={locked} onClick={() => onSave({ oneThing: id })} title="Make this your One Thing" className={`text-lg ${isOne ? '' : 'opacity-30 hover:opacity-70'}`}>⭐</button>
              {!done && <Link href={`/dashboard/focus?todo=${id}`} className="btn-ghost px-2.5 py-1 text-xs">▶ Focus</Link>}
              <button disabled={locked} onClick={() => remove(id)} className="text-ink-400 hover:text-red-600 text-xs px-1" aria-label="Remove from Top 3">✕</button>
            </div>
          );
        })}
      </div>

      {top.length < MAX_TOP && (
        candidates.length > 0 ? (
          <select className="input mt-3" value={adding} disabled={locked} onChange={(e) => add(e.target.value)}>
            <option value="">+ Add a task to today…</option>
            {candidates.map((t) => <option key={t._id} value={t._id}>{t.title}{t.goalId && goalName[t.goalId] ? ` (→ ${goalName[t.goalId]})` : ''}</option>)}
          </select>
        ) : (
          <p className="text-sm text-ink-500 mt-3">No open tasks. <Link href="/dashboard/todos" className="text-brand-700 underline">Add a todo</Link> to plan your day.</p>
        )
      )}
      {top.length > 0 && doneCount === top.length && (
        <p className="text-center text-sm text-brand-700 mt-3">All done. That's a winning day. 🏆</p>
      )}
    </div>
  );
}

function Shutdown({ day, plan, todos, locked, onSaved, onError }) {
  const [open, setOpen] = useState(false);
  const [wins, setWins] = useState(['', '', '']);
  const [slipped, setSlipped] = useState('');
  const [tomorrowId, setTomorrowId] = useState('');
  const [tomorrowNew, setTomorrowNew] = useState('');
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || plan === undefined) return;
    initialized.current = true;
    if (plan?.wins?.length) setWins([...plan.wins, '', '', ''].slice(0, 3));
    if (plan?.slipped) setSlipped(plan.slipped);
    const evening = new Date().getHours() >= SHUTDOWN_HOUR;
    setOpen((evening && !plan?.shutdownDone) || (typeof window !== 'undefined' && window.location.hash === '#shutdown'));
  }, [plan]);

  const openTodos = todos.filter((t) => t.status !== 'completed');

  async function submit() {
    setSaving(true);
    try {
      const r = await apiSend('/api/plan', 'PUT', { date: day, wins, slipped, shutdownDone: true });
      let id = tomorrowId;
      if (!id && tomorrowNew.trim()) {
        const t = await apiSend('/api/todos', 'POST', { title: tomorrowNew.trim(), priority: 'high' });
        id = t.todo._id;
      }
      if (id) {
        const tomorrow = addDays(day, 1);
        const existing = await apiGet(`/api/plan?date=${tomorrow}`);
        const top = [id, ...(existing.plan?.top || []).map(String).filter((x) => x !== id)].slice(0, MAX_TOP);
        await apiSend('/api/plan', 'PUT', { date: tomorrow, top, oneThing: id });
      }
      setTomorrowId(''); setTomorrowNew('');
      setOpen(false);
      onSaved(r.plan);
    } catch (e) { onError(e); } finally { setSaving(false); }
  }

  if (plan?.shutdownDone && !open) {
    return (
      <div id="shutdown" className="card p-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">🌙 Day closed</h2>
          <button className="text-xs text-brand-700" disabled={locked} onClick={() => setOpen(true)}>Edit</button>
        </div>
        {plan.wins?.length > 0 && (
          <ul className="mt-2 text-sm text-ink-700 space-y-1">{plan.wins.map((w, i) => <li key={i}>✨ {w}</li>)}</ul>
        )}
      </div>
    );
  }

  return (
    <div id="shutdown" className="card p-5 mt-5">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(!open)}>
        <h2 className="font-bold">🌙 Evening shutdown</h2>
        <span className="text-xs text-ink-500">{open ? 'Hide' : '2 minutes · Open'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">3 good things from today</label>
            <p className="text-xs text-ink-500 mb-2">Small counts. Writing them down trains your brain to notice progress.</p>
            {wins.map((w, i) => (
              <input key={i} className="input mb-2" placeholder={['e.g. Finished the hardest task first', 'e.g. Walked 20 minutes', 'e.g. Called my parents'][i]}
                value={w} disabled={locked} onChange={(e) => setWins((p) => p.map((x, xi) => (xi === i ? e.target.value : x)))} />
            ))}
          </div>
          <div>
            <label className="label">What slipped? (no judgement)</label>
            <input className="input" placeholder="e.g. Scrolled for an hour after lunch" value={slipped} disabled={locked} onChange={(e) => setSlipped(e.target.value)} />
          </div>
          <div>
            <label className="label">Tomorrow's One Thing</label>
            <select className="input" value={tomorrowId} disabled={locked} onChange={(e) => { setTomorrowId(e.target.value); setTomorrowNew(''); }}>
              <option value="">Choose an open task, or type a new one below…</option>
              {openTodos.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
            {!tomorrowId && (
              <input className="input mt-2" placeholder="…or a new task" value={tomorrowNew} disabled={locked} onChange={(e) => setTomorrowNew(e.target.value)} />
            )}
          </div>
          <button className="btn-primary w-full" disabled={locked || saving} onClick={submit}>{saving ? 'Closing…' : 'Close the day'}</button>
        </div>
      )}
    </div>
  );
}
