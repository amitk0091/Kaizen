import './globals.css';
import Providers from './providers';
import ServiceWorker from '@/components/ServiceWorker';

export const metadata = {
  title: { default: 'Kaizen — Get 1% better, every day', template: '%s · Kaizen' },
  description: 'A science-based human performance OS. Track your day, build habits, kill distraction, and get personalized AI weekly reviews.',
  manifest: '/manifest.json',
  applicationName: 'Kaizen',
  appleWebApp: { capable: true, title: 'Kaizen', statusBarStyle: 'default' },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
