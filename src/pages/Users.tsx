import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi, ApiError } from '@/lib/api'
import type { PaginationMeta, Role, User } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { Modal } from '@/components/Modal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const ROLE_TONE: Record<string, 'neutral' | 'accent' | 'pending'> = {
  user: 'neutral',
  astrologer: 'accent',
  admin: 'pending',
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'border border-border text-text-secondary hover:border-accent/40 hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string | null | undefined }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold uppercase text-accent">
      {initials(name)}
    </span>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const ROLE_OPTS: Array<{ label: string; value: Role | '' }> = [
  { label: 'All roles', value: '' },
  { label: 'User', value: 'user' },
  { label: 'Astrologer', value: 'astrologer' },
  { label: 'Admin', value: 'admin' },
]

const STATUS_OPTS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'false' },
  { label: 'Banned', value: 'true' },
]

export function Users() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const role = (searchParams.get('role') as Role | null) ?? undefined
  const isBannedParam = searchParams.get('isBanned') ?? ''
  const isBanned = isBannedParam === 'true' ? true : isBannedParam === 'false' ? false : undefined
  const search = searchParams.get('search') ?? undefined

  const [searchInput, setSearchInput] = useState(search ?? '')
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = () => {
    setLoading(true)
    adminApi
      .listUsers({ search, role, isBanned, page })
      .then((res) => {
        setUsers(res.users)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Users load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, role, isBanned, page])

const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value !== undefined && value !== '') next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')   // ← yahi fix hai
    setSearchParams(next)
  }

  const onSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('search', val.trim() || undefined)
    }, 400)
  }

  const confirmBan = async () => {
    if (!banTarget) return
    setBusyId(banTarget.id)
    try {
      await adminApi.banUser(banTarget.id, !banTarget.isBanned, banReason || undefined)
      setBanTarget(null)
      setBanReason('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await adminApi.deleteUser(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Users</h1>
          {meta && (
            <p className="text-xs text-text-faint mt-0.5">
              {meta.total.toLocaleString()} registered
            </p>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                updateParam('search', undefined)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-faint">Role</span>
            {ROLE_OPTS.map((opt) => (
              <Chip
                key={opt.value}
                active={(role ?? '') === opt.value}
                onClick={() => updateParam('role', opt.value || undefined)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-faint">Status</span>
            {STATUS_OPTS.map((opt) => (
              <Chip
                key={opt.value}
                active={isBannedParam === opt.value}
                onClick={() => updateParam('isBanned', opt.value || undefined)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-faint">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
                    <span className="text-xs">Loading users…</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-faint">
                  No users match the current filters.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="group hover:bg-surface-alt/50 transition-colors">
                  {/* Name + avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div>
                        <p className="font-medium text-text">{u.name ?? '—'}</p>
                        <p className="font-mono text-xs text-text-faint">{u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-text-secondary">{u.phone ?? '—'}</p>
                    {u.email && (
                      <p className="text-xs text-text-faint truncate max-w-[200px]">{u.email}</p>
                    )}
                  </td>
                  {/* Role — read-only badge */}
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[u.role] ?? 'neutral'}>{u.role}</Badge>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <Badge tone="danger">Banned</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  {/* Joined */}
                  <td className="px-4 py-3 text-sm text-text-faint">{fmtDate(u.createdAt)}</td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setBanTarget(u)}
                        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          u.isBanned
                            ? 'border-success/30 text-success hover:bg-success/10'
                            : 'border-danger/30 text-danger hover:bg-danger/10'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setDeleteTarget(u)}
                        className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-text-faint transition-colors hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onPage={(p) => updateParam('page', String(p))}
          />
        )}
      </div>

      {/* ── Ban modal ── */}
      <Modal
        open={!!banTarget}
        onClose={() => { setBanTarget(null); setBanReason('') }}
        title={banTarget?.isBanned ? 'Unban user' : 'Ban user'}
      >
        {banTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {banTarget.isBanned ? 'Remove ban from' : 'Ban'}{' '}
              <span className="font-semibold text-text">{banTarget.name ?? banTarget.phone}</span>?
            </p>
            {!banTarget.isBanned && (
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setBanTarget(null); setBanReason('') }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                disabled={busyId === banTarget.id}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {banTarget.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Permanently delete{' '}
              <span className="font-semibold text-text">
                {deleteTarget.name ?? deleteTarget.phone}
              </span>
              ?{' '}
              <span className="text-danger">This cannot be undone</span> — their posts, services,
              and bookings will be removed too.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={busyId === deleteTarget.id}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Delete permanently
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
