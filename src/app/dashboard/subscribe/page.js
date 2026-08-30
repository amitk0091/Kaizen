'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/clientApi';
import { useAccess } from '@/lib/accessContext';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      setTimeout(() => resolve(true), 100);
    };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export default function Subscribe() {
  const { access, refresh } = useAccess();
  const [pricing, setPricing] = useState({ monthly: '49', yearly: '499' });
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { (async () => { const r = await apiGet('/api/me'); setPricing(r.pricing); setMe(r.user); })(); }, []);

  async function subscribe(plan) {
    setBusy(plan); setMsg('');
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load payment gateway.');
      const { subscriptionId, keyId } = await apiSend('/api/razorpay/subscribe', 'POST', { plan });
      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Kaizen',
        description: plan === 'yearly' ? 'Yearly plan' : 'Monthly plan',
        theme: { color: '#059669' },
        prefill: { email: me?.email || '' },
        handler: async (resp) => {
          try {
            await apiSend('/api/razorpay/verify', 'POST', {
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_subscription_id: resp.razorpay_subscription_id,
              razorpay_signature: resp.razorpay_signature,
              plan,
            });
            setMsg('You\'re subscribed! Everything is unlocked. 🎉');
            refresh();
          } catch (e) { setMsg('Payment captured but verification failed. It will reconcile shortly.'); }
        },
        modal: { ondismiss: () => { setBusy(''); } },
      });
      rzp.open();
    } catch (e) { setMsg(e.message); } finally { setBusy(''); }
  }

  const active = access?.subscriptionStatus === 'active';

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Subscription</h1>
      <p className="text-ink-600 text-sm mt-1">{active ? 'You have an active subscription. Thank you!' : 'Unlock unlimited tracking, editing, and AI reviews. UPI and cards supported.'}</p>
      {msg && <p className="text-sm text-brand-700 mt-3">{msg}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div className="card p-6">
          <h3 className="font-bold text-lg">Monthly</h3>
          <p className="mt-1 text-3xl font-extrabold">₹{pricing.monthly}<span className="text-base font-medium text-ink-500">/month</span></p>
          <p className="text-sm text-ink-600 mt-2">Full access. Cancel anytime.</p>
          <button className="btn-primary w-full mt-4" disabled={busy || active} onClick={() => subscribe('monthly')}>{busy === 'monthly' ? 'Starting…' : 'Choose monthly'}</button>
        </div>
        <div className="card p-6 ring-2 ring-brand-500">
          <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Yearly</h3><span className="chip bg-brand-100 text-brand-800">Best value</span></div>
          <p className="mt-1 text-3xl font-extrabold">₹{pricing.yearly}<span className="text-base font-medium text-ink-500">/year</span></p>
          <p className="text-sm text-ink-600 mt-2">Two months free vs monthly.</p>
          <button className="btn-primary w-full mt-4" disabled={busy || active} onClick={() => subscribe('yearly')}>{busy === 'yearly' ? 'Starting…' : 'Choose yearly'}</button>
        </div>
      </div>
      <p className="text-xs text-ink-500 mt-4">Prices are inclusive of all taxes and are the same worldwide.</p>
    </div>
  );
}
