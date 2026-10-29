// Admin ke apni consultation services create / view / deactivate karne ki page.
// "AstroBook Official" ke naam se services — users yahan se book kar sakte hain.

import { useEffect, useState } from 'react'
import { myApi, uploadToImageKit, ApiError } from '@/lib/api'
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '@/lib/env'
import type { ConsultationService } from '@/lib/types'
import { Modal } from '@/components/Modal'

const AVAILABLE_TAGS = [
  'Vedic Astrology', 'Tarot', 'Numerology', 'Palmistry', 'Vastu Shastra',
  'Career', 'Love & Relationships', 'Marriage', 'Health', 'Finance',
  'Business', 'Kundli', 'Horoscope', 'KP Astrology',
]

function ServiceCard({
  service,
  onDelete,
}: {
  service: ConsultationService
  onDelete: (s: ConsultationService) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {service.coverImage && (
        <img src={service.coverImage} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
      )}

      {/* Title + Basic badge */}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-medium text-text">{service.title}</h3>
        {service.isBasic && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            Basic
          </span>
        )}
      </div>

      <p className="mb-2 line-clamp-2 text-xs text-text-secondary">{service.shortDescription}</p>

      {/* Variant prices — 5 duration slots */}
      {service.variants && service.variants.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {service.variants.map((v) => (
            <span
              key={v.id}
              className={`rounded-md border px-2 py-0.5 text-[10px] ${
                v.isDefault
                  ? 'border-accent/40 bg-accent/5 text-accent'
                  : 'border-border text-text-faint'
              }`}
            >
              {v.durationMinutes}min · ₹{v.price}
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {service.tags.map((t) => (
          <span key={t} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] text-text-faint">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-text-faint">
        <span className={service.isActive ? 'text-emerald-500' : 'text-danger'}>
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-2">
          <span>{new Date(service.createdAt).toLocaleDateString()}</span>
          {/* Basic service deactivate nahi ho sakti — backend bhi reject karega */}
          {!service.isBasic && (
            <button
              onClick={() => onDelete(service)}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-danger/40 hover:text-danger"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function MyServices() {
  const [services, setServices]   = useState<ConsultationService[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [deleteTarget, setDelete] = useState<ConsultationService | null>(null)
  const [deleting, setDeleting]   = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle]           = useState('')
  const [shortDesc, setShortDesc]   = useState('')
  const [about, setAbout]           = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tags, setTags]             = useState<string[]>([])
  const [creating, setCreating]     = useState(false)
  const [uploading, setUploading]   = useState(false)

  const load = () => {
    setLoading(true)
    myApi
      .getMyServices()
      .then((res) => { setServices(res.services); setError(null) })
      .catch(() => setError('Services load nahi ho paaye.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev,
    )

  const handleCoverUpload = async (file: File) => {
    setUploading(true)
    try {
      const auth = await myApi.getPostUploadToken()
      const url = await uploadToImageKit(file, auth, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT, '/astrobook/services/covers')
      setCoverImage(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setShortDesc('')
    setAbout('')
    setCoverImage('')
    setTags([])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !shortDesc.trim() || !about.trim() || !coverImage || tags.length === 0) {
      setError('Sab fields fill karo — title, short description, about, cover image, aur kam se kam 1 tag.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await myApi.createService({
        title: title.trim(),
        shortDescription: shortDesc.trim(),
        about: about.trim(),
        coverImage,
        tags,
      })
      resetForm()
      setShowCreate(false)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Service create nahi hui')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await myApi.deleteService(deleteTarget.id)
      setDelete(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deactivate failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-faint">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + New service
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-text-faint">Loading…</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-text-faint">Abhi koi consultation service nahi hai.</p>
          <p className="mt-1 text-xs text-text-faint">
            "New service" button se pehli service banao — users yahan se booking karenge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} onDelete={setDelete} />
          ))}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm() }} title="New consultation service">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Title * (3-255 chars)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={255}
              placeholder="e.g. Kundli Analysis"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Short description * (10-500 chars)
            </label>
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              required
              minLength={10}
              maxLength={500}
              rows={2}
              placeholder="Brief overview for the listing card…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              About * (min 20 chars)
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              required
              minLength={20}
              rows={4}
              placeholder="Detailed description shown on the service detail page…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* Cover image */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Cover image *</label>
            <div className="flex items-center gap-3">
              {coverImage && (
                <img src={coverImage} alt="" className="h-12 w-20 rounded-lg object-cover" />
              )}
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="URL ya upload karo"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt">
                {uploading ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCoverUpload(f)
                  }}
                />
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Tags * (1-5, choose from list)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tags.includes(t)
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-text-secondary hover:border-accent/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tags.length >= 5 && (
              <p className="mt-1 text-xs text-text-faint">Max 5 tags allowed.</p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowCreate(false); resetForm() }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || uploading}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Deactivate confirm ───────────────────────────────────── */}
      <Modal open={!!deleteTarget} onClose={() => setDelete(null)} title="Deactivate service">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text">"{deleteTarget.title}"</span> ko deactivate
              karna chahte ho? Users nayi bookings nahi kar paenge, lekin existing appointments safe
              rahenge.
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
                {deleting ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
