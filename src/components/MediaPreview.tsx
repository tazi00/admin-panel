import { useEffect, useState } from 'react'

const isPdf = (url: string) => /\.pdf(\?|#|$)/i.test(url)

// Fullscreen viewer — image ya PDF; Esc / bahar click se band
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-md bg-black/50 px-2.5 py-1 text-sm text-white hover:bg-black/70"
        aria-label="Close"
      >
        ✕
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute left-4 top-4 rounded-md bg-black/50 px-2.5 py-1 text-xs text-white hover:bg-black/70"
      >
        Open in new tab ↗
      </a>
      {isPdf(url) ? (
        <iframe
          src={url}
          title="Document"
          className="h-[90vh] w-full max-w-4xl rounded-lg bg-white"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={url}
          alt="Document"
          className="max-h-[90vh] max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}

// Document ka inline preview: image thumbnail (click = bada), PDF tile
export function DocumentPreview({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState(false)

  if (broken) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mb-2 block truncate text-xs text-accent hover:underline"
      >
        Preview load nahi hua — file kholo ↗
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mb-2 block h-40 w-full overflow-hidden rounded-md border border-border bg-bg"
        aria-label="Document bada karke dekho"
      >
        {isPdf(url) ? (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-text-secondary">
            <span className="text-2xl">📄</span>
            <span className="text-xs">PDF document</span>
          </span>
        ) : (
          <img
            src={url}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-contain"
          />
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          Click to enlarge
        </span>
      </button>
      {open && <Lightbox url={url} onClose={() => setOpen(false)} />}
    </>
  )
}

export function VideoPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
        Video load nahi hua — file kholo ↗
      </a>
    )
  }
  return (
    <video
      src={url}
      controls
      preload="metadata"
      playsInline
      onError={() => setBroken(true)}
      className="max-h-80 w-full rounded-lg border border-border bg-black"
    />
  )
}
