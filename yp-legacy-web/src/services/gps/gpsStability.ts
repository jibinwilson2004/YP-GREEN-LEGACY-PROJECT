import type { GeoReading } from '../../types/tree'

const EARTH_RADIUS_M = 6371000

function haversineM(a: GeoReading, b: GeoReading): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export interface StabilityResult {
  stabilityScore: number
  maxDisplacementM: number
  medianAccuracyM: number
  isStable: boolean
  spreadM: number
}

export function computeStability(readings: GeoReading[]): StabilityResult {
  if (readings.length < 2) {
    return {
      stabilityScore: 0,
      maxDisplacementM: Infinity,
      medianAccuracyM: readings[0]?.accuracy ?? Infinity,
      isStable: false,
      spreadM: Infinity,
    }
  }

  const centroid = readings.reduce(
    (acc, r) => ({
      lat: acc.lat + r.latitude,
      lng: acc.lng + r.longitude,
    }),
    { lat: 0, lng: 0 },
  )
  centroid.lat /= readings.length
  centroid.lng /= readings.length

  const displacements = readings.map((r) =>
    haversineM(r, {
      ...r,
      latitude: centroid.lat,
      longitude: centroid.lng,
    }),
  )
  const maxDisplacementM = Math.max(...displacements)
  const spreadM = median(displacements)
  const accuracies = readings.map((r) => r.accuracy)
  const medianAccuracyM = median(accuracies)

  let jumpPenalty = 0
  for (let i = 1; i < readings.length; i++) {
    const d = haversineM(readings[i - 1], readings[i])
    if (d > Math.max(25, readings[i].accuracy * 3)) {
      jumpPenalty += 25
    }
  }

  const accuracyFactor = Math.max(0, 100 - medianAccuracyM * 4)
  const spreadFactor = Math.max(0, 100 - spreadM * 8)
  const countFactor = Math.min(100, readings.length * 8)
  let stabilityScore = Math.round(
    (accuracyFactor * 0.35 + spreadFactor * 0.45 + countFactor * 0.2) - jumpPenalty,
  )
  stabilityScore = Math.max(0, Math.min(100, stabilityScore))

  const isStable =
    stabilityScore >= 60 &&
    maxDisplacementM <= Math.max(15, medianAccuracyM * 2.5) &&
    jumpPenalty < 30

  return {
    stabilityScore,
    maxDisplacementM,
    medianAccuracyM,
    isStable,
    spreadM,
  }
}

export function stabilityLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Unstable'
}
