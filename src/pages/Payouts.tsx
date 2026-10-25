import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import type {
  AstrologerEarningRow,
  PayoutRecord,
  RevenueTotals,
  PaginationMeta,
} from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(val: string | number | null | undefined) {
  if (val === null || val === undefined) return '—'
  return `₹${Number(val).toLocaleString('en-IN')}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${accent ? 'border-accent/30 bg-accent-soft' : 'border-border bg-surface'}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
    </div>
  )
}

// ─── Payouts tab (monthly astrologer payouts) ─────────────────────────────────

function PayoutsTab() {
  const [month, setMonth] = useState(currentMonth())
  const [page, setPage] = useState(1)
  const [confirming, setConfirming] = useState<string | null>(null) // astrologerId being confirmed
  const [paying, setPaying] = useState<string | null>(null)

  const [rows, setRows] = useState<AstrologerEarningRow[]>([])
  const [paidMap, setPaidMap] = useState<Record<string, PayoutRecord | null>>({})
  const [totals, setTotals] = useState<RevenueTotals | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Derive start/end from month
  const dateFrom = `${month}-01`
  const dateToObj = new Date(
    Number(month.split('-')[0]),
    Number(month.split('-')[1]),
    0,
  )
  const dateTo = `${month}-${String(dateToObj.getDate()).padStart(2, '0')}`

  const load = () => {
    setLoading(true)
    Promise.all([
      adminApi.getEarnings({ dateFrom, dateTo, page }),
      adminApi.listPayoutRecords(month),
    ])
      .then(([earningsRes, payoutsRes]) => {
        setRows(earningsRes.summary)
        setTotals(earningsRes.totals)
        setMeta(earningsRes.meta)
        // Build paid map keyed by astrologer_id
        const map: Record<string, PayoutRecord | null> = {}
        for (const r of earningsRes.summary) {
          map[r.astrologer_id] =
            payoutsRes.records.find((p) => p.astrologerId === r.astrologer_id) ?? null
        }
        setPaidMap(map)
        setError(null)
      })
      .catch(() => setError('Data load nahi hua.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [month, page])

  const handleMarkPaid = async (astrologerId: string, amount: string) => {
    setPaying(astrologerId)
    try {
      const record = await adminApi.markPayoutPaid(astrologerId, month, amount)
      setPaidMap((prev) => ({ ...prev, [astrologerId]: record }))
    } catch {
      alert('Mark as paid fail hua. Dobara try karo.')
    } finally {
      setPaying(null)
      setConfirming(null)
    }
  }

  // Summary: total paid vs remaining
  const totalPayout = rows.reduce((s, r) => s + Number(r.astrologer_payout ?? 0), 0)
  const totalPaid = rows.reduce(
    (s, r) => s + (paidMap[r.astrologer_id] ? Number(r.astrologer_payout ?? 0) : 0),
    0,
  )
  const totalPending = totalPayout - totalPaid

  return (
    <div className="space-y-5">
      {/* Month picker + summary */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>
        <p className="pb-2 text-sm font-medium text-text">{monthLabel(month)}</p>
        {meta && (
          <span className="ml-auto pb-2 text-sm text-text-faint">
            {meta.total.toLocaleString()} astrologers
          </span>
        )}
      </div>

      {/* Summary cards */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total to pay" value={fmtPrice(totalPayout)} />
          <StatCard label="Remaining" value={fmtPrice(totalPending)} accent={totalPending > 0} />
          <StatCard label="Paid out" value={fmtPrice(totalPaid)} />
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total sessions" value={totals.totalSessions.toLocaleString('en-IN')} />
          <StatCard label="Gross GMV" value={fmtPrice(totals.grossRevenue)} />
          <StatCard label="Platform revenue" value={fmtPrice(totals.platformRevenue)} />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium text-right">Sessions</th>
              <th className="px-4 py-3 font-medium text-right">Gross</th>
              <th className="px-4 py-3 font-medium text-right">Commission</th>
              <th className="px-4 py-3 font-medium text-right">Platform cut</th>
              <th className="px-4 py-3 font-medium text-right">Net payout</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-faint">
                  Is month mein koi sessions nahi.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const paidRecord = paidMap[row.astrologer_id]
                const isPaid = !!paidRecord
                const isConfirming = confirming === row.astrologer_id
                const isPaying = paying === row.astrologer_id

                return (
                  <tr key={row.astrologer_id} className="hover:bg-surface-alt/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{row.astrologer_name ?? '—'}</p>
                      <p className="font-mono text-xs text-text-faint">
                        {row.astrologer_id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {Number(row.total_sessions).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-text">
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
                    <td className="px-4 py-3">
                      {isPaid ? (
                        <div>
                          <Badge tone="success">Paid</Badge>
                          <p className="mt-0.5 text-xs text-text-faint">
                            {fmtDate(paidRecord!.paidAt)}
                          </p>
                        </div>
                      ) : (
                        <Badge tone="pending">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isPaid ? (
                        <span className="text-xs text-text-faint">—</span>
                      ) : isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isPaying}
                            onClick={() => handleMarkPaid(row.astrologer_id, row.astrologer_payout)}
                            className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-60"
                          >
                            {isPaying ? 'Saving…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirming(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-alt"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirming(row.astrologer_id)}
                          className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
      )}
    </div>
  )
}

// ─── Payout history tab ────────────────────────────────────────────────────────

function HistoryTab() {
  const [page, setPage] = useState(1)
  const [astrologerInput, setAstrologerInput] = useState('')
  const [astrologerId, setAstrologerId] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  const [records, setRecords] = useState<PayoutRecord[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    adminApi
      .listPayoutHistory({ astrologerId: astrologerId || undefined, month: monthFilter || undefined, page })
      .then((res) => {
        setRecords(res.records)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('History load nahi hui.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [astrologerId, monthFilter, page])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Astrologer ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="UUID…"
              value={astrologerInput}
              onChange={(e) => setAstrologerInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setAstrologerId(astrologerInput); setPage(1) } }}
              className="w-52 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => { setAstrologerId(astrologerInput); setPage(1) }}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Filter
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Month</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>
        {(astrologerId || monthFilter) && (
          <button
            onClick={() => { setAstrologerId(''); setAstrologerInput(''); setMonthFilter(''); setPage(1) }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt"
          >
            Clear
          </button>
        )}
        {meta && <span className="ml-auto text-sm text-text-faint">{meta.total} records</span>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium text-right">Amount Paid</th>
              <th className="px-4 py-3 font-medium">Paid At</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-faint">Loading…</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-faint">
                  Koi payout history nahi mili.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{r.astrologerName ?? '—'}</p>
                    <p className="font-mono text-xs text-text-faint">{r.astrologerId.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{monthLabel(r.month)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">{fmtPrice(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-text-faint whitespace-nowrap">
                    {fmtDate(r.paidAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{r.notes ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
      )}
    </div>
  )
}

// ─── User payments tab ─────────────────────────────────────────────────────────

function UserPaymentsTab() {
  const [userId, setUserId] = useState('')
  const [userInput, setUserInput] = useState('')
  const [page, setPage] = useState(1)

  const [summary, setSummary] = useState<{
    totalPaid: string
    totalSessions: number
    totalRefunded: string
  } | null>(null)
  const [transactions, setTransactions] = useState<
    Array<{
      id: string
      razorpayOrderId: string | null
      appointmentId: string | null
      amount: string | null
      currency: string | null
      status: string
      createdAt: string
    }>
  >([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = () => {
    if (!userInput.trim()) return
    setUserId(userInput.trim())
    setPage(1)
  }

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      adminApi.getUserPaymentSummary(userId),
      adminApi.listTransactions({ userId, page }),
    ])
      .then(([sum, txnRes]) => {
        setSummary(sum)
        setTransactions(txnRes.transactions)
        setMeta(txnRes.pagination)
        setError(null)
      })
      .catch(() => setError('User transactions load nahi hue.'))
      .finally(() => setLoading(false))
  }, [userId, page])

  return (
    <div className="space-y-4">
      {/* User ID input */}
      <div className="flex flex-col gap-1 max-w-lg">
        <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
          User ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="User UUID…"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
          <button
            onClick={search}
            disabled={!userInput.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            Look up
          </button>
        </div>
        <p className="text-xs text-text-faint mt-0.5">
          Users page se user ID copy karo (UUID format)
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total paid" value={`₹${Number(summary.totalPaid).toLocaleString('en-IN')}`} accent />
          <StatCard label="Total sessions" value={summary.totalSessions.toLocaleString('en-IN')} />
          <StatCard label="Total refunded" value={`₹${Number(summary.totalRefunded).toLocaleString('en-IN')}`} />
        </div>
      )}

      {/* Transactions */}
      {userId && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Appointment</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-faint">Loading…</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-faint">
                    Koi transactions nahi mili.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-alt/60">
                    <td className="px-4 py-3 font-mono text-xs text-text">
                      {t.razorpayOrderId ?? t.id.slice(0, 8) + '…'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {t.appointmentId ? t.appointmentId.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">
                      {t.amount ? `₹${Number(t.amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          t.status === 'success'
                            ? 'success'
                            : t.status === 'failed'
                              ? 'danger'
                              : t.status === 'refunded'
                                ? 'neutral'
                                : 'pending'
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-faint whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type PayoutView = 'monthly' | 'history' | 'user-payments'

export function Payouts() {
  const [tab, setTab] = useState<PayoutView>('monthly')

  const TABS: { id: PayoutView; label: string }[] = [
    { id: 'monthly', label: 'Monthly Payouts' },
    { id: 'history', label: 'Payout History' },
    { id: 'user-payments', label: 'User Payments' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Payments & Payouts</h1>
        <p className="mt-0.5 text-xs text-text-faint">
          Monthly astrologer payouts manage karo, history dekho, aur per-user payment history check karo
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-alt p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'monthly' && <PayoutsTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'user-payments' && <UserPaymentsTab />}
    </div>
  )
}
