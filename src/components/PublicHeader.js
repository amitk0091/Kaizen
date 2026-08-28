'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Logo from '@/components/Logo';

export default function PublicHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/faq" className="text-ink-600 hover:text-ink-900">FAQ</Link>
        <Link href="/guide" className="text-ink-600 hover:text-ink-900">Guide</Link>

        {status === 'loading' ? (
          <span className="text-ink-600">…</span>
        ) : session?.user ? (
          <>
            <Link href="/dashboard" className="text-ink-700 hover:text-ink-900 font-medium">Dashboard</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-ink-600 hover:text-ink-900">Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-ink-700 hover:text-ink-900 font-medium">Log in</Link>
            <Link href="/signup" className="btn-primary">Start free</Link>
          </>
        )}
      </nav>
    </header>
  );
}
