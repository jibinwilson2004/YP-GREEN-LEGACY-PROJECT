import { useCallback, useMemo, useState } from 'react'
import type { TreeCaptureDraft } from '../types/tree'
import { treeService } from '../services/treeService'
import {
  detectDuplicateLocation,
  detectSuspiciousMovement,
} from '../services/anomalyDetection'

export type CaptureStep =
  | 'intro'
  | 'location'
  | 'photo'
  | 'details'
  | 'review'
  | 'success'

export function useTreeCapture() {
  const [step, setStep] = useState<CaptureStep>('intro')
  const [draft, setDraft] = useState<TreeCaptureDraft>({
    species: '',
    identificationConfidence: 0,
    anomalies: [],
    treeIdPreview: treeService.nextTreeId(),
  })

  const updateDraft = useCallback((patch: Partial<TreeCaptureDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  const recomputeAnomalies = useCallback(() => {
    if (!draft.location) return
    const existing = treeService.getAll()
    const extra = [
      detectDuplicateLocation(
        draft.location.latitude,
        draft.location.longitude,
        existing,
      ),
      detectSuspiciousMovement(
        'field-worker',
        draft.location.latitude,
        draft.location.longitude,
        existing,
        Date.now(),
      ),
    ].filter(Boolean) as TreeCaptureDraft['anomalies']
    updateDraft({
      anomalies: [...draft.anomalies, ...extra],
    })
  }, [draft.anomalies, draft.location, updateDraft])

  const identificationConfidence = useMemo(() => {
    if (!draft.species.trim()) return 0
    let score = 72
    if (draft.commonName?.trim()) score += 10
    if (draft.photoPreviewUrl) score += 12
    if (draft.species.length > 4) score += 6
    return Math.min(98, score)
  }, [draft.commonName, draft.photoPreviewUrl, draft.species])

  const goNext = useCallback(() => {
    const order: CaptureStep[] = [
      'intro',
      'location',
      'photo',
      'details',
      'review',
      'success',
    ]
    const i = order.indexOf(step)
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1])
  }, [step])

  const goBack = useCallback(() => {
    const order: CaptureStep[] = [
      'intro',
      'location',
      'photo',
      'details',
      'review',
      'success',
    ]
    const i = order.indexOf(step)
    if (i > 0) setStep(order[i - 1])
  }, [step])

  return {
    step,
    setStep,
    draft,
    updateDraft,
    identificationConfidence,
    recomputeAnomalies,
    goNext,
    goBack,
  }
}
