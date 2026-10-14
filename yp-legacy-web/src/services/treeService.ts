import type { Tree, TreeCaptureDraft, ViewportBounds } from '../types/tree'
import { authService, formatDisplayName } from './authService'
import { neonService } from './neonService'
import { reviewTreeApi, deleteTreeApi, fetchTrees } from './api'

const STORAGE_KEY = 'yp-legacy-trees'
let seq = 1

function mergeTrees(local: Tree[], remote: Tree[]): Tree[] {
  const map = new Map<string, Tree>()

  // Remote trees first
  for (const r of remote) {
    map.set(r.id, r)
  }

  // Local trees override or add if not present in remote
  for (const l of local) {
    const existing = map.get(l.id)
    if (!existing) {
      map.set(l.id, l)
    } else {
      // Keep local image URL if base64 and remote is blank
      const imageUrl = l.imageUrl && l.imageUrl.startsWith('data:') ? l.imageUrl : existing.imageUrl || l.imageUrl
      map.set(l.id, {
        ...existing,
        ...l,
        imageUrl,
      })
    }
  }

  const merged = Array.from(map.values())
  // Re-calculate max seq number
  const max = merged.reduce((m, t) => {
    const n = parseInt(t.id.replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  if (max >= seq) seq = max + 1

  return merged
}

function loadStore(): Tree[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Tree[]
      const max = parsed.reduce((m, t) => {
        const n = parseInt(t.id.replace(/\D/g, ''), 10)
        return Number.isFinite(n) ? Math.max(m, n) : m
      }, 0)
      seq = max + 1
      // Asynchronously load and sync from Neon Postgres
      neonService.fetchTreesFromDb().then((remoteTrees) => {
        if (remoteTrees && remoteTrees.length > 0) {
          const merged = mergeTrees(parsed, remoteTrees)
          cache = merged
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees: merged } }))
          }
        } else {
          neonService.syncTreesToDb(parsed)
        }
      }).catch(() => { /* ignore */ })
      return parsed
    }
  } catch {
    /* ignore */
  }
  const seeds = seedTrees()
  neonService.syncTreesToDb(seeds)
  return seeds
}

function saveStore(trees: Tree[]) {
  cache = trees
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees))
  neonService.syncTreesToDb(trees).catch(() => { /* ignore */ })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees } }))
  }
}


function seedTrees(): Tree[] {
  const base: Tree[] = [
    {
      id: 'YP-000001',
      species: 'Azadirachta indica',
      commonName: 'Neem',
      botanicalName: 'Azadirachta indica',
      imageUrl: '/assets/images/tree-sapling.png',
      images: [
        '/assets/images/tree-sapling.png',
        '/assets/images/hero-misty-forest.png',
        '/assets/images/pine-forest-aerial.png',
      ],
      latitude: 10.0528,
      longitude: 76.6346,
      accuracy: 4.2,
      altitude: 48.5,
      gpsSource: 'SMARTPHONE_GPS',
      locationConfidence: 96,
      locationStatus: 'HIGH',
      readingCount: 12,
      stabilityScore: 96,
      gpsStability: 'STABLE',
      capturedAt: '2026-08-31T10:30:00.000Z',
      dateOfPlanting: '31-08-2026',
      updatedAt: '31-08-2026',
      student: 'SORNA SAKTHI GANESH V',
      college: 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV',
      cluster: 'TRV',
      institution: 'APJAKTU NSSCELL NRPF',
      userId: 'jibin-wilson',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'IEEE YP CSTF',
      verificationDate: '31-08-2026',
      identificationConfidence: 91,
    },
    {
      id: 'YP-002849',
      species: 'Terminalia arjuna',
      latitude: 9.9312,
      longitude: 76.2673,
      accuracy: 5.1,
      gpsSource: 'SMARTPHONE_GPS',
      locationConfidence: 88,
      locationStatus: 'HIGH',
      readingCount: 10,
      stabilityScore: 82,
      capturedAt: new Date('2023-11-01').toISOString(),
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'YP-008924',
      species: 'Swietenia mahagoni',
      latitude: 11.6854,
      longitude: 76.132,
      accuracy: 6.3,
      gpsSource: 'SMARTPHONE_GPS',
      locationConfidence: 84,
      locationStatus: 'MEDIUM',
      readingCount: 9,
      stabilityScore: 78,
      capturedAt: new Date('2023-10-20').toISOString(),
      verificationStatus: 'VERIFIED',
    },
  ]
  saveStore(base)
  seq = 8925
  return base
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
    return 55918
  },

  getByUser(userId: string): Tree[] {
    return trees().filter((t) => t.userId === userId)
  },

  getPending(): Tree[] {
    return trees().filter((t) => t.verificationStatus === 'PENDING')
  },

  approveTree(id: string, adminNote?: string): boolean {
    const store = trees()
    const idx = store.findIndex((t) => t.id === id)
    if (idx === -1) return false
    store[idx] = {
      ...store[idx],
      verificationStatus: 'VERIFIED',
      verifiedBy: 'IEEE YP CSTF Admin',
      verificationDate: new Date().toLocaleDateString('en-IN'),
      adminNote,
    }
    cache = store
    saveStore(store)
    reviewTreeApi(id, 'VERIFIED', adminNote).catch(() => {})
    return true
  },

  rejectTree(id: string, adminNote?: string): boolean {
    const store = trees()
    const idx = store.findIndex((t) => t.id === id)
    if (idx === -1) return false
    store[idx] = {
      ...store[idx],
      verificationStatus: 'REJECTED',
      verifiedBy: 'IEEE YP CSTF Admin',
      verificationDate: new Date().toLocaleDateString('en-IN'),
      adminNote,
    }
    cache = store
    saveStore(store)
    reviewTreeApi(id, 'REJECTED', adminNote).catch(() => {})
    return true
  },

  deleteTree(id: string): boolean {
    const store = trees()
    const idx = store.findIndex((t) => t.id === id)
    if (idx === -1) return false
    store.splice(idx, 1)
    cache = store
    saveStore(store)
    deleteTreeApi(id).catch(() => {})
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

  nextTreeId(): string {
    const id = `YP-${String(seq).padStart(6, '0')}`
    seq += 1
    return id
  },

  async fetchLatestFromDb(): Promise<Tree[]> {
    try {
      const res = await fetchTrees({ limit: 100 })
      if (res && res.trees && res.trees.length > 0) {
        const merged = mergeTrees(trees(), res.trees)
        cache = merged
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trees-updated', { detail: { trees: merged } }))
        }
        return merged
      }
    } catch { /* ignore */ }
    return trees()
  },


  registerTree(tree: Tree): Tree {
    const store = trees()
    // Avoid duplicate insertions
    if (!store.some((t) => t.id === tree.id)) {
      store.unshift(tree)
    }
    cache = store
    saveStore(store)

    // Notify backend and admin asynchronously
    try {
      fetch('/api/notify-tree-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeId: tree.id,
          species: tree.species,
          planter: tree.student || tree.userId || 'Anonymous Planter',
          latitude: tree.latitude,
          longitude: tree.longitude,
        }),
      }).catch(() => {
        fetch('http://127.0.0.1:5001/api/notify-tree-tag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            treeId: tree.id,
            species: tree.species,
            planter: tree.student || tree.userId || 'Anonymous Planter',
            latitude: tree.latitude,
            longitude: tree.longitude,
          }),
        }).catch(() => { /* ignore */ })
      })
    } catch { /* ignore */ }

    return tree
  },


  buildTreeFromDraft(
    draft: TreeCaptureDraft,
    userId?: string,
  ): Tree | null {
    if (!draft.location || !draft.species) return null
    const id = draft.treeIdPreview ?? this.nextTreeId()

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
      verificationStatus: 'PENDING',
      identificationConfidence: draft.identificationConfidence,
    }
  },
}