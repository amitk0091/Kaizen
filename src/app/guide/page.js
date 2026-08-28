import PublicHeader from '@/components/PublicHeader';
import Link from 'next/link';
export const metadata = { title: 'Guide' };

const STEPS = [
  { t: '1. Start with who you want to become', d: 'In onboarding, finish the sentence "I want to become…". Every habit is a vote for that person. This one line makes everything else stick.' },
  { t: '2. Customize your daily tracker — keep it tiny', d: 'Go to Customize tracker and add only 3–5 things you truly want to watch (e.g. deep-work minutes, day rating, "did my #1 task?"). Fewer, smaller fields get filled in every day.' },
  { t: '3. Do your daily check-in (20 seconds)', d: 'Each day, open Today and fill the form. The act of logging itself is what drives change — and the checkmark gives your brain the reward it needs to build the habit.' },
  { t: '4. Set one goal with an if-then plan', d: 'In Goals, add a goal and break it into sub-goals. Write an "If [time/place], then I will [tiny action]" plan. This simple sentence roughly doubles your follow-through.' },
  { t: '5. Empty your head into Feelings & Overthinking', d: 'When something is bugging you, log it. Naming the feeling or worry — and asking "is this in my control?" — takes away its grip and helps you refocus.' },
  { t: '6. Read your weekly AI review', d: 'Once you have a few days logged, open AI Review and generate one. It tells you what\'s working, what\'s not, why, and 3 tiny steps. Do this weekly, not obsessively.' },
  { t: '7. Never miss twice', d: 'Missed a day? No guilt. Just don\'t miss the next one. Consistency beats intensity — small steps, compounded, are how real change happens.' },
];

export default function Guide() {
  return (
    <main className="min-h-screen bg-surface">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="text-3xl font-extrabold">How to get the most from Kaizen</h1>
        <p className="text-ink-600 mt-2">Seven simple steps. Start with one — you don\'t have to do everything at once.</p>
        <div className="mt-6 space-y-4">
          {STEPS.map((s) => (
            <div key={s.t} className="card p-5">
              <h2 className="font-bold text-ink-900">{s.t}</h2>
              <p className="mt-1 text-ink-600 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/signup" className="btn-primary px-6 py-3">Start your 3-day free trial</Link>
        </div>
      </div>
    </main>
  );
}
