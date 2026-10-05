export type Role = 'user' | 'astrologer' | 'admin'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  phone: string | null
  email: string | null
  name: string | null
  dateOfBirth: string | null
  role: Role
  interests: string[] | null
  isOnboarded: boolean
  isAstrologer: boolean
  avatarUrl: string | null
  bio: string | null
  isBanned: boolean
  banReason: string | null
  createdAt: string
  updatedAt: string
}

export interface AstrologerListItem {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  avatarUrl: string | null
  isBanned: boolean
  createdAt: string
  profileId: string
  bio: string | null
  experience: number | null
  languages: string[] | null
  specializations: string[] | null
  photoUrl: string | null
  rating: string | null
  totalReviews: number | null
  isVerified: boolean
  isActive: boolean
  verificationStatus: VerificationStatus
  document1Url: string | null
  document2Url: string | null
  videoUrl: string | null
  rejectionReason: string | null
  verifiedAt: string | null
  commissionPercentage: number | null
}

export interface Post {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT' | null
  tags: string[]
  createdAt: string
  astrologerId: string
  astrologerName: string | null
  astrologerAvatarUrl: string | null
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Stats {
  totalUsers: number
  totalAstrologers: number
  pendingVerifications: number
  totalPosts: number
  bannedUsers: number
}

export interface ImageKitAuthParams {
  token: string
  expire: number
  signature: string
}

export type HealthStatus = 'ok' | 'up' | 'degraded' | 'down' | string

export interface CronJobStatus {
  name: string
  healthy: boolean
  lastRunAt: string
  lastSuccessAt: string | null
  lastError: string | null
}

export interface ServerHealthCheck {
  status: HealthStatus
  uptimeSeconds: number
  memoryUsageMb: number
}

export interface DatabaseHealthCheck {
  status: HealthStatus
  latencyMs: number
  error: string | null
  logs: string[]
}

export interface CronHealthCheck {
  status: HealthStatus
  jobs: CronJobStatus[]
  logs: string[]
}

export interface AgoraHealthCheck {
  status: HealthStatus
  month: string
  totalMinutes: number
  totalHours: number
}

export interface HealthResponse {
  status: HealthStatus
  timestamp: string
  checks: {
    server: ServerHealthCheck
    database: DatabaseHealthCheck
    cron: CronHealthCheck
    agora: AgoraHealthCheck
  }
}

export interface YoutubeSubscriberStats {
  subscriberCount: number
  hidden: boolean
  viewCount: number
  videoCount: number
}

export interface YoutubeVideo {
  videoId: string
  title: string
  thumbnailUrl: string
  url: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
}

export interface YoutubeBestVideo {
  video: YoutubeVideo | null
  videosConsidered: number
  range: {
    from: string
    to: string
  }
}

export interface YoutubeStats {
  subscribers: YoutubeSubscriberStats
  bestVideo: YoutubeBestVideo
}

// ─── Consultations / Appointments ──────────────────────────────────────────

export type AppointmentStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled'

export interface AdminAppointmentService {
  id: string
  isBasic: boolean
  title: string
  coverImage: string | null
  durationMinutes: number
  price: string | null
}

export interface AdminAppointment {
  id: string
  scheduledAt: string
  endsAt: string
  durationMinutes: number
  price: string | null
  status: AppointmentStatus
  bundleStatus: 'in_progress' | 'paused' | 'completed' | null
  parentId: string | null
  notes: string | null
  createdAt: string
  service: AdminAppointmentService
  astrologerName: string | null
  userName: string | null
  astrologerId: string
  userId: string
}

// ─── Earnings ──────────────────────────────────────────────────────────────

export interface AstrologerEarningRow {
  astrologer_id: string
  astrologer_name: string | null
  avatar_url: string | null
  total_sessions: number
  gross_revenue: string
  commission_pct: number
  platform_revenue: string
  astrologer_payout: string
}

export interface RevenueTotals {
  totalSessions: number
  grossRevenue: string
  platformRevenue: string
}

export interface EarningsSummaryResponse {
  summary: AstrologerEarningRow[]
  totals: RevenueTotals
  meta: PaginationMeta
}

// ─── Transactions ──────────────────────────────────────────────────────────

export interface AdminTransaction {
  id: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  appointmentId: string | null
  userId: string | null
  astrologerId: string | null
  amount: string | null
  currency: string | null
  status: 'pending' | 'success' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface TransactionEvent {
  id: string
  razorpayOrderId: string | null
  paymentId: string | null
  appointmentId: string | null
  userId: string | null
  astrologerId: string | null
  event: string
  amount: string | null
  currency: string | null
  errorCode: string | null
  errorDescription: string | null
  rawPayload: unknown
  createdAt: string
}
