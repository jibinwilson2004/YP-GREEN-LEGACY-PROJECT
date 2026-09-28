export type GpsSource =
  | 'SMARTPHONE_GPS'
  | 'DUAL_FREQUENCY_GNSS'
  | 'RTK_GNSS'
  | 'MANUAL'

export type AccuracyTier =
  | 'HIGH_PRECISION'
  | 'VERIFIED'
  | 'LOW_PRECISION'
  | 'UNRELIABLE'

export type GpsStability = 'STABLE' | 'UNSTABLE' | 'MODERATE'

export function formatGpsSource(source: GpsSource): string {
  switch (source) {
    case 'SMARTPHONE_GPS':
      return 'Smartphone GPS'
    case 'DUAL_FREQUENCY_GNSS':
      return 'Dual-Frequency GNSS'
    case 'RTK_GNSS':
      return 'RTK GNSS'
    case 'MANUAL':
      return 'Manual'
    default:
      return source
  }
}
