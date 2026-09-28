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
    const n = await syncPending(async (draft) => {
      const tree = treeService.buildTreeFromDraft(draft, 'field-worker')
      if (!tree) throw new Error('Invalid draft')
      await registerTreeApi(tree)
    })
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
    void refresh()
    return () => {
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
