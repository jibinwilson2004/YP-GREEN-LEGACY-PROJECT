export type AccuracyTier =
  | 'HIGH_PRECISION'
  | 'VERIFIED'
  | 'LOW_PRECISION'
  | 'UNRELIABLE'

export function classifyAccuracy(meters: number): AccuracyTier {
  if (meters <= 3) return 'HIGH_PRECISION'
  if (meters <= 10) return 'VERIFIED'
  if (meters <= 20) return 'LOW_PRECISION'
  return 'UNRELIABLE'
}

export function accuracyLabel(tier: AccuracyTier): string {
  switch (tier) {
    case 'HIGH_PRECISION':
      return 'High Precision'
    case 'VERIFIED':
      return 'Location Verified'
    case 'LOW_PRECISION':
      return 'Low GPS Accuracy'
    case 'UNRELIABLE':
      return 'Unreliable GPS'
  }
}

export function accuracyHint(tier: AccuracyTier): string | null {
  if (tier === 'LOW_PRECISION' || tier === 'UNRELIABLE') {
    return 'Move to an open area and try again.'
  }
  return null
}

export function formatMeters(meters: number): string {
  return `${meters.toFixed(1)} m`
}
