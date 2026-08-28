import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi, ApiError } from '@/lib/api'
import type { PaginationMeta, Role, User } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { Modal } from '@/components/Modal'

export function Users() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const page = Number(searchParams.get('page') ?? 1)
  const role = (searchParams.get('role') as Role | null) ?? undefined
  const isBanned = searchParams.get('isBanned') === 'true' ? true : undefined
  const search = searchParams.get('search') ?? undefined

  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

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
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
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

  const changeRole = async (user: User, newRole: Role) => {
    setBusyId(user.id)
    try {
      await adminApi.updateUserRole(user.id, newRole)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Role change failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateParam('search', searchInput || undefined)
          }}
          className="flex-1 min-w-[200px]"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, or email…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </form>
        <select
          value={role ?? ''}
          onChange={(e) => updateParam('role', e.target.value || undefined)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="astrologer">Astrologer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={isBanned === undefined ? '' : 'true'}
          onChange={(e) => updateParam('isBanned', e.target.value || undefined)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="true">Banned only</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-faint">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-alt/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{u.name ?? '—'}</p>
                    <p className="font-mono text-xs text-text-faint">{u.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <p>{u.phone ?? '—'}</p>
                    <p className="text-xs text-text-faint">{u.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                    >
                      <option value="user">user</option>
                      <option value="astrologer">astrologer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 text-text-faint">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setBanTarget(u)}
                        className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          u.isBanned
                            ? 'border-success/30 text-success hover:bg-success-soft'
                            : 'border-danger/30 text-danger hover:bg-danger-soft'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setDeleteTarget(u)}
                        className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
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
        {meta && <Pagination meta={meta} onPageChange={(p) => updateParam('page', String(p))} />}
      </div>

      <Modal
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        title={banTarget?.isBanned ? 'Unban user' : 'Ban user'}
      >
        {banTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {banTarget.isBanned ? 'Unban' : 'Ban'}{' '}
              <span className="font-medium text-text">{banTarget.name ?? banTarget.phone}</span>?
            </p>
            {!banTarget.isBanned && (
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBanTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {banTarget.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Permanently delete{' '}
              <span className="font-medium text-text">
                {deleteTarget.name ?? deleteTarget.phone}
              </span>
              ? This cannot be undone — their posts, services, and bookings will be removed too.
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
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
