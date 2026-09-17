import Link from 'next/link'

import { PricingTable } from '@/components/pricing-table'
import { CREDIT_COST, PLANS } from '@/lib/plans'
import { readUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing · Higgsfield clone',
  description: 'Credits, plans and what each action actually costs.',
}

export default async function PricingPage() {
  const user = await readUser()

  return (
    <main className="mx-auto max-w-[80rem] px-4 py-14 sm:px-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find the best plan for you
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          One credit per generation. Clips render in your browser, so they are free.
        </p>

        {user && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs">
            <span className="text-accent">◆</span>
            You have <strong className="font-semibold tabular-nums">{user.credits}</strong>{' '}
            credits left
          </p>
        )}
      </header>

      <PricingTable plans={PLANS} />

      {/* ------------------------------------------------ what costs what */}
      <section className="mt-16">
        <h2 className="text-lg font-semibold tracking-tight">What a credit buys</h2>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {CREDIT_COST.map((row, i) => (
                <tr key={row.label} className={i > 0 ? 'border-t border-line' : ''}>
                  <td className="bg-surface px-4 py-3 font-medium">{row.label}</td>
                  <td className="bg-surface px-4 py-3 tabular-nums text-accent">
                    {row.credits === 0 ? 'Free' : `${row.credits} credit`}
                  </td>
                  <td className="bg-surface px-4 py-3 text-xs text-muted">{row.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------ honesty */}
      <section className="mt-10 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">Billing is deliberately not built</h2>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">
          These plans are presentational. There is no checkout, no card capture and no
          payment provider wired up, because taking real money was out of scope. The credit
          balance on the Free tier is real, though — it decrements on every generation, is
          refunded when one fails, and is enforced server side.
        </p>
        <Link
          href="/create"
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-dim"
        >
          Use your free credits
        </Link>
      </section>
    </main>
  )
}
