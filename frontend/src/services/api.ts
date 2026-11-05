import type { Tree, ViewportBounds } from '../types/tree'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_PREFIX = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE}/api/v1`

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

function authHeaders(): Headers {
  const headers = new Headers()
  const token = localStorage.getItem('tree_tag_auth_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const csrfToken = sessionStorage.getItem('tree_tag_csrf_token')
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
  return headers
}

async function apiRequest<T>(path: string, init: RequestInit = {}, canRefresh = true): Promise<T> {
  const headers = new Headers(init.headers)
  authHeaders().forEach((value, key) => {
    if (!headers.has(key)) headers.set(key, value)
  })
  if (init.body && !(init.body instanceof Blob) && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && canRefresh && !path.startsWith('/auth/')) {
    const refreshed = await fetch(`${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': sessionStorage.getItem('tree_tag_csrf_token') || '',
      },
    })
    if (refreshed.ok) {
      const { token, csrf_token: csrfToken } = await refreshed.json() as { token: string; csrf_token: string }
      localStorage.setItem('tree_tag_auth_token', token)
      sessionStorage.setItem('tree_tag_csrf_token', csrfToken)
      return apiRequest<T>(path, init, false)
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json() as { detail?: string; error?: string }
      message = body.detail || body.error || message
    } catch {
      // Use the HTTP status when the server does not return JSON.
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function toQuery(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return params.toString()
}

export interface TreesQuery extends Partial<ViewportBounds> {
  page?: number
  limit?: number
  search?: string
  species?: string
  status?: string
  userId?: string
  institution?: string
  cluster?: string
}

export interface TreesResponse {
  trees: Tree[]
  total: number
  page: number
  totalPages: number
}

export interface PhotoRecord {
  id: number
  treeId: string
  objectKey: string
  photoType: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

export async function fetchTrees(query: TreesQuery = {}): Promise<TreesResponse> {
  const params = toQuery({
    page: query.page,
    limit: query.limit,
    search: query.search,
    species: query.species && query.species !== 'ALL' ? query.species : undefined,
    status: query.status && query.status !== 'ALL' ? query.status : undefined,
    user_id: query.userId,
  })
  return apiRequest<TreesResponse>(`/trees${params ? `?${params}` : ''}`)
}

export async function fetchTreesInViewport(query: TreesQuery & ViewportBounds): Promise<Tree[]> {
  const params = toQuery({
    min_lat: query.minLat,
    max_lat: query.maxLat,
    min_lng: query.minLng,
    max_lng: query.maxLng,
    zoom: query.zoom,
    user_id: query.userId,
    institution: query.institution,
    cluster: query.cluster,
    status: query.status && query.status !== 'ALL' ? query.status : undefined,
    limit: 500,
  })
  return apiRequest<Tree[]>(`/map/trees?${params}`)
}

export async function fetchTreeById(id: string): Promise<Tree | null> {
  try {
    const tree = await apiRequest<Tree>(`/trees/${encodeURIComponent(id)}`)
    const photos = await fetchTreePhotos(id)
    return {
      ...tree,
      imageUrl: photos[0]?.url || tree.imageUrl,
      images: photos.length ? photos.map((photo) => photo.url) : tree.images,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function registerTreeApi(tree: Tree): Promise<Tree> {
  const created = await apiRequest<Tree>('/trees', {
    method: 'POST',
    body: JSON.stringify(tree),
  })
  const { treeService } = await import('./treeService')
  treeService.addOrUpdateLocal(created)
  return created
}

export async function updateTreeApi(id: string, changes: Partial<Tree>): Promise<Tree> {
  return apiRequest<Tree>(`/trees/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export async function reviewTreeApi(
  id: string,
  status: 'VERIFIED' | 'REJECTED' | 'FLAGGED',
  adminNote?: string,
): Promise<Tree> {
  const action = status === 'VERIFIED' ? 'approve' : status === 'REJECTED' ? 'reject' : 'request-reverification'
  return apiRequest<Tree>(`/verification/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ status, adminNote }),
  })
}

export async function fetchPendingTreesApi(): Promise<Tree[]> {
  return apiRequest<Tree[]>('/verification/pending')
}

export async function deleteTreeApi(id: string): Promise<void> {
  await apiRequest<void>(`/trees/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function uploadPhotoApi(
  treeId: string,
  image: string | Blob,
  mimeType = 'image/jpeg',
  role = 'primary',
): Promise<{ id: string; url: string }> {
  const blob = image instanceof Blob ? image : await (await fetch(image)).blob()
  const contentType = blob.type || mimeType
  const presign = await apiRequest<{ uploadUrl: string; objectKey: string; headers: Record<string, string> }>(
    `/trees/${encodeURIComponent(treeId)}/photos/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: `${role}.${contentType.split('/')[1] || 'jpg'}`,
        mimeType: contentType,
        sizeBytes: blob.size,
        photoType: role,
      }),
    },
  )
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: blob,
  })
  if (!uploadResponse.ok) throw new ApiError('Image upload to Cloudflare R2 failed', uploadResponse.status)
  const photo = await apiRequest<PhotoRecord>(`/trees/${encodeURIComponent(treeId)}/photos/confirm`, {
    method: 'POST',
    body: JSON.stringify({ objectKey: presign.objectKey }),
  })
  return { id: String(photo.id), url: photo.url }
}

export async function fetchTreePhotos(treeId: string): Promise<PhotoRecord[]> {
  return apiRequest<PhotoRecord[]>(`/trees/${encodeURIComponent(treeId)}/photos`)
}

export async function addGpsReadingsApi(
  treeId: string,
  readings: Array<{ latitude: number; longitude: number; accuracy: number; altitude?: number; timestamp?: string }>,
): Promise<void> {
  await apiRequest(`/trees/${encodeURIComponent(treeId)}/gps-readings`, {
    method: 'POST',
    body: JSON.stringify(readings),
  })
}

export async function fetchStatsApi() {
  return apiRequest<{
    totalTrees: number
    pendingTrees: number
    verifiedTrees: number
    rejectedTrees: number
    totalUsers: number
  }>('/admin/dashboard/statistics')
}

export async function fetchPublicStatsApi() {
  return apiRequest<{
    totalTrees: number
    verifiedTrees: number
    institutionCount: number
    averageAccuracy: number | null
  }>('/public/statistics')
}

export async function fetchParticipantsApi() {
  return apiRequest<Array<Record<string, unknown>>>('/participants')
}

export async function registerUserApi(profile: Record<string, unknown> & { email: string; fullName: string; password: string }) {
  return apiRequest<{
    success: boolean
    user: { email: string; fullName: string; role: string }
    token: string
    csrfToken: string
  }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify(profile) },
  )
}

export async function loginApi(email: string, password: string) {
  return apiRequest<{
    success: boolean
    user: { email: string; fullName: string; role: string }
    token: string
    csrfToken: string
  }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )
}

export async function logoutApi(): Promise<void> {
  await apiRequest<void>('/auth/logout', { method: 'POST' })
}

export async function submitPartnerRequestApi(request: {
  orgName: string
  contactName: string
  email: string
  phone: string
  orgType: string
  message: string
}): Promise<void> {
  await apiRequest('/partner-requests', {
    method: 'POST',
    body: JSON.stringify({
      organizationName: request.orgName,
      contactName: request.contactName,
      email: request.email,
      phone: request.phone,
      organizationType: request.orgType,
      message: request.message,
    }),
  })
}
