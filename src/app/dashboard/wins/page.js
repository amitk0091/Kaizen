'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/clientApi';

export default function Wins() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { apiGet('/api/wins').then(setData).catch((e) => setErr(e.message)); }, []);

  const s = data?.stats;
  const tiles = s ? [
    { v: s.bestStreak, l: 'best streak (days)', i: '🔥' },
    { v: `${(s.focusMinutes / 60).toFixed(1)}h`, l: `deep work · ${s.focusSessions} sessions`, i: '🎯' },
    { v: s.completedTodos, l: 'tasks completed', i: '✅' },
    { v: s.subGoalsDone, l: 'sub-goals done', i: '🪜' },
    { v: s.checkIns, l: 'daily check-ins', i: '📈' },
    { v: s.thoughtsReleased, l: 'worries released', i: '🕊️' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Wins</h1>
      <p className="text-ink-600 text-sm mt-1">Your evidence file. On hard days, come back here — you've already done hard things.</p>
      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      {!data && !err && <p className="text-sm text-ink-600 mt-4">Loading…</p>}

      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {tiles.map((t) => (
            <div key={t.l} className="card p-4">
              <div className="text-xs text-ink-500">{t.i} {t.l}</div>
              <div className="text-2xl font-extrabold text-brand-600 mt-1">{t.v}</div>
            </div>
          ))}
        </div>
      )}

      {data?.completedGoals?.length > 0 && (
        <div className="card p-4 mt-5">
          <h2 className="font-bold">🏆 Goals achieved</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {data.completedGoals.map((g, i) => <li key={i}>{g.title} <span className="text-xs text-ink-400">· {new Date(g.date).toLocaleDateString()}</span></li>)}
          </ul>
        </div>
      )}

      {data && (
        <div className="card mt-5 overflow-hidden">
          <h2 className="font-bold px-4 pt-4">✨ Good things you wrote down</h2>
          {data.wins.length === 0 ? (
            <p className="p-4 text-sm text-ink-500">No wins logged yet. Use the <Link href="/dashboard#shutdown" className="text-brand-700 underline">evening shutdown</Link> to write 3 each night.</p>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {data.wins.map((w, i) => (
                <div key={i} className="px-4 py-2.5 flex gap-3 text-sm">
                  <span className="text-xs text-ink-400 shrink-0 w-12 pt-0.5">{w.date.slice(5)}</span>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
