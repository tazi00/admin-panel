import { useEffect, useRef, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { LogEntry, PaginationMeta } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_TONE: Record<LogLevel, 'neutral' | 'pending' | 'danger' | 'success'> = {
  debug: 'neutral',
  info: 'success',
  warn: 'pending',
  error: 'danger',
}

const LEVEL_OPTS: LogLevel[] = ['debug', 'info', 'warn', 'error']

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function RowBg(level: string) {
  if (level === 'error') return 'bg-danger-soft/30 hover:bg-danger-soft/50'
  if (level === 'warn') return 'bg-pending-soft/20 hover:bg-pending-soft/40'
  return 'hover:bg-surface-alt/60'
}

export function Logs() {
  const [level, setLevel] = useState<LogLevel | ''>('')
  const [source, setSource] = useState('')
  const [sourceInput, setSourceInput] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = (silent = false) => {
    if (!silent) setLoading(true)
    adminApi
      .listLogs({ level: level || undefined, source: source || undefined, search: search || undefined, page })
      .then((res) => {
        setLogs(res.logs)
        setMeta(res.meta)
        setError(null)
      })
      .catch(() => setError('Logs load nahi hue.'))
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => { load() }, [level, source, search, page])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh) {
      intervalRef.current = setInterval(() => load(true), 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, level, source, search, page])

  const applySearch = () => {
    setSearch(searchInput)
    setSource(sourceInput)
    setPage(1)
  }

  const clearAll = () => {
    setLevel('')
    setSearch('')
    setSource('')
    setSearchInput('')
    setSourceInput('')
    setPage(1)
  }

  const hasFilters = !!(level || search || source)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Application Logs</h1>
          <p className="text-xs text-text-faint mt-0.5">Backend se real-time logs — errors, warnings, audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex cursor-pointer items-center gap-2">
            <div
              onClick={() => setAutoRefresh((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${autoRefresh ? 'bg-accent' : 'bg-border'}`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            <span className="text-sm text-text-secondary">
              Auto {autoRefresh ? <span className="text-success">ON</span> : 'off'}
            </span>
          </label>
          <button
            onClick={() => load()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-alt"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {/* Level */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Level</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => { setLevel(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!level ? 'bg-accent text-white' : 'border border-border text-text-secondary hover:text-text'}`}
            >
              All
            </button>
            {LEVEL_OPTS.map((l) => (
              <button
                key={l}
                onClick={() => { setLevel(l); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${level === l ? 'bg-accent text-white' : 'border border-border text-text-secondary hover:text-text'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Source</label>
          <input
            type="text"
            placeholder="e.g. appointments, users…"
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="w-44 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>

        {/* Message search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-text-faint">Search message</label>
          <input
            type="text"
            placeholder="keyword…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="w-52 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-2 pb-0">
          <button
            onClick={applySearch}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt"
            >
              Clear
            </button>
          )}
        </div>

        {meta && (
          <span className="ml-auto text-sm text-text-faint">{meta.total.toLocaleString()} entries</span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Logs table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-text-faint">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft font-mono text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-text-faint">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-text-faint">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className={`cursor-pointer transition-colors ${RowBg(log.level)}`}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2.5 text-text-faint whitespace-nowrap">{fmt(log.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={LEVEL_TONE[log.level as LogLevel] ?? 'neutral'}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{log.source ?? '—'}</td>
                    <td className="px-4 py-2.5 max-w-lg text-text">
                      <p className="truncate" title={log.message}>{log.message}</p>
                    </td>
                    <td className="px-4 py-2.5 text-text-faint">
                      {log.context ? (
                        <span className="text-accent/70 text-xs hover:text-accent">
                          {expandedId === log.id ? '▲ hide' : '▼ show'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                  {expandedId === log.id && log.context && (
                    <tr key={`${log.id}-ctx`} className="bg-surface-alt">
                      <td colSpan={5} className="px-6 py-3">
                        <pre className="max-h-48 overflow-auto rounded-lg bg-bg p-3 text-xs text-text-secondary leading-relaxed">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
      )}
    </div>
  )
}
