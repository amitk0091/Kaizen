'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { apiSend } from '@/lib/clientApi';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      const r = await apiSend('/api/auth/reset-password', 'POST', { email });
      setMsg(r.message || 'If that email exists, a new password has been emailed to you.');
    } catch { setMsg('Something went wrong. Please try again.'); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold">Reset password</h1>
          <p className="text-sm text-ink-600 mt-1">We'll email you a new temporary password you can log in with.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {msg && <p className="text-sm text-brand-700">{msg}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending…' : 'Email me a new password'}</button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-600 mt-4"><Link href="/login" className="text-brand-700 font-medium">Back to log in</Link></p>
      </div>
    </main>
  );
}
