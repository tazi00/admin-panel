import { useEffect, useRef, useState } from 'react'
import { adminApi, uploadToImageKit } from '@/lib/api'
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '@/lib/env'
import { VideoPreview } from '@/components/MediaPreview'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  label: string
  description: string
  heroVideoUrl: string | null
  heroImageUrl: string | null
}

interface CategoriesResponse {
  success: boolean
  data: {
    filters: { id: string; label: string }[]
    categories: Category[]
  }
}

// ─── Per-category upload state ────────────────────────────────────────────────

interface UploadState {
  uploading: boolean
  progress: string
  error: string | null
  success: boolean
}

const DEFAULT_STATE: UploadState = {
  uploading: false,
  progress: '',
  error: null,
  success: false,
}

// ─── CategoryRow ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onVideoSet,
}: {
  category: Category
  onVideoSet: (id: string, url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>(DEFAULT_STATE)
  const [manualUrl, setManualUrl] = useState('')
  const [showManual, setShowManual] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setState({ ...DEFAULT_STATE, error: 'Sirf video file select karo (mp4, mov, etc.)' })
      return
    }
    setState({ ...DEFAULT_STATE, uploading: true, progress: 'ImageKit token le raha hoon…' })

    try {
      const auth = await adminApi.getUploadToken()
      setState((s) => ({ ...s, progress: 'Video upload ho rahi hai…' }))

      const url = await uploadToImageKit(
        file,
        auth,
        IMAGEKIT_PUBLIC_KEY,
        IMAGEKIT_URL_ENDPOINT,
        '/astrobook/category-videos',
      )
      setState((s) => ({ ...s, progress: 'Server pe save kar raha hoon…' }))

      await adminApi.setCategoryHeroVideo(category.id, url)
      onVideoSet(category.id, url)
      setState({ ...DEFAULT_STATE, success: true })
    } catch (err) {
      setState({ ...DEFAULT_STATE, error: err instanceof Error ? err.message : 'Upload fail hua' })
    }
  }

  async function handleManualSave() {
    const url = manualUrl.trim()
    if (!url) return
    setState({ ...DEFAULT_STATE, uploading: true, progress: 'Save kar raha hoon…' })
    try {
      await adminApi.setCategoryHeroVideo(category.id, url)
      onVideoSet(category.id, url)
      setManualUrl('')
      setShowManual(false)
      setState({ ...DEFAULT_STATE, success: true })
    } catch (err) {
      setState({ ...DEFAULT_STATE, error: err instanceof Error ? err.message : 'Save fail hua' })
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{category.label}</p>
          <p className="text-xs text-text-faint line-clamp-1">{category.description}</p>
          <p className="mt-0.5 font-mono text-[10px] text-text-faint">id: {category.id}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {/* Upload file button */}
          <button
            type="button"
            disabled={state.uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {state.uploading ? 'Upload…' : category.heroVideoUrl ? '↺ Replace' : '+ Upload Video'}
          </button>

          {/* Manual URL toggle */}
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
          >
            URL paste karo
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>

      {/* Manual URL input */}
      {showManual && (
        <div className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://ik.imagekit.io/…/video.mp4"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-faint outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={!manualUrl.trim() || state.uploading}
            onClick={handleManualSave}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {/* Status feedback */}
      {state.uploading && (
        <p className="text-xs text-text-secondary animate-pulse">{state.progress}</p>
      )}
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-green-600 font-medium">✓ Video set ho gayi!</p>
      )}

      {/* Current video preview */}
      {category.heroVideoUrl ? (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wide">
            Current Hero Video
          </p>
          <VideoPreview url={category.heroVideoUrl} />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-bg text-xs text-text-faint">
          Abhi koi video nahi
        </div>
      )}
    </div>
  )
}

// ─── Categories page ──────────────────────────────────────────────────────────

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://192.168.0.200:8080/api/v1'}/categories`,
      )
      const json: CategoriesResponse = await res.json()
      setCategories(json.data.categories)
    } catch {
      setError('Categories load nahi hui')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Update a single category's video URL without refetching
  function handleVideoSet(id: string, url: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, heroVideoUrl: url } : c)),
    )
  }

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : categories

  const withVideo = categories.filter((c) => c.heroVideoUrl).length

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text">Categories</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Har category ke liye Explore page ka hero video set karo (ImageKit se upload)
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-4 py-2 text-center">
          <p className="text-lg font-bold text-accent">{withVideo}</p>
          <p className="text-[10px] text-text-faint">videos set</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Category dhundo…"
        className="w-full max-w-sm rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-faint outline-none focus:border-accent"
      />

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-alt" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-surface-alt"
          >
            Dobara try karo
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-faint">Koi match nahi mila</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              onVideoSet={handleVideoSet}
            />
          ))}
        </div>
      )}
    </div>
  )
}
