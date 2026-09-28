import type { Tree, ViewportBounds } from '../types/tree'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export interface TreesQuery extends ViewportBounds {
  search?: string
  species?: string
}

export async function fetchTreesInViewport(query: TreesQuery): Promise<Tree[]> {
  const params = new URLSearchParams({
    minLat: String(query.minLat),
    maxLat: String(query.maxLat),
    minLng: String(query.minLng),
    maxLng: String(query.maxLng),
    zoom: String(query.zoom),
  })
  if (query.search) params.set('search', query.search)

  if (!API_BASE) {
    const { treeService } = await import('./treeService')
    return treeService.getTreesInViewport(query)
  }

  const res = await fetch(`${API_BASE}/api/trees?${params}`)
  if (!res.ok) throw new Error('Failed to load trees')
  return res.json()
}

export async function registerTreeApi(tree: Tree): Promise<Tree> {
  if (!API_BASE) {
    const { treeService } = await import('./treeService')
    return treeService.registerTree(tree)
  }
  const res = await fetch(`${API_BASE}/api/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tree),
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}
