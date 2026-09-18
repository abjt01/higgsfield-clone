import Link from 'next/link'

/**
 * An empty state should say what happened, why, and what to do next. A bare
 * "nothing here" leaves the reader unsure whether it is broken.
 */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string
  body: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
      <span aria-hidden className="text-2xl opacity-40">
        ◆
      </span>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="max-w-sm text-xs leading-relaxed text-muted">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="btn btn-lime mt-2"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
