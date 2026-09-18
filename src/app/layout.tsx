import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ANNOUNCEMENT_SCRIPT, AnnouncementBar } from '@/components/announcement-bar'
import { SiteNav } from '@/components/site-nav'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Higgsfield clone',
  description: 'Prompt plus preset to image, with a provider fallback that cannot go dark.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Before paint: hides a previously dismissed bar without a shift. */}
        <script dangerouslySetInnerHTML={{ __html: ANNOUNCEMENT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Keyboard users should not have to tab the whole nav on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>

        <AnnouncementBar />
        <SiteNav />

        <div id="main">
          {children}
        </div>
      </body>
    </html>
  )
}
