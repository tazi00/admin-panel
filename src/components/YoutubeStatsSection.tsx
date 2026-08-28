import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import type { YoutubeStats } from "@/lib/types";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <span className="text-text-faint">{icon}</span>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold text-text">{value}</p>
    </div>
  );
}

function EngagementBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className="font-mono text-text">{formatCompact(value)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BestVideoCard({ data }: { data: YoutubeStats["bestVideo"] }) {
  const { video, videosConsidered, range } = data;

  const header = (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-text-secondary">
        Best video this range
      </p>
      <span className="text-xs text-text-faint">
        {formatDate(range.from)} – {formatDate(range.to)} · {videosConsidered}{" "}
        videos
      </span>
    </div>
  );

  if (!video) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        {header}
        <p className="mt-4 text-sm text-text-secondary">
          No videos published in this range.
        </p>
      </div>
    );
  }

  const max = Math.max(video.viewCount, video.likeCount, video.commentCount);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {header}

      <div className="mt-4 flex gap-4">
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-24 w-40 rounded-lg border border-border object-cover transition-opacity hover:opacity-80"
          />
        </a>
        <div className="min-w-0 flex-1">
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 text-sm font-medium text-text hover:text-accent"
          >
            {video.title}
          </a>
          <p className="mt-1 text-xs text-text-faint">
            Published {formatDate(video.publishedAt)}
          </p>

          <div className="mt-3 space-y-2">
            <EngagementBar
              label="Views"
              value={video.viewCount}
              max={max}
              colorClass="bg-accent"
            />
            <EngagementBar
              label="Likes"
              value={video.likeCount}
              max={max}
              colorClass="bg-success"
            />
            <EngagementBar
              label="Comments"
              value={video.commentCount}
              max={max}
              colorClass="bg-pending"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function YoutubeStatsSection() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [stats, setStats] = useState<YoutubeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getYoutubeStats({ from, to })
      .then((res) => {
        if (!cancelled) {
          setStats(res.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("YouTube stats load nahi ho paaye.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">YouTube</h2>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <label className="flex items-center gap-1.5">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-text"
            />
          </label>
          <label className="flex items-center gap-1.5">
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-text"
            />
          </label>
          {loading && <span className="text-text-faint">Refreshing…</span>}
        </div>
      </div>

      {error && !stats && <p className="text-sm text-danger">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Subscribers"
              value={formatCompact(stats.subscribers.subscriberCount)}
              icon="👥"
            />
            <MetricCard
              label="Total views"
              value={formatCompact(stats.subscribers.viewCount)}
              icon="👁"
            />
            <MetricCard
              label="Total videos"
              value={formatCompact(stats.subscribers.videoCount)}
              icon="🎬"
            />
          </div>

          <BestVideoCard data={stats.bestVideo} />
        </>
      )}
    </div>
  );
}
