import webpush from 'web-push';

let configured = false;
export function pushConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@kaizen.app', pub, priv);
  configured = true;
  return true;
}

// Sends to every subscription; returns endpoints that are gone (404/410) so callers can prune them.
export async function sendToSubscriptions(subscriptions, payload) {
  if (!pushConfigured()) throw new Error('VAPID keys missing');
  const body = JSON.stringify(payload);
  const dead = [];
  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, body, { TTL: 60 * 60 });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(sub.endpoint);
      else console.error('Push send failed:', e.statusCode, e.body || e.message);
    }
  }));
  return dead;
}
