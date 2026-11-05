import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { TreeCaptureDraft } from '../types/tree'

export type QueueItemStatus =
  | 'DRAFT'
  | 'PENDING_SYNC'
  | 'UPLOADING_PHOTO'
  | 'PENDING_TREE_PERSIST'
  | 'SYNCED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FATAL'

export interface QueuedSubmission {
  id: string
  submissionKey: string
  status: QueueItemStatus
  createdAt: number
  updatedAt: number
  retryCount: number
  nextRetryTime: number
  lastError?: string
  photoUploadedUrl?: string
  registeredTreeId?: string
  draft: TreeCaptureDraft
  photoBlob?: Blob
}

interface YpDb extends DBSchema {
  pendingTrees: {
    key: string
    value: QueuedSubmission
  }
}

let dbPromise: Promise<IDBPDatabase<YpDb>> | null = null
let isSyncInProgress = false

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<YpDb>('yp-legacy-offline', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('pendingTrees', { keyPath: 'id' })
        }
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
  const submissionKey = draft.treeIdPreview || `sub_${Date.now()}_${id.slice(0, 8)}`
  const now = Date.now()
  const item: QueuedSubmission = {
    id,
    submissionKey,
    status: 'PENDING_SYNC',
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    nextRetryTime: now,
    draft,
    photoBlob,
  }

  const db = await getDb()
  await db.put('pendingTrees', item)
  return id
}

export async function listPending(): Promise<QueuedSubmission[]> {
  const db = await getDb()
  return db.getAll('pendingTrees')
}

export async function removePending(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('pendingTrees', id)
}

export async function updatePendingItem(item: QueuedSubmission): Promise<void> {
  const db = await getDb()
  item.updatedAt = Date.now()
  await db.put('pendingTrees', item)
}

// Bounded exponential backoff with jitter: 2s, 4s, 8s, 16s, 32s + jitter
function calculateBackoff(retryCount: number): number {
  const baseMs = 2000
  const maxMs = 60000
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, retryCount))
  const jitter = Math.random() * 1000
  return exponential + jitter
}

export async function syncPending(
  registerTree: (draft: TreeCaptureDraft) => Promise<string>,
  uploadPhoto?: (blob: Blob, treeId: string) => Promise<string>
): Promise<number> {
  if (!navigator.onLine || isSyncInProgress) return 0
  isSyncInProgress = true

  let synced = 0
  try {
    const pending = await listPending()
    const now = Date.now()

    for (const item of pending) {
      if (item.status === 'FAILED_FATAL') continue
      if (item.nextRetryTime > now) continue
      if (item.retryCount >= 5) {
        item.status = 'FAILED_FATAL'
        item.lastError = 'Maximum retry limit (5 attempts) exceeded'
        await updatePendingItem(item)
        continue
      }

      try {
        if (!item.registeredTreeId) {
          item.status = 'PENDING_TREE_PERSIST'
          await updatePendingItem(item)
          item.registeredTreeId = await registerTree(item.draft)
          await updatePendingItem(item)
        }

        if (item.photoBlob && !item.photoUploadedUrl && uploadPhoto) {
          item.status = 'UPLOADING_PHOTO'
          await updatePendingItem(item)
          item.photoUploadedUrl = await uploadPhoto(item.photoBlob, item.registeredTreeId)
          await updatePendingItem(item)
        }

        item.status = 'SYNCED'
        await removePending(item.id)
        synced += 1
      } catch (err: any) {
        item.retryCount += 1
        item.lastError = err.message || 'Network sync error'
        item.nextRetryTime = Date.now() + calculateBackoff(item.retryCount)
        item.status = 'FAILED_RETRYABLE'
        await updatePendingItem(item)
      }
    }
  } finally {
    isSyncInProgress = false
  }

  return synced
}
