import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import type { AdminTransaction, TransactionEvent, PaginationMeta } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'

type TxnStatus = 'pending' | 'success' | 'failed' | 'refunded'
type TxnView = 'orders' | 'events'

const TXN_STATUS_OPTS: TxnStatus[] = ['pending', 'success', 'failed', 'refunded']
const TXN_STATUS_TONE: Record<TxnStatus, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
  refunded: 'neutral',
}

const EVENT_OPTS = [
  'wallet_topup_initiated',
  'wallet_topup_success',
  'wallet_topup_failed',
  'booking_payment_deducted',
  'booking_refund_issued',
  'astrologer_payout_initiated',
  'astrologer_payout_completed',
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtPrice(amount: string | number | null | undefined, currency = 'INR') {
  if (amount === null || amount === undefined) return '—'
  const sym = currency === 'INR' ? '₹' : currency
  return `${sym}${Number(amount).toLocaleString('en-IN')}`
}

function short(id: string | null | undefined) {
  if (!id) return '—'
  return id.slice(0, 8) + '…'
}

// ─── Orders tab ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 1)
  const status = (searchParams.get('status') as TxnStatus | null) ?? undefined
  const userId = searchParams.get('userId') ?? undefined
  const astrologerId = searchParams.get('astrologerId') ?? undefined

  const [txns, setTxns] = useState<AdminTransaction[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi
      .listTransactions({ status, userId, astrologerId, page })
      .then((res) => {
        setTxns(res.transactions)
        setMeta(res.pagination)
        setError(null)
      })
      .catch(() => setError('Transactions load nahi hue.'))
      .finally(() => setLoading(false))
  }, [status, userId, astrologerId, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Status</label>
          <select
            value={status ?? ''}
            onChange={(e) => updateParam('status', e.target.value || undefined)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          >
            <option value="">All statuses</option>
            {TXN_STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">User ID</label>
          <input
            type="text"
            placeholder="UUID…"
            defaultValue={userId ?? ''}
            onBlur={(e) => updateParam('userId', e.target.value || undefined)}
            className="w-44 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Astrologer ID</label>
          <input
            type="text"
            placeholder="UUID…"
            defaultValue={astrologerId ?? ''}
            onBlur={(e) => updateParam('astrologerId', e.target.value || undefined)}
            className="w-44 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>
        {meta && (
          <span className="ml-auto text-sm text-text-faint">{meta.total.toLocaleString()} orders</span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Razorpay Order</th>
              <th className="px-4 py-3 font-medium">Appointment</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-faint">Loading…</td>
              </tr>
            ) : txns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-faint">No transactions found.</td>
              </tr>
            ) : (
              txns.map((t) => (
                <tr key={t.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-text">{t.razorpayOrderId ?? '—'}</p>
                    <p className="font-mono text-xs text-text-faint">{short(t.id)}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {short(t.appointmentId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{short(t.userId)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {short(t.astrologerId)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {fmtPrice(t.amount, t.currency ?? 'INR')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TXN_STATUS_TONE[t.status as TxnStatus] ?? 'neutral'}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-faint whitespace-nowrap">
                    {fmt(t.createdAt)}
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

// ─── Events tab ──────────────────────────────────────────────────────────────

function EventsTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 1)
  const event = searchParams.get('event') ?? undefined
  const userId = searchParams.get('userId') ?? undefined
  const astrologerId = searchParams.get('astrologerId') ?? undefined
  const appointmentId = searchParams.get('appointmentId') ?? undefined

  const [events, setEvents] = useState<TransactionEvent[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi
      .listTransactionEvents({ event, userId, astrologerId, appointmentId, page })
      .then((res) => {
        setEvents(res.events)
        setMeta(res.pagination)
        setError(null)
      })
      .catch(() => setError('Events load nahi hue.'))
      .finally(() => setLoading(false))
  }, [event, userId, astrologerId, appointmentId, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Event</label>
          <select
            value={event ?? ''}
            onChange={(e) => updateParam('event', e.target.value || undefined)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          >
            <option value="">All events</option>
            {EVENT_OPTS.map((ev) => (
              <option key={ev} value={ev}>
                {ev.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">User ID</label>
          <input
            type="text"
            placeholder="UUID…"
            defaultValue={userId ?? ''}
            onBlur={(e) => updateParam('userId', e.target.value || undefined)}
            className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Appointment ID
          </label>
          <input
            type="text"
            placeholder="UUID…"
            defaultValue={appointmentId ?? ''}
            onBlur={(e) => updateParam('appointmentId', e.target.value || undefined)}
            className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>
        {meta && (
          <span className="ml-auto text-sm text-text-faint">{meta.total.toLocaleString()} events</span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium">Appointment</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">Loading…</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">No events found.</td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                      {ev.event.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{short(ev.userId)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {short(ev.astrologerId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {short(ev.appointmentId)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {ev.amount ? fmtPrice(ev.amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-faint whitespace-nowrap">
                    {fmt(ev.createdAt)}
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

// ─── Main page ───────────────────────────────────────────────────────────────

export function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as TxnView) ?? 'orders'

  const switchTab = (tab: TxnView) => {
    // Reset all filters when switching tabs
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-alt p-1 w-fit">
        {(['orders', 'events'] as TxnView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'orders' ? <OrdersTab /> : <EventsTab />}
    </div>
  )
}
