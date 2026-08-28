'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const r = await signIn('credentials', { redirect: false, ...form });
    setLoading(false);
    if (r?.error) { setErr('Invalid email or password.'); return; }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold">Welcome back</h1>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Password</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
          </form>
          <div className="mt-4 text-center"><Link href="/forgot-password" className="text-sm text-ink-600 hover:text-ink-900">Forgot password?</Link></div>
        </div>
        <p className="text-center text-sm text-ink-600 mt-4">New here? <Link href="/signup" className="text-brand-700 font-medium">Start free</Link></p>
      </div>
    </main>
  );
}
