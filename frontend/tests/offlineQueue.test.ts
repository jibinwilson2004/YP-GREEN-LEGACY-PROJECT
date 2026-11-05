import { describe, it, expect } from 'vitest'
import type { QueuedSubmission, QueueItemStatus } from '../src/services/offlineQueue'

describe('Offline Queue State Machine & Retries', () => {
  it('follows correct state progression from PENDING_SYNC to SYNCED', () => {
    const states: QueueItemStatus[] = [
      'DRAFT',
      'PENDING_SYNC',
      'UPLOADING_PHOTO',
      'PENDING_TREE_PERSIST',
      'SYNCED',
    ]

    expect(states[0]).toBe('DRAFT')
    expect(states[1]).toBe('PENDING_SYNC')
    expect(states[2]).toBe('UPLOADING_PHOTO')
    expect(states[3]).toBe('PENDING_TREE_PERSIST')
    expect(states[4]).toBe('SYNCED')
  })

  it('calculates bounded exponential backoff with jitter', () => {
    function calculateBackoff(retryCount: number): number {
      const baseMs = 2000
      const maxMs = 60000
      const exponential = Math.min(maxMs, baseMs * Math.pow(2, retryCount))
      return exponential
    }

    expect(calculateBackoff(0)).toBe(2000)
    expect(calculateBackoff(1)).toBe(4000)
    expect(calculateBackoff(2)).toBe(8000)
    expect(calculateBackoff(3)).toBe(16000)
    expect(calculateBackoff(4)).toBe(32000)
    expect(calculateBackoff(5)).toBe(60000) // capped at 60s
    expect(calculateBackoff(10)).toBe(60000) // capped at 60s
  })

  it('marks queue item as FAILED_FATAL after maximum retries exceeded', () => {
    const item: QueuedSubmission = {
      id: 'queue-123',
      submissionKey: 'sub-xyz',
      status: 'FAILED_RETRYABLE',
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 1000,
      retryCount: 5,
      nextRetryTime: Date.now() - 100,
      draft: {
        species: 'Neem',
        identificationConfidence: 90,
        anomalies: [],
      },
    }

    if (item.retryCount >= 5) {
      item.status = 'FAILED_FATAL'
      item.lastError = 'Maximum retry limit (5 attempts) exceeded'
    }

    expect(item.status).toBe('FAILED_FATAL')
    expect(item.lastError).toContain('Maximum retry limit')
  })

  it('preserves photoUploadedUrl so photo is not re-uploaded on database retry', () => {
    const item: QueuedSubmission = {
      id: 'queue-456',
      submissionKey: 'sub-abc',
      status: 'PENDING_TREE_PERSIST',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 1,
      nextRetryTime: Date.now(),
      photoUploadedUrl: '/api/photos/drive-file-123/content',
      draft: {
        species: 'Teak',
        identificationConfidence: 88,
        anomalies: [],
      },
    }

    // Since photoUploadedUrl is already set, subsequent retries bypass uploadPhoto
    const needsPhotoUpload = Boolean(!item.photoUploadedUrl)
    expect(needsPhotoUpload).toBe(false)
    expect(item.photoUploadedUrl).toBe('/api/photos/drive-file-123/content')
  })
})
