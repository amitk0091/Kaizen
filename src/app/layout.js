import './globals.css';
import Providers from './providers';
import ServiceWorker from '@/components/ServiceWorker';

export const metadata = {
  title: { default: 'Kaizen — Get 1% better, every day', template: '%s · Kaizen' },
  description: 'A science-based human performance OS. Track your day, build habits, kill distraction, and get personalized AI weekly reviews.',
  applicationName: 'Kaizen',
  appleWebApp: { capable: true, title: 'Kaizen', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
    { media: '(prefers-color-scheme: light)', color: '#059669' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const themeInit = `(function(){try{var t=localStorage.getItem('kaizen-theme');if(t!=='light'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kaizen" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
