import type { GeoReading } from '../../types/tree'

export interface Position extends GeoReading {
  source: 'SMARTPHONE_GPS' | 'RTK_GNSS' | 'DUAL_FREQUENCY_GNSS'
}

export interface PositionProvider {
  start(): Promise<void>
  stop(): void
  getPosition(): Promise<Position>
}

function geoToReading(pos: GeolocationPosition): Position {
  const c = pos.coords
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    accuracy: c.accuracy,
    altitude: c.altitude ?? undefined,
    altitudeAccuracy: c.altitudeAccuracy ?? undefined,
    heading: c.heading ?? undefined,
    speed: c.speed ?? undefined,
    timestamp: pos.timestamp,
    source: 'SMARTPHONE_GPS',
  }
}

export class SmartphoneGPSProvider implements PositionProvider {
  private watchId: number | null = null
  private latest: Position | null = null

  async start(): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('GPS unavailable on this device')
    }

    // Step 1: Acquire initial fix with fallback from high accuracy to standard accuracy
    const acquireInitialPosition = async (): Promise<Position> => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 15000,
          })
        })
        return geoToReading(pos)
      } catch (err: unknown) {
        const geoErr = err as GeolocationPositionError
        const msg = String(geoErr?.message || '').toLowerCase()
        const isPermissionDenied =
          geoErr?.code === 1 || msg.includes('denied') || msg.includes('permission')

        // If permission was denied by user, throw immediately to prompt permission re-request
        if (isPermissionDenied) {
          throw new Error('Location permission denied')
        }

        // On timeout or position unavailable, fall back to standard network/Wi-Fi positioning
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 60000,
          })
        })
        return geoToReading(pos)
      }
    }

    try {
      this.latest = await acquireInitialPosition()
    } catch (err) {
      this.stop()
      throw err
    }

    // Step 2: Start continuous watchPosition in background to refine coordinates if satellite locks
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.latest = geoToReading(pos)
        },
        (err) => {
          // Do not fail if an initial reading was already acquired
          console.warn('[GPS watch warning]', err.message)
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
      )
    } catch {
      /* ignore watch registration issues */
    }
  }

  stop(): void {
    if (this.watchId !== null) {
      try {
        navigator.geolocation.clearWatch(this.watchId)
      } catch {
        /* ignore */
      }
      this.watchId = null
    }
    this.latest = null
  }

  getPosition(): Promise<Position> {
    if (this.latest) {
      return Promise.resolve(this.latest)
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(geoToReading(pos)),
        (err) => {
          if (err.code === 1) {
            reject(new Error('Location permission denied'))
            return
          }
          // Retry with standard accuracy if high accuracy times out
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => resolve(geoToReading(fallbackPos)),
            (fallbackErr) => reject(new Error(fallbackErr.message || 'GPS location unavailable')),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
          )
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 7000 },
      )
    })
  }
}

/** Integration-ready RTK provider — requires external NMEA/stream bridge. */
export class RTKGNSSProvider implements PositionProvider {
  async start(): Promise<void> {
    throw new Error(
      'RTK GNSS not connected. Pair an RTK receiver via the future NMEA bridge.',
    )
  }

  stop(): void {
    /* no-op until hardware bridge is wired */
  }

  getPosition(): Promise<Position> {
    return Promise.reject(new Error('RTK GNSS provider is not connected'))
  }
}
