'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { apiSend } from '@/lib/clientApi';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await apiSend('/api/auth/signup', 'POST', form);
      const r = await signIn('credentials', { redirect: false, email: form.email, password: form.password });
      if (r?.error) throw new Error('Signed up, but auto-login failed. Please log in.');
      // Wait a tick to ensure session is established before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/onboarding');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold">Start your 3-day free trial</h1>
          <p className="text-sm text-ink-600 mt-1">Full access. No card required to begin.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label className="label">Name (optional)</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-600 mt-4">Already have an account? <Link href="/login" className="text-brand-700 font-medium">Log in</Link></p>
      </div>
    </main>
  );
}
