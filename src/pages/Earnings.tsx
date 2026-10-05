import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import type { AstrologerEarningRow, RevenueTotals, PaginationMeta } from '@/lib/types'
import { Pagination } from '@/components/Pagination'

function fmtPrice(val: string | number | null | undefined) {
  if (val === null || val === undefined) return '—'
  return `₹${Number(val).toLocaleString('en-IN')}`
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
    </div>
  )
}

export function Earnings() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const astrologerId = searchParams.get('astrologerId') ?? undefined
  const dateFrom = searchParams.get('dateFrom') ?? undefined
  const dateTo = searchParams.get('dateTo') ?? undefined

  const [dateFromInput, setDateFromInput] = useState(dateFrom ?? '')
  const [dateToInput, setDateToInput] = useState(dateTo ?? '')
  const [astrologerInput, setAstrologerInput] = useState(astrologerId ?? '')

  const [rows, setRows] = useState<AstrologerEarningRow[]>([])
  const [totals, setTotals] = useState<RevenueTotals | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    adminApi
      .getEarnings({ astrologerId, dateFrom, dateTo, page })
      .then((res) => {
        setRows(res.summary)
        setTotals(res.totals)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Earnings load nahi hue.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [astrologerId, dateFrom, dateTo, page])

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)
    if (dateFromInput) next.set('dateFrom', dateFromInput)
    else next.delete('dateFrom')
    if (dateToInput) next.set('dateTo', dateToInput)
    else next.delete('dateTo')
    if (astrologerInput) next.set('astrologerId', astrologerInput)
    else next.delete('astrologerId')
    next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDateFromInput('')
    setDateToInput('')
    setAstrologerInput('')
    const next = new URLSearchParams()
    setSearchParams(next)
  }

  const hasFilters = !!(dateFrom || dateTo || astrologerId)

  return (
    <div className="space-y-5">
      {/* ── Summary cards ── */}
      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Sessions" value={totals.totalSessions.toLocaleString('en-IN')} />
          <StatCard label="Gross GMV" value={fmtPrice(totals.grossRevenue)} />
          <StatCard label="Platform Revenue" value={fmtPrice(totals.platformRevenue)} />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">From</label>
          <input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">To</label>
          <input
            type="date"
            value={dateToInput}
            onChange={(e) => setDateToInput(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Astrologer ID
          </label>
          <input
            type="text"
            placeholder="UUID…"
            value={astrologerInput}
            onChange={(e) => setAstrologerInput(e.target.value)}
            className="w-52 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
            >
              Clear
            </button>
          )}
        </div>
        {meta && (
          <span className="ml-auto text-sm text-text-faint">
            {meta.total.toLocaleString()} astrologers
          </span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium text-right">Sessions</th>
              <th className="px-4 py-3 font-medium text-right">Gross Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Commission %</th>
              <th className="px-4 py-3 font-medium text-right">Platform Cut</th>
              <th className="px-4 py-3 font-medium text-right">Astrologer Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  No earnings data found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.astrologer_id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{row.astrologer_name}</p>
                    <p className="font-mono text-xs text-text-faint">{row.astrologer_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {Number(row.total_sessions).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {fmtPrice(row.gross_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {Number(row.commission_pct ?? 30).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {fmtPrice(row.platform_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">
                    {fmtPrice(row.astrologer_payout)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPage={(p) => {
            const next = new URLSearchParams(searchParams)
            next.set('page', String(p))
            setSearchParams(next)
          }}
        />
      )}
    </div>
  )
}
