import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { TreeCaptureDraft } from '../types/tree'

interface YpDb extends DBSchema {
  pendingTrees: {
    key: string
    value: {
      id: string
      createdAt: number
      draft: TreeCaptureDraft
      photoBlob?: Blob
    }
  }
}

let dbPromise: Promise<IDBPDatabase<YpDb>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<YpDb>('yp-legacy-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pendingTrees', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function enqueueCapture(
  draft: TreeCaptureDraft,
  photoBlob?: Blob,
): Promise<string> {
  const id = crypto.randomUUID()
  const db = await getDb()
  await db.put('pendingTrees', {
    id,
    createdAt: Date.now(),
    draft,
    photoBlob,
  })
  return id
}

export async function listPending() {
  const db = await getDb()
  return db.getAll('pendingTrees')
}

export async function removePending(id: string) {
  const db = await getDb()
  await db.delete('pendingTrees', id)
}

export async function syncPending(
  register: (draft: TreeCaptureDraft) => Promise<void>,
): Promise<number> {
  if (!navigator.onLine) return 0
  const pending = await listPending()
  let synced = 0
  for (const item of pending) {
    try {
      await register(item.draft)
      await removePending(item.id)
      synced += 1
    } catch {
      break
    }
  }
  return synced
}
