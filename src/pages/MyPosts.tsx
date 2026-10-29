// Admin ke apne posts create / view / delete karne ki page.
// "AstroBook Official" ke naam se posts — platform seed content ke liye.

import { useEffect, useRef, useState } from 'react'
import { myApi, uploadToImageKit, ApiError } from '@/lib/api'
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '@/lib/env'
import type { MyPost } from '@/lib/types'
import { Modal } from '@/components/Modal'

const BG_COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d6a4f', '#1b4332']
const TEXT_COLORS = ['#ffffff', '#f8f9fa', '#e9ecef', '#f1c40f', '#a8dadc']

function PostCard({
  post,
  onDelete,
}: {
  post: MyPost
  onDelete: (p: MyPost) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {post.mediaUrl && post.mediaType === 'IMAGE' && (
        <img src={post.mediaUrl} alt="" className="mb-3 h-36 w-full rounded-lg object-cover" />
      )}
      {post.mediaUrl && post.mediaType === 'VIDEO' && (
        <video src={post.mediaUrl} className="mb-3 h-36 w-full rounded-lg object-cover" controls />
      )}

      {/* Coloured text preview */}
      {(!post.mediaUrl || post.mediaType === 'TEXT') && post.bgColor && (
        <div
          className="mb-3 flex h-24 items-center justify-center rounded-lg px-4 text-center text-sm font-medium"
          style={{ background: post.bgColor, color: post.textColor ?? '#fff' }}
        >
          <span className="line-clamp-3">{post.content}</span>
        </div>
      )}

      {post.mediaType !== 'TEXT' || !post.bgColor ? (
        <p className="mb-3 line-clamp-3 text-sm text-text-secondary">{post.content}</p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-text-faint">
        <div className="flex gap-3">
          <span>❤ {post.likesCount}</span>
          <span>💬 {post.commentsCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <button
            onClick={() => onDelete(post)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-danger/40 hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function MyPosts() {
  const [posts, setPosts]         = useState<MyPost[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [deleteTarget, setDelete] = useState<MyPost | null>(null)
  const [deleting, setDeleting]   = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [content, setContent]       = useState('')
  const [mediaType, setMediaType]   = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT')
  const [mediaUrl, setMediaUrl]     = useState('')
  const [bgColor, setBgColor]       = useState(BG_COLORS[0])
  const [textColor, setTextColor]   = useState(TEXT_COLORS[0])
  const [uploading, setUploading]   = useState(false)
  const [creating, setCreating]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    myApi
      .getMyPosts()
      .then((res) => { setPosts(res.posts); setError(null) })
      .catch(() => setError('Posts load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const auth = await myApi.getPostUploadToken()
      const folder = mediaType === 'VIDEO' ? '/astrobook/posts/videos' : '/astrobook/posts/images'
      const url = await uploadToImageKit(file, auth, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT, folder)
      setMediaUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setCreating(true)
    setError(null)
    try {
      await myApi.createPost({
        content: content.trim(),
        mediaType,
        mediaUrl: mediaUrl || undefined,
        bgColor:   mediaType === 'TEXT' ? bgColor : undefined,
        textColor: mediaType === 'TEXT' ? textColor : undefined,
      })
      setContent('')
      setMediaUrl('')
      setShowCreate(false)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Post create nahi hua')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await myApi.deletePost(deleteTarget.id)
      setDelete(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-faint">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + New post
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-text-faint">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-text-faint">Abhi koi post nahi hai.</p>
          <p className="mt-1 text-xs text-text-faint">
            "New post" button se pehla post banao — yeh feed mein seed content karega.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onDelete={setDelete} />
          ))}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New post">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Media type selector */}
          <div className="flex gap-2">
            {(['TEXT', 'IMAGE', 'VIDEO'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setMediaType(t); setMediaUrl('') }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mediaType === t
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              placeholder="Post ka content likho…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>

          {/* Media upload — IMAGE or VIDEO */}
          {mediaType !== 'TEXT' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                {mediaType === 'IMAGE' ? 'Image' : 'Video'} upload
              </label>
              <div className="flex items-center gap-3">
                {mediaUrl && mediaType === 'IMAGE' && (
                  <img src={mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                )}
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="URL ya neeche se upload karo"
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
                <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt">
                  {uploading ? 'Uploading…' : 'Upload'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept={mediaType === 'IMAGE' ? 'image/*' : 'video/*'}
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f)
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Colour pickers — TEXT only */}
          {mediaType === 'TEXT' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Background</label>
                <div className="flex gap-2">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBgColor(c)}
                      style={{ background: c }}
                      className={`h-7 w-7 rounded-md border-2 transition-transform ${bgColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Text colour</label>
                <div className="flex gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextColor(c)}
                      style={{ background: c, border: '1px solid #ccc' }}
                      className={`h-7 w-7 rounded-md border-2 transition-transform ${textColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div
                className="flex h-20 items-center justify-center rounded-lg px-4 text-sm font-medium"
                style={{ background: bgColor, color: textColor }}
              >
                <span className="text-center">{content || 'Preview…'}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || uploading || !content.trim()}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {creating ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onClose={() => setDelete(null)} title="Delete post">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Yeh post permanently delete ho jayega. Undo nahi hoga.
            </p>
            <p className="line-clamp-2 rounded-lg bg-surface-alt px-3 py-2 text-sm italic text-text-secondary">
              "{deleteTarget.content}"
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
