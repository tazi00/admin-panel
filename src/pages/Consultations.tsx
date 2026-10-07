import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import type { AdminAppointment, PaginationMeta } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'

const STATUS_OPTS = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'] as const
type AptStatus = (typeof STATUS_OPTS)[number]

const STATUS_TONE: Record<AptStatus, 'neutral' | 'pending' | 'accent' | 'success' | 'danger'> = {
  pending: 'pending',
  confirmed: 'accent',
  ongoing: 'accent',
  completed: 'success',
  cancelled: 'danger',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtPrice(p: string | null) {
  if (!p) return '—'
  return `₹${Number(p).toLocaleString('en-IN')}`
}

export function Consultations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = Number(searchParams.get('page') ?? 1)
  const status = (searchParams.get('status') as AptStatus | null) ?? undefined
  const dateFrom = searchParams.get('dateFrom') ?? undefined
  const dateTo = searchParams.get('dateTo') ?? undefined

  const [dateFromInput, setDateFromInput] = useState(dateFrom ?? '')
  const [dateToInput, setDateToInput] = useState(dateTo ?? '')

  const load = () => {
    setLoading(true)
    adminApi
      .listAppointments({ status, dateFrom, dateTo, page })
      .then((res) => {
        setAppointments(res.appointments)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Appointments load nahi hue.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status, dateFrom, dateTo, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const applyDates = () => {
    const next = new URLSearchParams(searchParams)
    if (dateFromInput) next.set('dateFrom', dateFromInput)
    else next.delete('dateFrom')
    if (dateToInput) next.set('dateTo', dateToInput)
    else next.delete('dateTo')
    next.delete('page')
    setSearchParams(next)
  }

  const clearDates = () => {
    setDateFromInput('')
    setDateToInput('')
    const next = new URLSearchParams(searchParams)
    next.delete('dateFrom')
    next.delete('dateTo')
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-faint uppercase tracking-wide">Status</label>
          <select
            value={status ?? ''}
            onChange={(e) => updateParam('status', e.target.value || undefined)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-faint uppercase tracking-wide">From</label>
          <input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-faint uppercase tracking-wide">To</label>
          <input
            type="date"
            value={dateToInput}
            onChange={(e) => setDateToInput(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={applyDates}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={clearDates}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
            >
              Clear
            </button>
          )}
        </div>

        {meta && (
          <span className="ml-auto text-sm text-text-faint">{meta.total.toLocaleString()} sessions</span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-faint">Loading…</td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-faint">No appointments found.</td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{apt.service.title}</p>
                    <p className="font-mono text-xs text-text-faint">{apt.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{apt.astrologerName ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{apt.userName ?? '—'}</td>
                  <td className="px-4 py-3 text-text-faint whitespace-nowrap">{fmt(apt.scheduledAt)}</td>
                  <td className="px-4 py-3 text-text-faint">{apt.durationMinutes} min</td>
                  <td className="px-4 py-3 font-medium text-text">{fmtPrice(apt.price)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[apt.status]}>{apt.status}</Badge>
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
