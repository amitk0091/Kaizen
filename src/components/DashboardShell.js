'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
import { apiGet } from '@/lib/clientApi';
import { AccessContext } from '@/lib/accessContext';

const NAV = [
  { href: '/dashboard', label: 'Today', icon: '\u2600\ufe0f' },
  { href: '/dashboard/logs', label: 'Logs', icon: '\ud83d\udcc8' },
  { href: '/dashboard/goals', label: 'Goals', icon: '\ud83c\udfaf' },
  { href: '/dashboard/todos', label: 'Todos', icon: '\u2705' },
  { href: '/dashboard/checklists', label: 'Checklists', icon: '\ud83d\uddd2\ufe0f' },
  { href: '/dashboard/feelings', label: 'Feelings', icon: '\ud83d\udc9a' },
  { href: '/dashboard/overthinking', label: 'Overthinking', icon: '\ud83c\udf00' },
  { href: '/dashboard/ai-review', label: 'AI Review', icon: '\u2728' },
  { href: '/dashboard/tracker', label: 'Customize tracker', icon: '\u2699\ufe0f' },
];
const BOTTOM = [NAV[0], NAV[1], NAV[2], NAV[7]];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = useCallback(async () => {
    try { const r = await apiGet('/api/me'); setAccess(r.access); } catch {}
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const trialDaysLeft = access?.trialEnd ? Math.max(0, Math.ceil((new Date(access.trialEnd) - new Date()) / 864e5)) : null;
  const locked = access && !access.canWrite;

  return (
    <AccessContext.Provider value={{ access, refresh }}>
      <div className="min-h-screen md:flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:flex-col md:w-60 border-r border-slate-200 bg-white p-4">
          <Link href="/dashboard" className="flex items-center gap-2 mb-6 px-2"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
          <nav className="flex-1 space-y-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${pathname === n.href ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-slate-50'}`}>
                <span>{n.icon}</span>{n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 space-y-1 text-sm">
            <Link href="/guide" className="block px-3 py-2 rounded-xl text-ink-600 hover:bg-slate-50">Guide</Link>
            <Link href="/faq" className="block px-3 py-2 rounded-xl text-ink-600 hover:bg-slate-50">FAQ</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-3 py-2 rounded-xl text-ink-600 hover:bg-slate-50">Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-20">
            <Link href="/dashboard" className="flex items-center gap-2"><Logo className="h-7 w-7" /><span className="font-extrabold">Kaizen</span></Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost px-3 py-2">Menu</button>
          </header>
          {menuOpen && (
            <div className="md:hidden border-b border-slate-200 bg-white p-2 grid grid-cols-2 gap-1 z-20">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-slate-50">{n.icon} {n.label}</Link>
              ))}
              <Link href="/guide" className="rounded-lg px-3 py-2 text-sm text-ink-600">Guide</Link>
              <Link href="/faq" className="rounded-lg px-3 py-2 text-sm text-ink-600">FAQ</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left rounded-lg px-3 py-2 text-sm text-ink-600">Sign out</button>
            </div>
          )}

          {/* Trial / lock banner */}
          {access && access.subscriptionStatus !== 'active' && (
            <div className={`px-4 py-2.5 text-sm text-center ${locked ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800'}`}>
              {locked
                ? <span>Your free trial has ended. <Link href="/dashboard/subscribe" className="underline font-semibold">Subscribe</Link> to unlock adding, editing, and AI reviews. Your data stays read-only.</span>
                : <span>Free trial: <b>{trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}</b> left. <Link href="/dashboard/subscribe" className="underline font-semibold">Upgrade</Link>.</span>}
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 max-w-4xl w-full mx-auto">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 grid grid-cols-4 pb-safe z-20">
            {BOTTOM.map((n) => (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center py-2 text-xs ${pathname === n.href ? 'text-brand-700' : 'text-ink-500'}`}>
                <span className="text-lg">{n.icon}</span>{n.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </AccessContext.Provider>
  );
}
