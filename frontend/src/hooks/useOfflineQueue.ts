import { useCallback, useEffect, useState } from 'react'
import { enqueueCapture, listPending, syncPending } from '../services/offlineQueue'
import type { TreeCaptureDraft } from '../types/tree'
import { registerTreeApi } from '../services/api'
import { treeService } from '../services/treeService'

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const refresh = useCallback(async () => {
    const items = await listPending()
    setPendingCount(items.length)
  }, [])

  const sync = useCallback(async () => {
    const { uploadPhotoApi } = await import('../services/api')
    const { addGpsReadingsApi } = await import('../services/api')

    const n = await syncPending(
      async (draft) => {
        const userId = localStorage.getItem('tree_tag_user_id') || 'field-worker'
        const tree = treeService.buildTreeFromDraft(draft, userId)
        if (!tree) throw new Error('Invalid draft')
        const created = await registerTreeApi(tree)
        if (draft.location?.readings.length) {
          await addGpsReadingsApi(created.id, draft.location.readings.map((reading) => ({
            latitude: reading.latitude,
            longitude: reading.longitude,
            accuracy: reading.accuracy,
            altitude: reading.altitude,
            timestamp: new Date(reading.timestamp).toISOString(),
          })))
        }
        return created.id
      },
      async (blob, key) => {
        const photo = await uploadPhotoApi(key, blob)
        return photo.url
      }
    )
    await refresh()
    return n
  }, [refresh])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      void sync()
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const timer = setTimeout(() => {
      void refresh()
    }, 0)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refresh, sync])

  const queue = useCallback(
    async (draft: TreeCaptureDraft, photoBlob?: Blob) => {
      await enqueueCapture(draft, photoBlob)
      await refresh()
    },
    [refresh],
  )

  return { pendingCount, isOnline, queue, sync, refresh }
}
