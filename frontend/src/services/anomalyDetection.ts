import type { GeoReading, LocationAnomaly, Tree } from '../types/tree'

const DUPLICATE_RADIUS_M = 3

function distanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function detectReadingAnomalies(readings: GeoReading[]): LocationAnomaly[] {
  const anomalies: LocationAnomaly[] = []
  for (let i = 1; i < readings.length; i++) {
    const d = distanceM(
      readings[i - 1].latitude,
      readings[i - 1].longitude,
      readings[i].latitude,
      readings[i].longitude,
    )
    if (d > Math.max(30, readings[i].accuracy * 4)) {
      anomalies.push({
        type: 'GPS_JUMP',
        message: 'GPS Signal Unstable',
      })
      break
    }
  }
  const last = readings[readings.length - 1]
  if (last && last.accuracy > 20) {
    anomalies.push({
      type: 'POOR_ACCURACY',
      message: 'Location Accuracy Too Low',
    })
  }
  return anomalies
}

export function detectDuplicateLocation(
  lat: number,
  lng: number,
  existing: Tree[],
): LocationAnomaly | null {
  for (const tree of existing) {
    const d = distanceM(lat, lng, tree.latitude, tree.longitude)
    if (d <= DUPLICATE_RADIUS_M) {
      return {
        type: 'DUPLICATE',
        message: 'Possible Duplicate Location',
      }
    }
  }
  return null
}

export function detectSuspiciousMovement(
  userId: string | undefined,
  lat: number,
  lng: number,
  existing: Tree[],
  capturedAt: number,
): LocationAnomaly | null {
  if (!userId) return null
  const userTrees = existing.filter((t) => t.userId === userId)
  if (userTrees.length === 0) return null
  const last = userTrees.sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  )[0]
  const dtHours =
    (capturedAt - new Date(last.capturedAt).getTime()) / (1000 * 60 * 60)
  if (dtHours <= 0) return null
  const dist = distanceM(lat, lng, last.latitude, last.longitude)
  const speedKmh = dist / 1000 / dtHours
  if (speedKmh > 120) {
    return {
      type: 'SUSPICIOUS_MOVEMENT',
      message: 'Unrealistic movement between registrations',
    }
  }
  return null
}
