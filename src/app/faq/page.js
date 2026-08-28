import PublicHeader from '@/components/PublicHeader';
export const metadata = { title: 'FAQ' };

const FAQS = [
  { q: 'What is Kaizen?', a: 'A science-based performance app. You track your day, build habits, manage goals and todos, log feelings and overthinking, and get an AI review that tells you what to improve — grounded in real behavior-change research.' },
  { q: 'How does the free trial work?', a: 'You get 3 days of full access, no card required. After that, adding and editing data and generating AI reviews are locked until you subscribe. Your existing data stays visible (read-only).' },
  { q: 'How much does it cost?', a: '₹49 per month or ₹499 per year. Prices are inclusive of all taxes and are the same worldwide. Pay by UPI or card via Razorpay.' },
  { q: 'How does the AI review work?', a: 'It reads your last 7 days of check-ins, goals, todos, feelings and overthinking, then writes what went well, what didn\'t, why (diagnosed with the Fogg B=MAP model), and 3 tiny next steps. You can generate up to 2 reviews per day.' },
  { q: 'Is my data private?', a: 'Every request is scoped to your own account, data is served only to you, and we never expose one user\'s data to another. We do not sell your data. The AI review is generated only when you ask for it.' },
  { q: 'Can I customize what I track?', a: 'Yes. Build your own daily form with text, numbers, ratings, yes/no toggles, and choice fields. If you delete a field, your past entries keep their data; the field just stops appearing on new check-ins.' },
  { q: 'What if I miss a day?', a: 'Nothing bad. The research is clear that missing one day does not reset your progress. Kaizen follows the never-miss-twice rule — just show up the next day.' },
  { q: 'Can I install it on my phone?', a: 'Yes. Kaizen is a progressive web app. On Android/desktop you\'ll get an install prompt; on iPhone use Safari\'s Share → Add to Home Screen.' },
  { q: 'I forgot my password.', a: 'Use the reset link on the login page. We email you a new temporary password you can log in with.' },
  { q: 'Can I cancel?', a: 'Yes, anytime, from your Razorpay subscription. You keep access until the end of the paid period.' },
];

export default function FAQ() {
  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="text-3xl font-extrabold">Frequently asked questions</h1>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">{f.q}<span className="text-ink-400 group-open:rotate-45 transition">+</span></summary>
              <p className="mt-2 text-ink-600 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
