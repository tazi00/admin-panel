import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi, ApiError } from '@/lib/api'
import type { PaginationMeta, Post } from '@/lib/types'
import { Pagination } from '@/components/Pagination'
import { Modal } from '@/components/Modal'

export function Posts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? 1)

  const load = () => {
    setLoading(true)
    adminApi
      .listPosts({ search, page })
      .then((res) => {
        setPosts(res.posts)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Posts load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, page])

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await adminApi.deletePost(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateParam('search', searchInput || undefined)
        }}
        className="max-w-sm"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search post content…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-text-faint">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-text-faint">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                {p.astrologerAvatarUrl ? (
                  <img src={p.astrologerAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt text-xs text-text-secondary">
                    {p.astrologerName?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-text">{p.astrologerName ?? 'Unknown'}</p>
                  <p className="text-xs text-text-faint">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {p.mediaUrl && p.mediaType === 'IMAGE' && (
                <img src={p.mediaUrl} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
              )}
              {p.mediaUrl && p.mediaType === 'VIDEO' && (
                <video src={p.mediaUrl} className="mb-2 h-32 w-full rounded-lg object-cover" controls />
              )}

              <p className="mb-3 line-clamp-3 text-sm text-text-secondary">{p.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {p.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] text-text-faint">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  disabled={busyId === p.id}
                  onClick={() => setDeleteTarget(p)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-danger/30 hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && (
        <div className="rounded-xl border border-border bg-surface">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={(p) => updateParam('page', String(p))} />
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove post">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Remove this post by{' '}
              <span className="font-medium text-text">{deleteTarget.astrologerName}</span>? This
              cannot be undone.
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
                Remove post
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
