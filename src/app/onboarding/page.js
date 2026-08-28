'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { apiSend } from '@/lib/clientApi';

const QUESTIONS = [
  { k: 'becoming', q: 'Who do you want to become?', ph: 'e.g. a focused, healthy builder' },
  { k: 'goal', q: 'What is your #1 goal right now?', ph: 'e.g. ship my side project' },
  { k: 'distraction', q: 'What usually derails your day?', ph: 'e.g. Instagram after lunch' },
  { k: 'focusTime', q: 'When do you feel most focused?', ph: 'e.g. early morning' },
  { k: 'greatDay', q: 'What does a great day look like?', ph: 'e.g. deep work + a workout + no doomscrolling' },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const cur = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  async function finish() {
    setSaving(true);
    try {
      await apiSend('/api/onboarding', 'POST', { identityStatement: answers.becoming || '', answers });
      router.push('/dashboard');
    } catch (e) {
      // If trial somehow expired, still move on.
      router.push('/dashboard');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6"><Logo /><span className="font-extrabold text-lg">Kaizen</span></div>
        <div className="card p-6">
          <p className="text-xs text-ink-500">Step {step + 1} of {QUESTIONS.length}</p>
          <div className="h-1.5 bg-slate-100 rounded-full mt-2 mb-5"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></div>
          <h1 className="text-xl font-bold">{cur.q}</h1>
          <textarea className="input mt-4 min-h-[90px]" placeholder={cur.ph} value={answers[cur.k] || ''} onChange={(e) => setAnswers({ ...answers, [cur.k]: e.target.value })} />
          <div className="mt-5 flex justify-between">
            <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {isLast
              ? <button className="btn-primary" disabled={saving} onClick={finish}>{saving ? 'Saving…' : 'Finish & start'}</button>
              : <button className="btn-primary" onClick={() => setStep(step + 1)}>Next</button>}
          </div>
          <button onClick={finish} className="mt-4 w-full text-center text-xs text-ink-500 hover:text-ink-700">Skip for now</button>
        </div>
      </div>
    </main>
  );
}
