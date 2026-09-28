export type GpsSource =
  | 'SMARTPHONE_GPS'
  | 'DUAL_FREQUENCY_GNSS'
  | 'RTK_GNSS'
  | 'MANUAL'

export type LocationStatus = 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED'

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED'

export interface Tree {
  id: string
  species: string
  commonName?: string
  botanicalName?: string
  imageUrl?: string
  images?: string[]
  latitude: number
  longitude: number
  accuracy: number
  gpsAccuracy?: number
  altitude?: number
  gpsSource: GpsSource
  locationConfidence: number
  locationStatus: LocationStatus
  readingCount: number
  gpsReadings?: number
  stabilityScore: number
  gpsStability?: 'STABLE' | 'UNSTABLE' | 'MODERATE' | string
  capturedAt: string
  dateOfPlanting?: string
  updatedAt?: string
  student?: string
  college?: string
  cluster?: string
  institution?: string
  verifiedBy?: string
  verificationDate?: string
  userId?: string
  verificationStatus: VerificationStatus
  identificationConfidence?: number
  treeIdentificationConfidence?: number
  adminNote?: string
}

export interface GeoReading {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface VerifiedLocation {
  latitude: number
  longitude: number
  accuracy: number
  confidence: number
  status: LocationStatus
  source: GpsSource
  readingCount: number
  stabilityScore: number
  readings: GeoReading[]
}

export interface LocationAnomaly {
  type: 'DUPLICATE' | 'GPS_JUMP' | 'POOR_ACCURACY' | 'SUSPICIOUS_MOVEMENT'
  message: string
}

export interface TreeCaptureDraft {
  species: string
  commonName?: string
  photoBlob?: Blob
  photoPreviewUrl?: string
  location?: VerifiedLocation
  identificationConfidence: number
  anomalies: LocationAnomaly[]
  treeIdPreview?: string
}

export interface ViewportBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  zoom: number
}
