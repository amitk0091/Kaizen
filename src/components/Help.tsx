"use client";
import { useStore } from "@/store/useStore";
import { defaultState } from "@/lib/types";
import { saveLocal } from "@/lib/db";
import { Card, Btn } from "./ui";

const FAQ = [
  ["Is my data private? Can I stop the AI from reading my feelings?", "Yes. Entries are private to you and encrypted. AI processing is opt-in and revocable, and you can exclude any module (like Feelings) from the review."],
  ["Does the AI replace a therapist or coach?", "No. It offers reflection grounded in your own data — not medical, psychological, financial, or legal advice. If you're in distress, please contact a professional or local helpline."],
  ["What happens to past diary entries if I change my template?", "Nothing changes. Editing the template creates a new version going forward; past entries keep the exact version they were written with."],
  ["How do streaks work if I miss a day?", "Streaks are forgiving — a minimum version still counts, and one miss doesn't erase your progress. Progress over perfection."],
  ["How do spaced-repetition review cards work?", "Rate each card Again/Hard/Good/Easy. Easy cards return later; hard ones sooner — so you study exactly what you're about to forget."],
  ["How much does it cost?", "3-day free trial with everything unlocked, then ₹49/month or ₹499/year. Nothing is charged automatically."],
  ["Does it work offline / on my phone?", "Yes — it's a mobile-first PWA with offline capture, and full dark & light modes."],
  ["Can I export or delete my data?", "Yes — export everything as JSON, or reset your local data any time."],
];

export default function Help() {
  const { state, mutate } = useStore();
  const exportData = () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kaizen-data.json"; a.click(); };
  const reset = () => { if (confirm("Reset local demo data on this device?")) { const d = defaultState(); d.onboarded = true; saveLocal(d); mutate(() => {}); location.reload(); } };
  return (
    <div>
      <Card className="mb-3.5">
        <h3 className="text-lg font-bold mb-2">Get the most out of Kaizen</h3>
        <p className="text-sm text-ink2">Kaizen works best as a daily loop: <b>capture</b> (to-dos, learnings, feelings) → <b>direct</b> (goals + habits) → <b>reflect</b> (AI review + weekly review). Five minutes a day compounds.</p>
        <ul className="text-sm text-ink2 mt-2 space-y-1.5 list-disc pl-5">
          <li>Set one specific goal with a target date and an if-then plan for your biggest obstacle.</li>
          <li>Anchor tiny habits to things you already do.</li>
          <li>Turn what you learn into review cards — they resurface right before you'd forget.</li>
          <li>When your head is noisy, name the feeling and dump it — then convert one worry into a to-do.</li>
          <li>Run your AI review daily, and do a longer weekly reflection.</li>
        </ul>
      </Card>
      <Card className="mb-3.5">
        <h3 className="text-lg font-bold mb-2">FAQ</h3>
        {FAQ.map(([q, a]) => (<div key={q} className="py-3.5 border-b border-line last:border-0"><div className="font-semibold text-[15px] mb-1">{q}</div><div className="text-sm text-ink3">{a}</div></div>))}
      </Card>
      <Card><h3 className="text-base font-bold mb-2">Your data</h3><div className="flex gap-2 flex-wrap"><Btn size="sm" onClick={exportData}>⬇ Export my data</Btn><Btn size="sm" variant="danger" onClick={reset}>Reset local data</Btn></div></Card>
    </div>
  );
}
