'use client'

import { useState } from 'react'

import type { Plan } from '@/lib/plans'

export function PricingTable({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(true)

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-xs ${annual ? 'text-muted' : 'text-fg'}`}>Monthly</span>

        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Bill annually"
          onClick={() => setAnnual((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition ${annual ? 'bg-accent' : 'bg-surface-3'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${
              annual ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>

        <span className={`text-xs ${annual ? 'text-fg' : 'text-muted'}`}>Annual</span>
        <span className="rounded-full bg-hot-bg px-2 py-0.5 text-[10px] font-semibold text-white">
          20% OFF
        </span>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = annual ? plan.annual : plan.monthly

          return (
            <section
              key={plan.id}
              className={`flex flex-col rounded-[var(--radius-card)] border p-6 ${
                plan.highlight ? 'border-accent bg-accent/[0.04]' : 'border-line bg-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold uppercase tracking-tight">{plan.name}</h2>
                {plan.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      plan.highlight ? 'bg-accent text-black' : 'bg-hot-bg text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs text-muted">{plan.blurb}</p>

              <div className="mt-5 flex items-baseline gap-2">
                {annual && plan.monthly > 0 && (
                  <span className="text-sm text-muted line-through tabular-nums">${plan.monthly}</span>
                )}
                <span className="text-3xl font-semibold tabular-nums">${price}</span>
                <span className="text-xs text-muted">
                  {price === 0 ? 'forever' : annual ? '/mo, billed annually' : '/mo'}
                </span>
              </div>

              <p className="mt-1 text-xs text-accent tabular-nums">
                {plan.credits.toLocaleString()} credits{plan.id === 'free' ? '' : ' / month'}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className={`flex items-start gap-2 text-xs ${f.included ? '' : 'text-muted-dim line-through decoration-muted-dim/50'}`}
                  >
                    <span className={f.included ? 'text-accent' : 'text-muted-dim'} aria-hidden>
                      {f.included ? '✓' : '×'}
                    </span>
                    {/* Say it, do not only colour it. */}
                    <span className="sr-only">{f.included ? 'Included:' : 'Not included:'}</span>
                    {f.label}
                  </li>
                ))}
              </ul>

              {/* Outlined rather than a faded fill: opacity on the lime turned
                  the page's focal point olive. Still clearly inert. */}
              <button
                type="button"
                disabled
                title="Billing is not implemented — see the note below"
                className={`btn mt-6 cursor-not-allowed justify-center ${
                  plan.highlight ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-muted'
                }`}
              >
                {plan.id === 'free' ? 'Your current plan' : `Get ${plan.name}`}
              </button>

              {plan.id !== 'free' && (
                <p className="mt-2 text-center text-[10px] text-muted">Checkout not implemented</p>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
