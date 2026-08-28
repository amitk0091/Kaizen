import Link from 'next/link';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

const principles = [
  { t: 'Tiny habits, real change', d: 'Ability beats motivation. Kaizen nudges you to a 2-minute version of every habit so it survives your worst day. (Fogg B=MAP)' },
  { t: 'The log is the magic', d: 'Self-monitoring alone reliably increases follow-through. Every check-in gives you an immediate, satisfying reward signal.' },
  { t: 'If-then plans', d: 'Implementation intentions roughly double follow-through. Kaizen turns each goal into an "If X, then I will Y" plan you write yourself.' },
  { t: 'Kill distraction', d: 'Distraction is an emotion, not a phone. Log feelings and overthinking, then use the 10-minute rule to surf the urge.' },
  { t: 'Never miss twice', d: 'A missed day is not failure. Habits take ~66 days to automate. Kaizen is forgiving by design.' },
  { t: 'Honest AI coaching', d: 'A weekly AI review tells you what went well, what did not, why (diagnosed with B=MAP), and 3 tiny next steps.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2"><Logo /><span className="font-extrabold text-lg">Kaizen</span></div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/faq" className="hidden sm:inline text-ink-600 hover:text-ink-900">FAQ</Link>
          <Link href="/guide" className="hidden sm:inline text-ink-600 hover:text-ink-900">Guide</Link>
          <Link href="/login" className="text-ink-700 hover:text-ink-900 font-medium">Log in</Link>
          <Link href="/signup" className="btn-primary">Start free</Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 text-center">
        <span className="chip bg-brand-100 text-brand-800 mb-5">Get 1% better, every day</span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-900">
          Your personal <span className="text-brand-600">performance OS</span>.
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-ink-600">
          Track your day, build habits that stick, quiet the noise in your head, and get an honest AI review every week — all built on the actual science of behavior change.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary text-base px-6 py-3">Start your 3-day free trial</Link>
          <Link href="/guide" className="btn-ghost text-base px-6 py-3">See how it works</Link>
        </div>
        <p className="mt-3 text-xs text-ink-500">No card to start. Then just ₹49/month or ₹499/year.</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map((p) => (
            <div key={p.t} className="card p-5">
              <h3 className="font-bold text-ink-900">{p.t}</h3>
              <p className="mt-2 text-sm text-ink-600">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6 flex flex-col">
            <h3 className="font-bold text-lg">Monthly</h3>
            <p className="mt-1 text-3xl font-extrabold">₹49<span className="text-base font-medium text-ink-500">/month</span></p>
            <p className="text-sm text-ink-600 mt-2">Everything in Kaizen. Cancel anytime.</p>
            <Link href="/signup" className="btn-primary mt-4">Start free</Link>
          </div>
          <div className="card p-6 flex flex-col ring-2 ring-brand-500">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Yearly</h3><span className="chip bg-brand-100 text-brand-800">Best value</span></div>
            <p className="mt-1 text-3xl font-extrabold">₹499<span className="text-base font-medium text-ink-500">/year</span></p>
            <p className="text-sm text-ink-600 mt-2">Two months free vs monthly. Same everything.</p>
            <Link href="/signup" className="btn-primary mt-4">Start free</Link>
          </div>
        </div>
        <p className="text-center text-xs text-ink-500 mt-4">Prices are inclusive of all taxes and apply worldwide. UPI and cards supported via Razorpay.</p>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
          <div className="flex items-center gap-2"><Logo className="h-6 w-6" /><span>Kaizen — Get 1% better, every day.</span></div>
          <div className="flex gap-4"><Link href="/faq">FAQ</Link><Link href="/guide">Guide</Link><Link href="/login">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
