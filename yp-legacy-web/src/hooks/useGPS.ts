import { useCallback, useRef, useState } from 'react'
import type { GeoReading, VerifiedLocation } from '../types/tree'
import {
  collectGpsReadings,
  createDefaultGpsProvider,
  verifyLocationFromReadings,
} from '../services/gps/gpsService'
import { detectReadingAnomalies } from '../services/anomalyDetection'
import type { LocationAnomaly } from '../types/tree'

export type GpsPhase = 'idle' | 'requesting' | 'collecting' | 'done' | 'error'

export function useGPS() {
  const [phase, setPhase] = useState<GpsPhase>('idle')
  const [readings, setReadings] = useState<GeoReading[]>([])
  const [verified, setVerified] = useState<VerifiedLocation | null>(null)
  const [anomalies, setAnomalies] = useState<LocationAnomaly[]>([])
  const [error, setError] = useState<string | null>(null)
  const providerRef = useRef(createDefaultGpsProvider())

  const reset = useCallback(() => {
    setPhase('idle')
    setReadings([])
    setVerified(null)
    setAnomalies([])
    setError(null)
  }, [])

  const startCollection = useCallback(async () => {
    reset()
    setPhase('requesting')
    setError(null)
    try {
      setPhase('collecting')
      const collected = await collectGpsReadings(
        providerRef.current,
        (r) => setReadings((prev) => [...prev, r].slice(-50)),
        10000,
      )
      setReadings(collected)
      const result = verifyLocationFromReadings(collected, 'SMARTPHONE_GPS')
      setVerified(result)
      setAnomalies(detectReadingAnomalies(collected))
      setPhase('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'GPS unavailable'
      if (msg.toLowerCase().includes('denied')) {
        setError('Location permission denied')
      } else {
        setError(msg)
      }
      setPhase('error')
    }
  }, [reset])

  return {
    phase,
    readings,
    verified,
    anomalies,
    error,
    startCollection,
    reset,
  }
}
