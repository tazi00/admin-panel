import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi, ApiError } from '@/lib/api'
import type { AstrologerListItem, PaginationMeta, VerificationStatus } from '@/lib/types'
import { Pagination } from '@/components/Pagination'
import { VerificationBadge } from '@/components/VerificationBadge'
import { AstrologerDetailModal } from '@/components/AstrologerDetailModal'
import { Modal } from '@/components/Modal'

const tabs: { label: string; value: VerificationStatus | '' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: '' },
]

export function Astrologers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [astrologers, setAstrologers] = useState<AstrologerListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [selected, setSelected] = useState<AstrologerListItem | null>(null)
  const [commissionTarget, setCommissionTarget] = useState<AstrologerListItem | null>(null)
  const [commissionInput, setCommissionInput] = useState('')
  const [commissionError, setCommissionError] = useState<string | null>(null)
  const [commissionSaving, setCommissionSaving] = useState(false)

  const status = (searchParams.get('status') as VerificationStatus | null) ?? 'pending'
  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? 1)

  const load = () => {
    setLoading(true)
    adminApi
      .listAstrologers({ search, status: status || undefined, page })
      .then((res) => {
        setAstrologers(res.astrologers)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Astrologers load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, status, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const openCommissionModal = (a: AstrologerListItem) => {
    setCommissionTarget(a)
    setCommissionInput(a.commissionPercentage != null ? String(a.commissionPercentage) : '')
    setCommissionError(null)
  }

  const confirmCommission = async () => {
    if (!commissionTarget) return
    const value = Number(commissionInput)
    if (commissionInput.trim() === '' || Number.isNaN(value) || value < 0 || value > 100) {
      setCommissionError('Enter a valid percentage between 0 and 100.')
      return
    }
    setCommissionSaving(true)
    try {
      await adminApi.updateCommission(commissionTarget.id, value)
      setCommissionTarget(null)
      load()
    } catch (err) {
      setCommissionError(err instanceof ApiError ? err.message : 'Commission update failed')
    } finally {
      setCommissionSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParam('status', tab.value || undefined)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === tab.value
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateParam('search', searchInput || undefined)
          }}
          className="min-w-[220px] flex-1 max-w-xs"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </form>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Astrologer</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : astrologers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  No astrologers found.
                </td>
              </tr>
            ) : (
              astrologers.map((a) => (
                <tr key={a.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.avatarUrl || a.photoUrl ? (
                        <img
                          src={a.avatarUrl ?? a.photoUrl ?? ''}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-xs text-text-secondary">
                          {a.name?.[0] ?? '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text">{a.name ?? 'Unnamed'}</p>
                        <p className="font-mono text-xs text-text-faint">{a.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{a.experience ?? 0} yrs</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {a.rating ?? '0.00'} ({a.totalReviews ?? 0})
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={a.verificationStatus} />
                  </td>
                  <td className="px-4 py-3 text-text-faint">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {a.verificationStatus === 'approved' && (
                        <button
                          onClick={() => openCommissionModal(a)}
                          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-accent"
                        >
                          Commission{a.commissionPercentage != null ? ` (${a.commissionPercentage}%)` : ''}
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(a)}
                        className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-accent"
                      >
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta && <Pagination meta={meta} onPageChange={(p) => updateParam('page', String(p))} />}
      </div>

      {selected && (
        <AstrologerDetailModal
          astrologer={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}

      <Modal
        open={!!commissionTarget}
        onClose={() => setCommissionTarget(null)}
        title="Set commission percentage"
      >
        {commissionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Commission for{' '}
              <span className="font-medium text-text">
                {commissionTarget.name ?? commissionTarget.phone}
              </span>
            </p>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                placeholder="0–100"
                className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 pr-8 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-faint">
                %
              </span>
            </div>
            {commissionError && <p className="text-sm text-danger">{commissionError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCommissionTarget(null)}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                disabled={commissionSaving}
                onClick={confirmCommission}
                className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {commissionSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
