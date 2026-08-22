import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppProviders from '@/components/providers/AppProviders';
import PWARegister from '@/components/providers/PWARegister';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ROWFlow by Terronex',
  description: 'Map-first right-of-way tracking — part of the Terronex suite with Tractsource',
  keywords: ['ROW', 'right-of-way', 'transmission', 'land management', 'GIS'],
  manifest: '/manifest.webmanifest',
  applicationName: 'ROWFlow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ROWFlow',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          <PWARegister />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

