import { useCallback, useEffect, useRef, useState } from 'react'
import type { GeoReading, VerifiedLocation } from '../types/tree'
import {
  collectGpsReadings,
  createDefaultGpsProvider,
  verifyLocationFromReadings,
} from '../services/gps/gpsService'
import { detectReadingAnomalies } from '../services/anomalyDetection'
import type { LocationAnomaly } from '../types/tree'
import type { PositionProvider } from '../services/gps/positionProvider'

export type GpsPhase = 'idle' | 'requesting' | 'collecting' | 'done' | 'error'

export function useGPS() {
  const [phase, setPhase] = useState<GpsPhase>('idle')
  const [readings, setReadings] = useState<GeoReading[]>([])
  const [verified, setVerified] = useState<VerifiedLocation | null>(null)
  const [anomalies, setAnomalies] = useState<LocationAnomaly[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false)
  const providerRef = useRef<PositionProvider | null>(null)

  const reset = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.stop()
      providerRef.current = null
    }
    setPhase('idle')
    setReadings([])
    setVerified(null)
    setAnomalies([])
    setError(null)
    setIsPermissionDenied(false)
  }, [])

  // Monitor permission state changes if supported by browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        const handleStatusChange = () => {
          if (status.state === 'granted') {
            setIsPermissionDenied(false)
            if (phase === 'error' && error?.toLowerCase().includes('denied')) {
              setError(null)
              setPhase('idle')
            }
          } else if (status.state === 'denied') {
            setIsPermissionDenied(true)
          }
        }
        handleStatusChange()
        status.onchange = handleStatusChange
      }).catch(() => {
        /* permissions query not supported or rejected */
      })
    }
  }, [phase, error])

  const startCollection = useCallback(async () => {
    reset()
    setPhase('requesting')
    setError(null)
    setIsPermissionDenied(false)

    const provider = createDefaultGpsProvider()
    providerRef.current = provider

    try {
      setPhase('collecting')
      const collected = await collectGpsReadings(
        provider,
        (r) => setReadings((prev) => [...prev, r].slice(-50)),
        10000,
      )
      setReadings(collected)
      const result = verifyLocationFromReadings(collected, 'SMARTPHONE_GPS')
      setVerified(result)
      setAnomalies(detectReadingAnomalies(collected))
      setPhase('done')
    } catch (e: unknown) {
      const err = e as GeolocationPositionError
      const msg = err instanceof Error ? err.message : String(e || 'GPS unavailable')
      const isDenied = err?.code === 1 || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')
      setIsPermissionDenied(isDenied)
      if (isDenied) {
        setError('Location permission denied')
      } else {
        setError(msg)
      }
      setPhase('error')
    }
  }, [reset])

  const rerequestPermission = useCallback(async () => {
    reset()
    setError(null)
    setIsPermissionDenied(false)
    setPhase('requesting')

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setPhase('error')
      return
    }

    try {
      // 1. Direct explicit browser prompt triggered from click user-activation (use standard accuracy to avoid timeout)
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        })
      })
      // 2. Permission granted! Now proceed with collection
      await startCollection()
    } catch (e: unknown) {
      const err = e as GeolocationPositionError
      const msg = err instanceof Error ? err.message : String(e || 'GPS location unavailable')
      const isDenied = err?.code === 1 || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')
      setIsPermissionDenied(isDenied)
      setError(
        isDenied
          ? 'Location permission was denied. Please allow location access to continue.'
          : msg,
      )
      setPhase('error')
    }
  }, [reset, startCollection])

  return {
    phase,
    readings,
    verified,
    anomalies,
    error,
    isPermissionDenied,
    startCollection,
    rerequestPermission,
    reset,
  }
}
