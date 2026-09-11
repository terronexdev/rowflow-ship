import type { Metadata, Viewport } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import AppProviders from '@/components/providers/AppProviders';
import PWARegister from '@/components/providers/PWARegister';
import { COLOR_SCHEME_BOOTSTRAP } from '@/lib/colorScheme';
import { land } from '@/lib/theme';
import './globals.css';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'ROWFlow by Terronex',
  description: 'Map-first right-of-way tracking — part of the Terronex suite with Tractsource',
  keywords: ['ROW', 'right-of-way', 'transmission', 'land management', 'GIS'],
  manifest: '/manifest.webmanifest',
  applicationName: 'ROWFlow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ROWFlow',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: land.snow },
    { media: '(prefers-color-scheme: dark)', color: land.darkBg },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${sourceSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_BOOTSTRAP }} />
        <link rel="icon" href="/favicon-light.svg" type="image/svg+xml" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={sourceSans.className}>
        <AppProviders>
          <PWARegister />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
