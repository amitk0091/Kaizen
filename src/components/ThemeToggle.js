'use client';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-surface text-ink-700 hover:bg-slate-100 transition ${className}`}
    >
      <span className="text-base leading-none">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
}
