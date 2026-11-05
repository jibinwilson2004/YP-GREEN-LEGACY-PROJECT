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
    await new Promise<void>((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.latest = geoToReading(pos)
          resolve()
        },
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      )
    })
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  getPosition(): Promise<Position> {
    if (this.latest) {
      return Promise.resolve(this.latest)
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(geoToReading(pos)),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
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
