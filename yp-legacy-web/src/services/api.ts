import type { Tree, ViewportBounds } from '../types/tree'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('tree_tag_auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface TreesQuery extends Partial<ViewportBounds> {
  page?: number
  limit?: number
  search?: string
  species?: string
  status?: string
  userId?: string
}

export interface TreesResponse {
  trees: Tree[]
  total: number
  page: number
  totalPages: number
}

export async function fetchTrees(query: TreesQuery = {}): Promise<TreesResponse> {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  if (query.search) params.set('search', query.search)
  if (query.species && query.species !== 'ALL') params.set('species', query.species)
  if (query.status && query.status !== 'ALL') params.set('status', query.status)
  if (query.userId) params.set('userId', query.userId)

  if (query.minLat !== undefined && query.maxLat !== undefined && query.minLng !== undefined && query.maxLng !== undefined) {
    params.set('minLat', String(query.minLat))
    params.set('maxLat', String(query.maxLat))
    params.set('minLng', String(query.minLng))
    params.set('maxLng', String(query.maxLng))
  }
  if (query.zoom !== undefined) params.set('zoom', String(query.zoom))

  try {
    const res = await fetch(`${API_BASE}/api/trees?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load trees`)
    return await res.json()
  } catch {
    // Fallback to local store if offline
    const { treeService } = await import('./treeService')
    const local = treeService.getAll()
    return {
      trees: local.slice(0, query.limit || 20),
      total: local.length,
      page: query.page || 1,
      totalPages: Math.ceil(local.length / (query.limit || 20)),
    }
  }
}

export async function fetchTreesInViewport(query: TreesQuery & ViewportBounds): Promise<Tree[]> {
  const result = await fetchTrees({
    ...query,
    limit: 200,
  })
  return result.trees
}

export async function fetchTreeById(id: string): Promise<Tree | null> {
  try {
    const res = await fetch(`${API_BASE}/api/trees/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    const { treeService } = await import('./treeService')
    return treeService.getById(id) || null
  }
}

export async function registerTreeApi(tree: Tree): Promise<Tree> {
  const res = await fetch(`${API_BASE}/api/trees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tree),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Registration failed')
  }
  const created: Tree = await res.json()
  // Synchronize local cache
  const { treeService } = await import('./treeService')
  treeService.addOrUpdateLocal(created)
  return created
}

export async function reviewTreeApi(
  id: string,
  status: 'VERIFIED' | 'REJECTED' | 'FLAGGED',
  adminNote?: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/trees/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, adminNote }),
  })
  if (!res.ok) throw new Error('Failed to review tree record')
  const data = await res.json()
  if (data.tree) {
    const { treeService } = await import('./treeService')
    treeService.addOrUpdateLocal(data.tree)
  }
  return true
}

export async function deleteTreeApi(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/trees/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete tree record')
  const { treeService } = await import('./treeService')
  treeService.removeLocal(id)
  return true
}

export async function uploadPhotoApi(
  treeId: string,
  imageBase64: string,
  mimeType = 'image/jpeg',
  role = 'primary'
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API_BASE}/api/photos/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ treeId, imageBase64, mimeType, role }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to upload photo')
  }
  const data = await res.json()
  return data.photo
}

export async function fetchStatsApi() {
  const res = await fetch(`${API_BASE}/api/stats`)
  if (!res.ok) throw new Error('Failed to fetch statistics')
  return res.json()
}

export async function fetchParticipantsApi() {
  const res = await fetch(`${API_BASE}/api/participants`)
  if (!res.ok) throw new Error('Failed to fetch participants')
  return res.json()
}
