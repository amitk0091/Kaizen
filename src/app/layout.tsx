import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaizen — Personal Growth OS",
  description: "Think clearly. Grow daily.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kaizen" },
};
export const viewport: Viewport = {
  themeColor: "#128a63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('kaizen-theme'));if(s)document.documentElement.setAttribute('data-theme',s);}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
