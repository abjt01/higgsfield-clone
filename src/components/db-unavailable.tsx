/**
 * Shown when a page's primary data cannot be read. Distinct from an empty
 * state: "nothing here yet" and "we could not look" are different facts and
 * conflating them makes an outage look like a working, empty product.
 */
export function DbUnavailable({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
      <span aria-hidden className="text-2xl opacity-40">
        ⚠
      </span>
      <h2 className="text-sm font-medium">Cannot load {what} right now</h2>
      <p className="max-w-sm text-xs leading-relaxed text-muted">
        The database is not reachable. Nothing has been lost — this is a read
        failure, not a data loss. Try again in a moment.
      </p>
    </div>
  )
}
