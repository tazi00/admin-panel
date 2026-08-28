import { useEffect, useRef, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { AgoraHealthCheck, CronJobStatus, HealthResponse, HealthStatus } from '@/lib/types'
import { Badge } from './Badge'

const POLL_INTERVAL_MS = 15_000

function statusTone(status: HealthStatus): 'success' | 'danger' | 'pending' {
  if (status === 'ok' || status === 'up') return 'success'
  if (status === 'degraded') return 'pending'
  return 'danger'
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (h > 0 || m > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString()
}

function HealthCardShell({
  title,
  status,
  children,
}: {
  title: string
  status: HealthStatus
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-secondary">{title}</p>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-mono text-text">{value}</span>
    </div>
  )
}

function ServerHealthCard({ check }: { check: HealthResponse['checks']['server'] }) {
  return (
    <HealthCardShell title="Server" status={check.status}>
      <Row label="Uptime" value={formatUptime(check.uptimeSeconds)} />
      <Row label="Memory" value={`${check.memoryUsageMb} MB`} />
    </HealthCardShell>
  )
}

function DatabaseHealthCard({ check }: { check: HealthResponse['checks']['database'] }) {
  return (
    <HealthCardShell title="Database" status={check.status}>
      <Row label="Latency" value={`${check.latencyMs} ms`} />
      {check.error && <p className="text-sm text-danger">{check.error}</p>}
      {check.logs.length > 0 && (
        <p className="text-xs text-text-faint">{check.logs.length} log entr{check.logs.length > 1 ? 'ies' : 'y'}</p>
      )}
    </HealthCardShell>
  )
}

function CronJobRow({ job }: { job: CronJobStatus }) {
  return (
    <div className="flex items-center justify-between border-t border-border-soft pt-1.5 text-sm first:border-t-0 first:pt-0">
      <div>
        <p className="text-text">{job.name}</p>
        <p className="text-xs text-text-faint">last run {formatTime(job.lastRunAt)}</p>
        {job.lastError && <p className="text-xs text-danger">{job.lastError}</p>}
      </div>
      <Badge tone={job.healthy ? 'success' : 'danger'}>{job.healthy ? 'healthy' : 'unhealthy'}</Badge>
    </div>
  )
}

function formatMonth(month: string | undefined | null): string {
  if (!month) return '—'
  if (month.length !== 6) return month
  const year = month.slice(0, 4)
  const monthIndex = Number(month.slice(4, 6)) - 1
  const date = new Date(Number(year), monthIndex, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function AgoraHealthCard({ check }: { check: AgoraHealthCheck }) {
  return (
    <HealthCardShell title="Agora" status={check.status}>
      <Row label="Month" value={formatMonth(check.month)} />
      <Row label="Total minutes" value={check.totalMinutes != null ? check.totalMinutes.toFixed(2) : '—'} />
      <Row label="Total hours" value={check.totalHours != null ? check.totalHours.toFixed(2) : '—'} />
    </HealthCardShell>
  )
}

function CronHealthCard({ check }: { check: HealthResponse['checks']['cron'] }) {
  return (
    <HealthCardShell title="Cron jobs" status={check.status}>
      {check.jobs.length === 0 ? (
        <p className="text-sm text-text-secondary">No jobs registered.</p>
      ) : (
        <div className="space-y-1.5">
          {check.jobs.map((job) => (
            <CronJobRow key={job.name} job={job} />
          ))}
        </div>
      )}
    </HealthCardShell>
  )
}

export function HealthSection() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchHealth = () => {
      adminApi
        .getHealth()
        .then((res) => {
          if (!cancelled) {
            setHealth(res)
            setError(null)
          }
        })
        .catch(() => {
          if (!cancelled) setError('Health check load nahi ho paaya.')
        })
    }

    fetchHealth()
    timerRef.current = setInterval(fetchHealth, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (error && !health) return <p className="text-sm text-danger">{error}</p>
  if (!health) return <p className="text-sm text-text-secondary">Loading health…</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">System health</h2>
        <div className="flex items-center gap-2 text-xs text-text-faint">
          <Badge tone={statusTone(health.status)}>{health.status}</Badge>
          <span>as of {formatTime(health.timestamp)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ServerHealthCard check={health.checks.server} />
        <DatabaseHealthCard check={health.checks.database} />
        <CronHealthCard check={health.checks.cron} />
      </div>

      <h2 className="text-sm font-semibold text-text">Third party services</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgoraHealthCard check={health.checks.agora} />
      </div>
    </div>
  )
}
