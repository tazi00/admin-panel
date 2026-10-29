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

// My own post (from GET /posts/my — richer than admin list)
export interface MyPost {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT' | null
  bgColor: string | null
  textColor: string | null
  tags: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
}

// Consultation service variant (10/30/45/60/90 min duration + price)
export interface ServiceVariant {
  id: string
  durationMinutes: number
  price: string
  isDefault: boolean
}

// Consultation service
export interface ConsultationService {
  id: string
  isBasic: boolean          // Platform auto-created "Basic Consultation" — cannot be deactivated
  title: string
  shortDescription: string
  coverImage: string | null
  about: string
  tags: string[]
  isActive: boolean
  createdAt: string
  variants?: ServiceVariant[]  // Attached by getMyServices() — 5 duration options
}

// Astrologer profile
export interface AstrologerProfile {
  id: string
  bio: string | null
  experience: number | null
  languages: string[] | null
  specializations: string[] | null
  photoUrl: string | null
  rating: string | null
  totalReviews: number | null
  isVerified: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
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

// ─── Cancellation / Refund Requests ────────────────────────────────────────

export type CancellationRequestStatus =
  | 'pending'
  | 'refunded'
  | 'credited'
  | 'timing_changed'
  | 'admin_pending_money'
  | 'admin_pending_wallet'
  | 'admin_approved'
  | 'admin_rejected'

export interface RefundRequest {
  id: string
  appointmentId: string
  userId: string
  userName: string | null
  amount: string
  deductionAmount: number
  upiId: string | null
  status: CancellationRequestStatus
  initiatedBy: 'astrologer' | 'user'
  expiresAt: string
  createdAt: string
  updatedAt: string
}

// ─── Logs ──────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  source: string | null       // e.g. "appointments", "users", "cron"
  context: Record<string, unknown> | null  // extra JSON payload
  createdAt: string
}

export interface LogsResponse {
  logs: LogEntry[]
  meta: PaginationMeta
}

// ─── Payouts ───────────────────────────────────────────────────────────────

// A recorded payout — created when admin clicks "Mark as Paid"
export interface PayoutRecord {
  id: string
  astrologerId: string
  astrologerName: string | null
  month: string          // YYYY-MM
  amount: string         // amount paid (matches astrologer_payout from earnings)
  paidAt: string         // ISO timestamp
  notes: string | null   // optional notes from admin
}

export interface PayoutRecordsResponse {
  records: PayoutRecord[]
  meta?: PaginationMeta
}
