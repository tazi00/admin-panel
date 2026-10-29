// Admin ka apna AstroBook Official astrologer profile edit karne ki page.
// Users table (name, bio, avatarUrl) + astrologer_profiles table
// (specializations, languages, experience, photoUrl) dono update hote hain.

import { useEffect, useState } from 'react'
import { myApi, uploadToImageKit, ApiError } from '@/lib/api'
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '@/lib/env'

const KNOWN_SPECIALIZATIONS = [
  'Vedic Astrology', 'Tarot', 'Numerology', 'Palmistry', 'Vastu Shastra',
  'KP Astrology', 'Nadi Astrology', 'Face Reading', 'Crystal Healing',
]
const KNOWN_LANGUAGES = ['Hindi', 'English', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Punjabi']

function TagInput({
  label,
  values,
  suggestions,
  onChange,
}: {
  label: string
  values: string[]
  suggestions: string[]
  onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed])
    setInput('')
  }

  const remove = (val: string) => onChange(values.filter((v) => v !== val))

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text">{label}</label>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-0.5 text-xs font-medium text-accent"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="ml-1 text-accent/60 hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(input) }
          }}
          placeholder={`Add ${label.toLowerCase()}…`}
          list={`${label}-list`}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
        <datalist id={`${label}-list`}>
          {suggestions.filter((s) => !values.includes(s)).map((s) => <option key={s} value={s} />)}
        </datalist>
        <button
          type="button"
          onClick={() => add(input)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function MyProfile() {
  // User fields
  const [name, setName]         = useState('')
  const [bio, setBio]           = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Astrologer profile fields
  const [astBio, setAstBio]     = useState('')
  const [experience, setExp]    = useState(0)
  const [languages, setLangs]   = useState<string[]>([])
  const [specs, setSpecs]       = useState<string[]>([])
  const [photoUrl, setPhotoUrl] = useState('')

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  // Image upload state
  const [avatarUploading, setAvatarUploading]   = useState(false)
  const [photoUploading, setPhotoUploading]     = useState(false)

  useEffect(() => {
    Promise.all([myApi.getMe()])
      .then(([me]) => {
        setName(me.name ?? '')
        setBio(me.bio ?? '')
        setAvatarUrl(me.avatarUrl ?? '')
      })
      .catch(() => setError('Profile load nahi ho paya.'))
      .finally(() => setLoading(false))
  }, [])

  const uploadImage = async (
    file: File,
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void,
    folder: string,
  ) => {
    setUploading(true)
    try {
      const auth = await myApi.getPostUploadToken()
      const url = await uploadToImageKit(file, auth, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT, folder)
      setUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side validation
    if (astBio && astBio.trim().length < 20) {
      setError('Astrologer bio kam se kam 20 characters ka hona chahiye')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await myApi.updateMe({ name: name || undefined, bio: bio || undefined, avatarUrl: avatarUrl || undefined })
      if (astBio || experience || languages.length || specs.length || photoUrl) {
        await myApi.updateAstrologerProfile({
          bio:             astBio || undefined,
          experience:      experience || undefined,
          languages:       languages.length ? languages : undefined,
          specializations: specs.length ? specs : undefined,
          photoUrl:        photoUrl || undefined,
        })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-text-faint">Loading…</p>

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-8">
      {/* ── Account info ─────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-sm font-semibold text-text">Account Info</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Short bio (users table)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Avatar URL</label>
            <div className="flex items-center gap-3">
              {avatarUrl && (
                <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
              )}
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt">
                {avatarUploading ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadImage(f, setAvatarUrl, setAvatarUploading, '/astrobook/admin/avatars')
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ── Astrologer profile ────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-sm font-semibold text-text">Astrologer Profile</h2>
        <p className="mb-5 text-xs text-text-faint">
          Yeh fields astrologer_profiles table mein jaate hain — app mein "AstroBook Official" ki
          public profile card yahi dikhti hai.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Astrologer bio (min 20 chars)
            </label>
            <textarea
              value={astBio}
              onChange={(e) => setAstBio(e.target.value)}
              rows={4}
              minLength={20}
              maxLength={1000}
              placeholder="AstroBook ka official astrologer account. Vedic astrology, tarot…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            {astBio && astBio.trim().length < 20 && (
              <p className="mt-1 text-xs text-danger">
                {astBio.trim().length}/20 — 20 characters minimum
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Experience (years)</label>
            <input
              type="number"
              min={0}
              max={70}
              value={experience}
              onChange={(e) => setExp(Number(e.target.value))}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          <TagInput
            label="Languages"
            values={languages}
            suggestions={KNOWN_LANGUAGES}
            onChange={setLangs}
          />

          <TagInput
            label="Specializations"
            values={specs}
            suggestions={KNOWN_SPECIALIZATIONS}
            onChange={setSpecs}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Profile photo URL</label>
            <div className="flex items-center gap-3">
              {photoUrl && (
                <img src={photoUrl} alt="profile" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt">
                {photoUploading ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadImage(f, setPhotoUrl, setPhotoUploading, '/astrobook/admin/photos')
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-emerald-500">✓ Profile saved!</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
