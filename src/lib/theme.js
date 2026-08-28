'use client';
import { useSyncExternalStore, useCallback } from 'react';

const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

function getSnapshot() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = theme;
  try { localStorage.setItem('kaizen-theme', theme); } catch {}
  emit();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'dark');
  const toggle = useCallback(() => applyTheme(getSnapshot() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle, setTheme: applyTheme };
}
