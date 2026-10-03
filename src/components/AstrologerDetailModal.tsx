import { useRef, useState } from 'react'
import { adminApi, uploadToImageKit, ApiError } from '@/lib/api'
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '@/lib/env'
import type { AstrologerListItem, VerificationStatus } from '@/lib/types'
import { Modal } from '@/components/Modal'
import { VerificationBadge } from '@/components/VerificationBadge'
import { DocumentPreview, VideoPreview } from '@/components/MediaPreview'

function DocumentSlot({
  label,
  url,
  onUploaded,
}: {
  label: string
  url: string | null
  onUploaded: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const auth = await adminApi.getUploadToken()
      const uploadedUrl = await uploadToImageKit(file, auth, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT)
      onUploaded(uploadedUrl)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-3">
      <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
      {url ? (
        <DocumentPreview url={url} />
      ) : (
        <p className="mb-2 text-xs text-text-faint">No document added yet</p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : url ? 'Replace document' : 'Upload document'}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

export function AstrologerDetailModal({
  astrologer,
  onClose,
  onUpdated,
}: {
  astrologer: AstrologerListItem
  onClose: () => void
  onUpdated: () => void
}) {
  const [doc1, setDoc1] = useState(astrologer.document1Url)
  const [doc2, setDoc2] = useState(astrologer.document2Url)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persistDocument = async (which: 'doc1' | 'doc2', url: string) => {
    if (which === 'doc1') setDoc1(url)
    else setDoc2(url)
    try {
      await adminApi.updateDocuments(
        astrologer.id,
        which === 'doc1' ? url : doc1,
        which === 'doc2' ? url : doc2,
      )
      onUpdated()
    } catch {
      setError('Document save failed.')
    }
  }

  const setStatus = async (status: VerificationStatus, reason?: string) => {
    setSaving(true)
    setError(null)
    try {
      await adminApi.updateVerification(astrologer.id, status, reason)
      setShowRejectForm(false)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Astrologer verification" width="max-w-2xl">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {astrologer.avatarUrl || astrologer.photoUrl ? (
              <img
                src={astrologer.avatarUrl ?? astrologer.photoUrl ?? ''}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt font-display text-lg text-text-secondary">
                {astrologer.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="font-display text-base font-semibold text-text">
                {astrologer.name ?? 'Unnamed'}
              </p>
              <p className="font-mono text-xs text-text-faint">{astrologer.phone}</p>
            </div>
          </div>
          <VerificationBadge status={astrologer.verificationStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-alt p-3 text-xs">
          <div>
            <p className="text-text-faint">Experience</p>
            <p className="mt-0.5 text-text">{astrologer.experience ?? 0} years</p>
          </div>
          <div>
            <p className="text-text-faint">Rating</p>
            <p className="mt-0.5 text-text">
              {astrologer.rating ?? '0.00'} ({astrologer.totalReviews ?? 0} reviews)
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-text-faint">Specializations</p>
            <p className="mt-0.5 text-text">
              {astrologer.specializations?.join(', ') || '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-text-faint">Bio</p>
            <p className="mt-0.5 text-text">{astrologer.bio || '—'}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-text-secondary">Intro video</p>
          {astrologer.videoUrl ? (
            <VideoPreview url={astrologer.videoUrl} />
          ) : (
            <p className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-faint">
              No video added
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-text-secondary">Verification documents</p>
          <div className="grid grid-cols-2 gap-3">
            <DocumentSlot
              label="Document 1 (e.g. ID proof)"
              url={doc1}
              onUploaded={(url) => persistDocument('doc1', url)}
            />
            <DocumentSlot
              label="Document 2 (e.g. certificate)"
              url={doc2}
              onUploaded={(url) => persistDocument('doc2', url)}
            />
          </div>
        </div>

        {astrologer.verificationStatus === 'rejected' && astrologer.rejectionReason && (
          <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">
            Previous rejection reason: {astrologer.rejectionReason}
          </p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        {showRejectForm ? (
          <div className="space-y-2 rounded-lg border border-danger/20 bg-danger-soft p-3">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectForm(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReason.trim() || saving}
                onClick={() => setStatus('rejected', rejectionReason)}
                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              disabled={saving || astrologer.verificationStatus === 'approved'}
              onClick={() => setStatus('approved')}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-bg disabled:opacity-40"
            >
              Approve
            </button>
            <button
              disabled={saving || astrologer.verificationStatus === 'rejected'}
              onClick={() => setShowRejectForm(true)}
              className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-40"
            >
              Reject
            </button>
            <button
              disabled={saving || astrologer.verificationStatus === 'pending'}
              onClick={() => setStatus('pending')}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40"
            >
              Reset to pending
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
