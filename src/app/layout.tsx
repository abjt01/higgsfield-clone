import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'

import { CreditsBadge } from '@/components/credits-badge'

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur">
          <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              higgsfield<span className="text-accent">.clone</span>
            </Link>
            <Link href="/create" className="text-sm text-muted transition hover:text-fg">
              Create
            </Link>
            <Link href="/feed" className="text-sm text-muted transition hover:text-fg">
              Community
            </Link>
            <Link href="/library" className="text-sm text-muted transition hover:text-fg">
              Library
            </Link>
            <Link href="/pricing" className="text-sm text-muted transition hover:text-fg">
              Pricing
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <CreditsBadge />
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
