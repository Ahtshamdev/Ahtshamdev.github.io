import type { Metadata, Viewport } from 'next';
import { Newsreader } from 'next/font/google';
import BagProvider from '@/components/bag/BagProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/site';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Loom & Field · Handwoven kilim rugs from Multan',
    template: '%s · Loom & Field',
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: 'Loom & Field · Handwoven kilim rugs from Multan',
    description: SITE.description,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary',
    title: 'Loom & Field · Handwoven kilim rugs from Multan',
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#2a211b',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <BagProvider>
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </BagProvider>
      </body>
    </html>
  );
}
