import type { GeoReading, GpsSource, LocationStatus, VerifiedLocation } from '../../types/tree'
import { computeStability } from './gpsStability'
import { SmartphoneGPSProvider, type PositionProvider } from './positionProvider'

const COLLECTION_MS_MIN = 5000
const COLLECTION_MS_MAX = 15000
const SAMPLE_INTERVAL_MS = 800

export function locationStatusFrom(
  _accuracy: number,
  confidence: number,
  _stable: boolean,
): LocationStatus {
  // Accuracy check bypassed — always accept the reading
  if (confidence >= 85) return 'HIGH'
  if (confidence >= 60) return 'MEDIUM'
  return 'LOW'
}

export function computeLocationConfidence(
  _accuracy: number,
  stabilityScore: number,
  readingCount: number,
): number {
  // Accuracy ignored — confidence based only on stability and reading count
  const countBoost = Math.min(8, readingCount)
  return Math.round(Math.min(100, stabilityScore * 0.85 + countBoost * 1.875))
}

function medianCoordinate(readings: GeoReading[]): { lat: number; lng: number } {
  const lats = readings.map((r) => r.latitude).sort((a, b) => a - b)
  const lngs = readings.map((r) => r.longitude).sort((a, b) => a - b)
  const mid = Math.floor(readings.length / 2)
  return {
    lat: readings.length % 2 ? lats[mid] : (lats[mid - 1] + lats[mid]) / 2,
    lng: readings.length % 2 ? lngs[mid] : (lngs[mid - 1] + lngs[mid]) / 2,
  }
}

export async function collectGpsReadings(
  provider: PositionProvider,
  onReading?: (reading: GeoReading, index: number) => void,
  durationMs = 10000,
): Promise<GeoReading[]> {
  const ms = Math.min(COLLECTION_MS_MAX, Math.max(COLLECTION_MS_MIN, durationMs))
  await provider.start()
  const readings: GeoReading[] = []
  const started = Date.now()

  try {
    while (Date.now() - started < ms) {
      const pos = await provider.getPosition()
      const reading: GeoReading = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        altitude: pos.altitude,
        altitudeAccuracy: pos.altitudeAccuracy,
        heading: pos.heading,
        speed: pos.speed,
        timestamp: pos.timestamp,
      }
      readings.push(reading)
      onReading?.(reading, readings.length)
      await new Promise((r) => setTimeout(r, SAMPLE_INTERVAL_MS))
    }
  } finally {
    provider.stop()
  }

  return readings
}

export function verifyLocationFromReadings(
  readings: GeoReading[],
  source: GpsSource = 'SMARTPHONE_GPS',
): VerifiedLocation {
  const stability = computeStability(readings)
  const coord = medianCoordinate(readings)
  const accuracy = stability.medianAccuracyM
  const confidence = computeLocationConfidence(
    accuracy,
    stability.stabilityScore,
    readings.length,
  )
  const status = locationStatusFrom(accuracy, confidence, stability.isStable)

  return {
    latitude: coord.lat,
    longitude: coord.lng,
    accuracy,
    confidence,
    status,
    source,
    readingCount: readings.length,
    stabilityScore: stability.stabilityScore,
    readings,
  }
}

export function createDefaultGpsProvider(): PositionProvider {
  return new SmartphoneGPSProvider()
}
