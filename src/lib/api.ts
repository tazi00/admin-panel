import { API_BASE_URL } from './env'
import { tokenStore } from './token-store'
import type {
  AdminAppointment,
  AstrologerListItem,
  AstrologerProfile,
  ConsultationService,
  EarningsSummaryResponse,
  AdminTransaction,
  TransactionEvent,
  HealthResponse,
  ImageKitAuthParams,
  MyPost,
  PaginationMeta,
  Post,
  RefundRequest,
  Role,
  Stats,
  User,
  VerificationStatus,
  YoutubeStats,
} from './types'

export class ApiError extends Error {
  statusCode: number
  code?: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const json = await res.json()
    const { accessToken, refreshToken: newRefreshToken } = json.data
    tokenStore.setTokens(accessToken, newRefreshToken)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = tokenStore.getAccessToken()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && retry) {
    // Ek hi refresh call ho, agar parallel requests fail ho rahi hain toh
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null))
    const refreshed = await refreshPromise
    if (refreshed) return request<T>(path, options, false)

    tokenStore.clear()
    window.location.href = '/login'
    throw new ApiError('Session expired', 401)
  }

  let json: any = null
  try {
    json = await res.json()
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(json?.message ?? 'Something went wrong', res.status, json?.error)
  }

  return json as T
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  adminLogin: (email: string, password: string) =>
    request<{
      success: boolean
      data: { accessToken: string; refreshToken: string; user: User; isNewUser: boolean }
    }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ success: boolean; data: { user: User } }>('/auth/me'),

  logoutAll: () => request<{ success: boolean }>('/auth/logout-all', { method: 'POST' }),
}

// ─── Admin: dashboard ───────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => request<Stats>('/admin/stats'),

  getHealth: () => request<HealthResponse>('/admin/health'),

  getUploadToken: () => request<ImageKitAuthParams>(`/admin/upload-token?_t=${Date.now()}`),

  getYoutubeStats: (params: { from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ success: boolean; data: YoutubeStats }>(`/admin/youtube/stats${suffix}`)
  },

  // ── Users ──────────────────────────────────────────────────────────────
  listUsers: (params: {
    search?: string
    role?: Role
    isBanned?: boolean
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.role) qs.set('role', params.role)
    if (params.isBanned !== undefined) qs.set('isBanned', String(params.isBanned))
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ users: User[]; meta: PaginationMeta }>(`/admin/users?${qs.toString()}`)
  },

  banUser: (id: string, isBanned: boolean, reason?: string) =>
    request<{ message: string; user: User }>(`/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned, reason }),
    }),

  updateUserRole: (id: string, role: Role) =>
    request<{ message: string; user: User }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  // ── Astrologers / Verification ─────────────────────────────────────────
  listAstrologers: (params: {
    search?: string
    status?: VerificationStatus
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.status) qs.set('status', params.status)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ astrologers: AstrologerListItem[]; meta: PaginationMeta }>(
      `/admin/astrologers?${qs.toString()}`,
    )
  },

  getAstrologer: (id: string) => request<AstrologerListItem>(`/admin/astrologers/${id}`),

  updateDocuments: (id: string, document1Url?: string | null, document2Url?: string | null) =>
    request<{ message: string }>(`/admin/astrologers/${id}/documents`, {
      method: 'PATCH',
      body: JSON.stringify({ document1Url, document2Url }),
    }),

  updateVerification: (id: string, status: VerificationStatus, rejectionReason?: string) =>
    request<{ message: string }>(`/admin/astrologers/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    }),

  updateCommission: (id: string, commissionPercentage: number) =>
    request<{ message: string }>(`/admin/astrologers/${id}/commission`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionPercentage }),
    }),

  // ── Categories ───────────────────────────────────────────────────────────
  setCategoryHeroVideo: (id: string, heroVideoUrl: string) =>
    request<{ success: boolean; data: { categoryId: string; heroVideoUrl: string } }>(
      `/admin/categories/${id}/hero-video`,
      { method: 'PATCH', body: JSON.stringify({ heroVideoUrl }) },
    ),

  // ── Posts ───────────────────────────────────────────────────────────────
  listPosts: (params: { search?: string; astrologerId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ posts: Post[]; meta: PaginationMeta }>(`/admin/posts?${qs.toString()}`)
  },

  deletePost: (id: string) => request<{ message: string }>(`/admin/posts/${id}`, { method: 'DELETE' }),

  // ── Appointments ──────────────────────────────────────────────────────────
  listAppointments: (params: {
    status?: string
    astrologerId?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    if (params.userId) qs.set('userId', params.userId)
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom)
    if (params.dateTo) qs.set('dateTo', params.dateTo)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ appointments: AdminAppointment[]; meta: PaginationMeta }>(
      `/admin/appointments?${qs.toString()}`,
    )
  },

  // ── Earnings ──────────────────────────────────────────────────────────────
  getEarnings: (params: {
    astrologerId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom)
    if (params.dateTo) qs.set('dateTo', params.dateTo)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<EarningsSummaryResponse>(`/admin/earnings?${qs.toString()}`)
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  listTransactions: (params: {
    status?: string
    userId?: string
    astrologerId?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.userId) qs.set('userId', params.userId)
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ transactions: AdminTransaction[]; pagination: PaginationMeta }>(
      `/admin/transactions?${qs.toString()}`,
    )
  },

  // ── Refund / Cancellation requests ───────────────────────────────────────
  listRefundRequests: (filter: 'pending' | 'all' = 'pending') =>
    request<{ success: boolean; data: { requests: RefundRequest[] } }>(
      `/admin/cancellation-requests?filter=${filter}`,
    ),

  approveRefundRequest: (id: string) =>
    request<{ success: boolean; data: { request: RefundRequest } }>(
      `/admin/cancellation-requests/${id}/approve`,
      { method: 'PATCH' },
    ),

  rejectRefundRequest: (id: string, reason?: string) =>
    request<{ success: boolean; data: { request: RefundRequest } }>(
      `/admin/cancellation-requests/${id}/reject`,
      { method: 'PATCH', body: JSON.stringify({ reason }) },
    ),

  listTransactionEvents: (params: {
    event?: string
    userId?: string
    astrologerId?: string
    razorpayOrderId?: string
    appointmentId?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.event) qs.set('event', params.event)
    if (params.userId) qs.set('userId', params.userId)
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    if (params.razorpayOrderId) qs.set('razorpayOrderId', params.razorpayOrderId)
    if (params.appointmentId) qs.set('appointmentId', params.appointmentId)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ events: TransactionEvent[]; pagination: PaginationMeta }>(
      `/admin/transaction-events?${qs.toString()}`,
    )
  },

  // ── Logs ───────────────────────────────────────────────────────────────────
  listLogs: (params: {
    level?: string
    source?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.level) qs.set('level', params.level)
    if (params.source) qs.set('source', params.source)
    if (params.search) qs.set('search', params.search)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 50))
    return request<{ logs: import('./types').LogEntry[]; meta: import('./types').PaginationMeta }>(
      `/admin/logs?${qs.toString()}`,
    )
  },

  // ── Payouts ────────────────────────────────────────────────────────────────
  listPayoutRecords: (month: string) =>
    request<import('./types').PayoutRecordsResponse>(`/admin/payouts?month=${month}`),

  markPayoutPaid: (astrologerId: string, month: string, amount: string, notes?: string) =>
    request<import('./types').PayoutRecord>(`/admin/payouts`, {
      method: 'POST',
      body: JSON.stringify({ astrologerId, month, amount, notes }),
    }),

  listPayoutHistory: (params: {
    astrologerId?: string
    month?: string
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.astrologerId) qs.set('astrologerId', params.astrologerId)
    if (params.month) qs.set('month', params.month)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    return request<{ records: import('./types').PayoutRecord[]; meta: import('./types').PaginationMeta }>(
      `/admin/payouts/history?${qs.toString()}`,
    )
  },

  getUserPaymentSummary: (userId: string) =>
    request<{ totalPaid: string; totalSessions: number; totalRefunded: string }>(
      `/admin/users/${userId}/payment-summary`,
    ),
}

// ─── My profile / posts / services (admin acting as AstroBook Official) ────
// Admin is also an approved astrologer, so these hit the regular
// astrologer-facing endpoints (not admin/* routes).

export const myApi = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getMe: () =>
    request<{ id: string; name: string | null; bio: string | null; avatarUrl: string | null; email: string | null }>('/users/me'),

  updateMe: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
    request<{ id: string; name: string | null; bio: string | null; avatarUrl: string | null }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAstrologerProfile: () =>
    request<{ hasApplied: boolean; verificationStatus: string | null; rejectionReason: string | null }>(
      '/users/me/astrologer-application',
    ),

  updateAstrologerProfile: (data: {
    bio?: string
    experience?: number
    languages?: string[]
    specializations?: string[]
    photoUrl?: string
  }) =>
    request<{ success: boolean; data: AstrologerProfile }>('/users/me/astrologer-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ── Posts ──────────────────────────────────────────────────────────────
  // backend { success, data: { posts, hasMore } } wrap karta hai — .data unwrap karo
  getMyPosts: () =>
    request<{ success: boolean; data: { posts: MyPost[]; hasMore: boolean } }>('/posts/my')
      .then((r) => r.data),

  // cache-busting param — browser same token cache na kare, warna ImageKit dusre use par reject karta hai
  // backend { success, data: ImageKitAuthParams } wrap karta hai — .data unwrap karo
  getPostUploadToken: () =>
    request<{ success: boolean; data: ImageKitAuthParams }>(`/posts/upload-token?_t=${Date.now()}`)
      .then((res) => res.data),

  createPost: (data: {
    content: string
    mediaUrl?: string
    mediaType?: 'IMAGE' | 'VIDEO' | 'TEXT'
    bgColor?: string
    textColor?: string
  }) =>
    request<{ success: boolean; data: MyPost }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  // ── Consultation services ─────────────────────────────────────────────
  // backend { success, data: { services } } wrap karta hai — .data unwrap karo
  getMyServices: () =>
    request<{ success: boolean; data: { services: ConsultationService[] } }>('/consultation/services/mine')
      .then((r) => r.data),

  createService: (data: {
    title: string
    shortDescription: string
    coverImage: string
    about: string
    tags: string[]
  }) =>
    request<{ success: boolean; data: ConsultationService }>('/consultation/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteService: (id: string) =>
    request<{ success: boolean }>(`/consultation/services/${id}`, { method: 'DELETE' }),
}

// ─── ImageKit direct upload (for astrologer documents) ─────────────────────

export async function uploadToImageKit(
  file: File,
  auth: ImageKitAuthParams,
  publicKey: string,
  urlEndpoint: string,
  folder = '/astrobook/admin-documents',
): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('fileName', file.name)
  form.append('publicKey', publicKey)
  form.append('signature', auth.signature)
  form.append('expire', String(auth.expire))
  form.append('token', auth.token)
  form.append('folder', folder)
  form.append('useUniqueFileName', 'true')

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ImageKit upload failed: ${text}`)
  }
  const json = await res.json()
  return json.url ?? `${urlEndpoint}/${json.filePath}`
}
