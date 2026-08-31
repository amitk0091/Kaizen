import './globals.css';
import Providers from './providers';
import ServiceWorker from '@/components/ServiceWorker';

export const metadata = {
  title: { default: 'Kaizen — Get 1% better, every day', template: '%s · Kaizen' },
  description: 'A science-based human performance OS. Track your day, build habits, kill distraction, and get personalized AI weekly reviews.',
  applicationName: 'Kaizen',
  appleWebApp: { capable: true, title: 'Kaizen', statusBarStyle: 'black-translucent' },
  icons: {
    apple: '/icons/apple-touch-icon.png',
    icon: '/icons/favicon.ico',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
    { media: '(prefers-color-scheme: light)', color: '#059669' },
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  userScalable: true,
};

const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('kaizen-theme');
      const isDark = theme === 'light' ? false : true;
      const html = document.documentElement;
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      html.style.colorScheme = isDark ? 'dark' : 'light';
    } catch (e) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
