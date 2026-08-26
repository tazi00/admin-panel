import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/lib/api'
import { HealthSection } from '@/components/HealthCards'
import { YoutubeStatsSection } from '@/components/YoutubeStatsSection'
import type { Stats } from '@/lib/types'

function StatCard({
  label,
  value,
  href,
  accent = false,
}: {
  label: string
  value: number | string
  href?: string
  accent?: boolean
}) {
  const content = (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        accent
          ? 'border-accent/30 bg-accent-soft hover:border-accent/50'
          : 'border-border bg-surface hover:border-text-faint/40'
      }`}
    >
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-semibold ${accent ? 'text-accent' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => setError('Stats load nahi ho paaye.'))
  }, [])

  if (error) return <p className="text-sm text-danger">{error}</p>
  if (!stats) return <p className="text-sm text-text-secondary">Loading…</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total users" value={stats.totalUsers} href="/users" />
        <StatCard label="Astrologers" value={stats.totalAstrologers} href="/astrologers" />
        <StatCard
          label="Pending verification"
          value={stats.pendingVerifications}
          href="/astrologers?status=pending"
          accent
        />
        <StatCard label="Total posts" value={stats.totalPosts} href="/posts" />
        <StatCard label="Banned users" value={stats.bannedUsers} href="/users?isBanned=true" />
      </div>

      {stats.pendingVerifications > 0 && (
        <Link
          to="/astrologers?status=pending"
          className="block rounded-xl border border-accent/30 bg-accent-soft px-5 py-4 text-sm text-accent transition-colors hover:border-accent/50"
        >
          {stats.pendingVerifications} astrologer{stats.pendingVerifications > 1 ? 's' : ''} waiting
          for verification review →
        </Link>
      )}

      <YoutubeStatsSection />

      <HealthSection />
    </div>
  )
}
