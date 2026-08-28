'use client';
import { useEffect } from 'react';
export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw', { scope: '/' })
        .then((reg) => {
          console.log('✅ Service Worker registered:', reg);
          if (reg.installing) {
            console.log('📦 Installing service worker...');
          }
        })
        .catch((err) => console.error('❌ SW registration failed:', err));
    }
  }, []);
  return null;
}
