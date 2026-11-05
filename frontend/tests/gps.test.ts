import { describe, it, expect } from 'vitest'
import {
  locationStatusFrom,
  computeLocationConfidence,
} from '../src/services/gps/gpsService'
import { classifyAccuracy } from '../src/services/gps/gpsAccuracy'
import { computeStability } from '../src/services/gps/gpsStability'
import {
  detectReadingAnomalies,
  detectDuplicateLocation,
  detectSuspiciousMovement,
} from '../src/services/anomalyDetection'
import type { GeoReading, Tree } from '../src/types/tree'

describe('GPS Accuracy & Confidence Engine', () => {
  it('classifies accuracy tiers correctly', () => {
    expect(classifyAccuracy(2.1)).toBe('HIGH_PRECISION')
    expect(classifyAccuracy(6.5)).toBe('VERIFIED')
    expect(classifyAccuracy(15.0)).toBe('LOW_PRECISION')
    expect(classifyAccuracy(45.0)).toBe('UNRELIABLE')
  })

  it('rejects low-accuracy readings and calculates realistic status', () => {
    // High accuracy + high confidence + stable = HIGH
    expect(locationStatusFrom(3.0, 92, true)).toBe('HIGH')
    // Medium accuracy (12m) = MEDIUM
    expect(locationStatusFrom(12.0, 70, true)).toBe('MEDIUM')
    // Poor accuracy (30m) = LOW
    expect(locationStatusFrom(30.0, 50, false)).toBe('LOW')
    // Very poor accuracy (60m) = REJECTED
    expect(locationStatusFrom(60.0, 30, false)).toBe('REJECTED')
  })

  it('weights accuracy, stability score, and reading count into confidence', () => {
    const highConf = computeLocationConfidence(2.5, 95, 12)
    const lowConf = computeLocationConfidence(40.0, 30, 2)

    expect(highConf).toBeGreaterThanOrEqual(85)
    expect(lowConf).toBeLessThan(40)
  })

  it('computes spatial centroid and stability from multiple GPS fixes', () => {
    const readings: GeoReading[] = [
      { latitude: 10.05280, longitude: 76.63460, accuracy: 3.5, timestamp: 1000 },
      { latitude: 10.05281, longitude: 76.63461, accuracy: 3.2, timestamp: 1800 },
      { latitude: 10.05279, longitude: 76.63459, accuracy: 3.8, timestamp: 2600 },
      { latitude: 10.05282, longitude: 76.63462, accuracy: 3.4, timestamp: 3400 },
    ]

    const result = computeStability(readings)
    expect(result.stabilityScore).toBeGreaterThanOrEqual(70)
    expect(result.isStable).toBe(true)
    expect(result.medianAccuracyM).toBeCloseTo(3.45, 1)
  })

  it('detects GPS teleportation jumps and anomalous movements', () => {
    const jumpReadings: GeoReading[] = [
      { latitude: 10.05280, longitude: 76.63460, accuracy: 3.0, timestamp: 1000 },
      { latitude: 10.06500, longitude: 76.65000, accuracy: 4.0, timestamp: 1800 }, // ~2 km jump
    ]
    const anomalies = detectReadingAnomalies(jumpReadings)
    expect(anomalies.some((a) => a.type === 'GPS_JUMP')).toBe(true)
  })

  it('detects duplicate registrations within 3 meters', () => {
    const existing: Tree[] = [
      {
        id: 'YP-000001',
        species: 'Neem',
        latitude: 10.052800,
        longitude: 76.634600,
        accuracy: 3.0,
        gpsSource: 'SMARTPHONE_GPS',
        locationConfidence: 95,
        locationStatus: 'HIGH',
        readingCount: 10,
        stabilityScore: 90,
        capturedAt: new Date().toISOString(),
        verificationStatus: 'VERIFIED',
      },
    ]

    // Point 1.5 meters away: should be detected as duplicate
    const dup = detectDuplicateLocation(10.052805, 76.634605, existing)
    expect(dup).not.toBeNull()
    expect(dup?.type).toBe('DUPLICATE')

    // Point 200 meters away: should not be duplicate
    const noDup = detectDuplicateLocation(10.054500, 76.634600, existing)
    expect(noDup).toBeNull()
  })

  it('detects impossible physical travel speeds (>120 km/h)', () => {
    const existing: Tree[] = [
      {
        id: 'YP-000001',
        species: 'Neem',
        latitude: 10.0528,
        longitude: 76.6346,
        accuracy: 3.0,
        gpsSource: 'SMARTPHONE_GPS',
        locationConfidence: 95,
        locationStatus: 'HIGH',
        readingCount: 10,
        stabilityScore: 90,
        capturedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        userId: 'planter-1',
        verificationStatus: 'VERIFIED',
      },
    ]

    // 50 km away after only 1 minute = 3000 km/h (impossible travel)
    const speedAnomaly = detectSuspiciousMovement(
      'planter-1',
      10.5000,
      76.9000,
      existing,
      Date.now()
    )
    expect(speedAnomaly).not.toBeNull()
    expect(speedAnomaly?.type).toBe('SUSPICIOUS_MOVEMENT')
  })
})
