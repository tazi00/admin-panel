export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total?: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) return null

  // Build a compact page-number window: always show first, last, current ±1
  const pages: (number | '…')[] = []
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n)
  }
  add(1)
  if (page > 3) pages.push('…')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
  if (page < totalPages - 2) pages.push('…')
  add(totalPages)

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-text-faint">
        {total !== undefined && <>{total.toLocaleString()} total · </>}
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary disabled:opacity-30 enabled:hover:bg-surface-alt"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-text-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`min-w-[28px] rounded-md border px-2 py-1 text-xs transition-colors ${
                p === page
                  ? 'border-accent bg-accent text-white'
                  : 'border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary disabled:opacity-30 enabled:hover:bg-surface-alt"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
