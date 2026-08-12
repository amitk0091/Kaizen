"use client";
import { useStore } from "@/store/useStore";
import { todayStr } from "@/lib/types";
import { streak } from "@/lib/review";
import { Card, Btn, Chip, Check } from "./ui";

export default function Home({ go, trialDaysLeft, onUpgrade }: { go: (v: string) => void; trialDaysLeft: number; onUpgrade: () => void }) {
  const { state, mutate } = useStore();
  const t = todayStr();
  const open = state.todos.filter((x) => !x.done);
  const doneCount = state.todos.filter((x) => x.done).length;
  const habitsToday = state.habits.filter((h) => h.log?.[t]).length;
  const mDone = state.goals.reduce((a, g) => a + g.milestones.filter((m) => m.done).length, 0);
  const mTot = state.goals.reduce((a, g) => a + g.milestones.length, 0);
  const cardsDue = state.learnings.flatMap((l) => l.cards).filter((c) => c.due <= t).length;
  const diaryToday = state.diaryEntries.some((e) => e.date === t);
  const toggle = (id: string) => mutate((s) => { const x = s.todos.find((t) => t.id === id); if (x) x.done = !x.done; });

  const Kpi = ({ v, l }: any) => <Card><div className="text-[28px] font-bold">{v}</div><div className="text-xs text-ink3 mt-0.5">{l}</div></Card>;

  return (
    <div>
      {trialDaysLeft <= 1 && (
        <div className="bg-accentSoft border border-line rounded-xl px-3.5 py-3 text-sm mb-4 flex gap-2.5 items-center flex-wrap">
          ⏳ <div className="flex-1"><b>Your free trial ends soon.</b> Keep your streaks, reviews and data going for ₹49/month or ₹499/year. Nothing is charged automatically.</div>
          <Btn size="sm" variant="primary" onClick={onUpgrade}>Upgrade</Btn>
        </div>
      )}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-4">
        <Kpi v={`${doneCount}/${doneCount + open.length}`} l="To-dos done" />
        <Kpi v={`${habitsToday}/${state.habits.length}`} l="Habits checked" />
        <Kpi v={`${mDone}/${mTot}`} l="Milestones reached" />
        <Kpi v={cardsDue} l="Review cards due" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs font-bold text-ink2 uppercase tracking-wide mb-3">Do next</div>
          {open.slice(0, 4).map((x) => (
            <div key={x.id} className="flex gap-3 items-start mb-2"><Check on={false} onClick={() => toggle(x.id)} /><div className="flex-1"><div className="text-sm font-medium">{x.text}</div>{x.when && <div className="text-xs text-ink3">⏰ {x.when}</div>}</div></div>
          ))}
          {!open.length && <div className="text-sm text-ink3">No open to-dos. Add one with the + button.</div>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {cardsDue > 0 && <Btn size="sm" onClick={() => go("learnings")}>Review {cardsDue} card{cardsDue > 1 ? "s" : ""} →</Btn>}
            {diaryToday ? <Chip tone="accent">✓ Diary done today</Chip> : <Btn size="sm" variant="primary" onClick={() => go("diary")}>Fill today's diary →</Btn>}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-bold text-ink2 uppercase tracking-wide mb-3">2-minute check-in</div>
          <div className="text-sm text-ink3 mb-2.5">Feeling something? Name it, dump it, and turn it into one small step.</div>
          <Btn className="w-full mb-2" onClick={() => go("mind")}>☁ Open Mind Dump</Btn>
          <Btn className="w-full mb-2" onClick={() => go("learnings")}>✦ Log something I learned</Btn>
          <Btn variant="primary" className="w-full" onClick={() => go("review")}>✧ Run my AI review</Btn>
        </Card>
      </div>
      <div className="text-[11.5px] text-ink3 border-t border-line mt-4 pt-3">Kaizen is a self-improvement tool — not medical, psychological, financial, or legal advice.</div>
    </div>
  );
}
