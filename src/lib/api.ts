import { API_BASE_URL } from './env'
import { tokenStore } from './token-store'
import type {
  AstrologerListItem,
  HealthResponse,
  ImageKitAuthParams,
  PaginationMeta,
  Post,
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

  getUploadToken: () => request<ImageKitAuthParams>('/admin/upload-token'),

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
