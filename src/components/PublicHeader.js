import Link from 'next/link';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
export default function PublicHeader() {
  return (
    <header className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2"><Logo /><span className="font-extrabold text-lg">Kaizen</span></Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/faq" className="text-ink-600 hover:text-ink-900">FAQ</Link>
        <Link href="/guide" className="text-ink-600 hover:text-ink-900">Guide</Link>
        <Link href="/login" className="text-ink-700 font-medium">Log in</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
