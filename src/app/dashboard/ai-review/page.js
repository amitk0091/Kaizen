'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiSend, today } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';
import Markdown from '@/components/Markdown';
import Link from 'next/link';

export default function AIReview() {
  const { access } = useAccess();
  const locked = access && !access.canWrite;
  const [reviews, setReviews] = useState([]);
  const [remaining, setRemaining] = useState(2);
  const [perDay, setPerDay] = useState(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [applying, setApplying] = useState('');

  const load = useCallback(async () => { const r = await apiGet(`/api/ai-review?day=${today()}`); setReviews(r.reviews || []); setRemaining(r.remaining); setPerDay(r.perDay); }, []);
  useEffect(() => { load(); }, [load]);

  const generate = useCallback(async () => {
    setLoading(true);
    setErr('');
    setRemaining((r) => Math.max(0, r - 1));
    try { await apiSend('/api/ai-review', 'POST', { day: today() }); await load(); }
    catch (e) {
      setRemaining((r) => r + 1);
      if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe';
      else setErr(e.message);
    }
    finally { setLoading(false); }
  }, [load]);

  const apply = useCallback(async (id) => {
    setApplying(id);
    setErr('');
    try {
      const r = await apiSend(`/api/ai-review/${id}/apply`, 'POST');
      setReviews((p) => p.map((x) => (x._id === id ? { ...x, appliedChecklistId: r.checklistId } : x)));
    } catch (e) {
      if (e.code === 'trial_expired') window.location.href = '/dashboard/subscribe';
      else setErr(e.message);
    } finally { setApplying(''); }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">AI Review</h1><p className="text-ink-600 text-sm mt-1">An honest weekly read on your data — what's working, what's not, and 3 tiny next steps.</p></div>
      </div>

      <div className="card p-5 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Generate this week's review</p><p className="text-xs text-ink-500">{remaining} of {perDay} left today</p></div>
        <button className="btn-primary" disabled={loading || locked || remaining <= 0} onClick={generate}>{loading ? 'Analyzing…' : remaining <= 0 ? 'Limit reached' : 'Generate'}</button>
      </div>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      <p className="text-[11px] text-ink-400 mt-2">Kaizen's coach is not a substitute for professional medical or mental-health care.</p>

      <div className="space-y-4 mt-6">
        {reviews.map((r) => (
          <div key={r._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs text-ink-500">{new Date(r.createdAt).toLocaleString()} · {r.windowStart} → {r.windowEnd}</span>
              <span className="chip bg-slate-100 text-ink-500">{r.model}</span>
            </div>
            <Markdown text={r.output} />
            <div className="mt-4 pt-3 border-t border-slate-100">
              {r.appliedChecklistId ? (
                <Link href="/dashboard/checklists" className="text-sm text-brand-700 font-medium">✓ Tiny steps added to your checklists →</Link>
              ) : (
                <button className="btn-ghost" disabled={locked || applying === r._id} onClick={() => apply(r._id)}>{applying === r._id ? 'Adding…' : '✅ Turn the 3 tiny steps into a checklist'}</button>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-ink-500">No reviews yet. Log a few days, then generate your first one.</p>}
      </div>
    </div>
  );
}
