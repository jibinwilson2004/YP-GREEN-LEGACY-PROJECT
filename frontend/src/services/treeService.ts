import type { Tree, TreeCaptureDraft, ViewportBounds } from '../types/tree'
import { authService, formatDisplayName } from './authService'
import { reviewTreeApi, deleteTreeApi, fetchTrees } from './api'

const STORAGE_KEY = 'yp-legacy-trees'

function loadStore(): Tree[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Tree[]
      void fetchTrees({ limit: 200 }).then((response) => {
        cache = response.trees
        if (response.trees.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(response.trees))
        window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees: response.trees } }))
      }).catch((error) => console.warn('[Tree API unavailable; using cached trees]', error))
      return parsed
    }
  } catch {
    console.warn('[Tree cache could not be read]')
  }
  void fetchTrees({ limit: 200 }).then((response) => {
    cache = response.trees
    if (response.trees.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(response.trees))
    window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees: response.trees } }))
  }).catch((error) => console.warn('[Tree API unavailable]', error))
  return []
}

function saveStore(trees: Tree[]) {
  cache = trees
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees } }))
  }
}


let cache: Tree[] | null = null

function trees(): Tree[] {
  if (!cache) cache = loadStore()
  return cache
}

function inViewport(t: Tree, q: ViewportBounds): boolean {
  return (
    t.latitude >= q.minLat &&
    t.latitude <= q.maxLat &&
    t.longitude >= q.minLng &&
    t.longitude <= q.maxLng
  )
}

export interface ParticipantStats {
  userId: string
  displayName: string
  fullName: string
  institution?: string
  registeredAt?: string
  treeCount: number
  pendingCount: number
  verifiedCount: number
}

export function generateTreeTagId(
  usernameOrEmail?: string,
  country?: string,
  timestamp?: number
): string {
  const rawUser = (usernameOrEmail || 'user').split('@')[0]
  const cleanUser = rawUser
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'user'

  const cleanCountry = (country || 'india')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'global'

  const ts = timestamp ?? Math.floor(Date.now() / 1000)
  return `${cleanUser}_${cleanCountry}_${ts}`
}

export const treeService = {
  getAll(): Tree[] {
    return [...trees()]
  },

  getById(id: string): Tree | undefined {
    return trees().find((t) => t.id === id)
  },

  getTreesInViewport(query: ViewportBounds & { search?: string }): Tree[] {
    let list = trees().filter((t) => inViewport(t, query))
    if (query.search?.trim()) {
      const s = query.search.toLowerCase()
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(s) ||
          t.species.toLowerCase().includes(s),
      )
    }
    return list
  },

  getTotalCount(): number {
    return trees().length
  },

  getByUser(userId: string): Tree[] {
    return trees().filter((t) => t.userId === userId)
  },

  getPending(): Tree[] {
    return trees().filter((t) => t.verificationStatus === 'PENDING')
  },

  async approveTree(id: string, adminNote?: string): Promise<boolean> {
    const updated = await reviewTreeApi(id, 'VERIFIED', adminNote)
    this.addOrUpdateLocal(updated)
    return true
  },

  async rejectTree(id: string, adminNote?: string): Promise<boolean> {
    const updated = await reviewTreeApi(id, 'REJECTED', adminNote)
    this.addOrUpdateLocal(updated)
    return true
  },

  async deleteTree(id: string): Promise<boolean> {
    await deleteTreeApi(id)
    this.removeLocal(id)
    return true
  },

  addOrUpdateLocal(tree: Tree) {
    const store = trees()
    const idx = store.findIndex((t) => t.id === tree.id)
    if (idx >= 0) {
      store[idx] = { ...store[idx], ...tree }
    } else {
      store.unshift(tree)
    }
    cache = store
    saveStore(store)
  },

  removeLocal(id: string) {
    const store = trees()
    const idx = store.findIndex((t) => t.id === id)
    if (idx >= 0) {
      store.splice(idx, 1)
      cache = store
      saveStore(store)
    }
  },

  getAllParticipants(): ParticipantStats[] {
    const store = trees()
    const registeredUsers = authService.getRegisteredUsers()
    const map = new Map<string, ParticipantStats>()

    // Initialize registered users
    for (const u of registeredUsers) {
      const uid = u.email.toLowerCase()
      map.set(uid, {
        userId: u.email,
        displayName: formatDisplayName(u.email, u.fullName),
        fullName: u.fullName || formatDisplayName(u.email),
        institution: u.institution,
        registeredAt: u.registeredAt,
        treeCount: 0,
        pendingCount: 0,
        verifiedCount: 0,
      })
    }

    // Accumulate tree stats
    for (const t of store) {
      if (!t.userId) continue
      const uid = t.userId.toLowerCase()
      const existing = map.get(uid) ?? {
        userId: t.userId,
        displayName: formatDisplayName(t.userId, t.student),
        fullName: t.student || formatDisplayName(t.userId),
        institution: t.institution || t.college,
        treeCount: 0,
        pendingCount: 0,
        verifiedCount: 0,
      }
      existing.treeCount += 1
      if (t.verificationStatus === 'PENDING') existing.pendingCount += 1
      if (t.verificationStatus === 'VERIFIED') existing.verifiedCount += 1
      map.set(uid, existing)
    }

    return Array.from(map.values()).sort((a, b) => b.treeCount - a.treeCount)
  },

  async getAllParticipantsAsync(): Promise<ParticipantStats[]> {
    const store = trees()
    const registeredUsers = await authService.getAllUsersAsync()
    const map = new Map<string, ParticipantStats>()

    for (const u of registeredUsers) {
      const uid = u.email.toLowerCase()
      map.set(uid, {
        userId: u.email,
        displayName: formatDisplayName(u.email, u.fullName),
        fullName: u.fullName || formatDisplayName(u.email),
        institution: u.institution,
        registeredAt: u.registeredAt,
        treeCount: 0,
        pendingCount: 0,
        verifiedCount: 0,
      })
    }

    for (const t of store) {
      if (!t.userId) continue
      const uid = t.userId.toLowerCase()
      const existing = map.get(uid) ?? {
        userId: t.userId,
        displayName: formatDisplayName(t.userId, t.student),
        fullName: t.student || formatDisplayName(t.userId),
        institution: t.institution || t.college,
        treeCount: 0,
        pendingCount: 0,
        verifiedCount: 0,
      }
      existing.treeCount += 1
      if (t.verificationStatus === 'PENDING') existing.pendingCount += 1
      if (t.verificationStatus === 'VERIFIED') existing.verifiedCount += 1
      map.set(uid, existing)
    }

    return Array.from(map.values()).sort((a, b) => b.treeCount - a.treeCount)
  },

  nextTreeId(usernameOrEmail?: string, country?: string): string {
    const user = usernameOrEmail || (typeof window !== 'undefined' ? localStorage.getItem('tree_tag_user_id') || undefined : undefined)
    return generateTreeTagId(user, country)
  },

  async fetchLatestFromDb(): Promise<Tree[]> {
    const response = await fetchTrees({ limit: 200 })
    cache = response.trees
    if (response.trees.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(response.trees))
    window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees: response.trees } }))
    return response.trees
  },


  registerTree(tree: Tree): Tree {
    const store = trees()
    // Avoid duplicate insertions
    if (!store.some((t) => t.id === tree.id)) {
      store.unshift(tree)
    }
    cache = store
    saveStore(store)

    return tree
  },


  buildTreeFromDraft(
    draft: TreeCaptureDraft,
    userId?: string,
  ): Tree | null {
    if (!draft.location || !draft.species) return null
    const userIdentifier = userId || (typeof window !== 'undefined' ? localStorage.getItem('tree_tag_user_id') || undefined : undefined)
    const countryName = draft.country || 'India'
    const id = (draft.treeIdPreview && !draft.treeIdPreview.startsWith('YP-'))
      ? draft.treeIdPreview
      : generateTreeTagId(userIdentifier, countryName)

    let studentName: string | undefined
    let institutionName: string | undefined
    if (userId) {
      try {
        const raw = localStorage.getItem(`tree_tag_user_${userId}`) || localStorage.getItem('tree_tag_user')
        if (raw) {
          const p = JSON.parse(raw) as { fullName?: string; institution?: string }
          if (p.fullName) studentName = p.fullName
          if (p.institution) institutionName = p.institution
        }
      } catch { /* ignore */ }
      if (!studentName) studentName = formatDisplayName(userId)
    }

    const todayStr = new Date().toLocaleDateString('en-IN')

    return {
      id,
      species: draft.species,
      commonName: draft.commonName || draft.species,
      imageUrl: draft.photoPreviewUrl,
      latitude: draft.location.latitude,
      longitude: draft.location.longitude,
      accuracy: draft.location.accuracy,
      gpsSource: draft.location.source,
      locationConfidence: draft.location.confidence,
      locationStatus: draft.location.status,
      readingCount: draft.location.readingCount,
      stabilityScore: draft.location.stabilityScore,
      capturedAt: new Date().toISOString(),
      dateOfPlanting: todayStr,
      updatedAt: todayStr,
      userId,
      student: studentName || 'IEEE YP CSTF Planter',
      college: institutionName || 'IEEE YP Green Legacy Campus Unit',
      cluster: 'IEEE-YP',
      institution: institutionName || 'APJAKTU NSSCELL NRPF',
      country: draft.country || 'India',
      verificationStatus: 'PENDING',
      identificationConfidence: draft.identificationConfidence,
    }
  },
}