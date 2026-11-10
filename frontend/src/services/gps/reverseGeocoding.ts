/**
 * Reverse Geocoding Service
 * Identifies and populates the country based on GPS coordinates.
 * Includes online lookup with graceful offline bounding box fallback.
 */

interface NominatimResponse {
  address?: {
    country?: string
    country_code?: string
  }
}

export async function reverseGeocodeCountry(
  latitude: number,
  longitude: number,
): Promise<string> {
  // 1. Try reverse geocoding via OpenStreetMap Nominatim with timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as NominatimResponse
      if (data.address?.country) {
        return data.address.country
      }
    }
  } catch {
    // Offline or network timeout - proceed to fallback
  }

  // 2. Offline fallback based on geographic boundaries
  return getOfflineCountryFromCoords(latitude, longitude)
}

function getOfflineCountryFromCoords(lat: number, lng: number): string {
  // India (mainland & islands)
  if (lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5) {
    return 'India'
  }
  // United States (contiguous + AK/HI approximate)
  if (
    (lat >= 24.5 && lat <= 49.5 && lng >= -125.0 && lng <= -66.9) ||
    (lat >= 51.0 && lat <= 71.5 && lng >= -170.0 && lng <= -130.0) ||
    (lat >= 18.8 && lat <= 22.3 && lng >= -160.5 && lng <= -154.7)
  ) {
    return 'United States'
  }
  // Canada
  if (lat >= 41.5 && lat <= 83.5 && lng >= -141.0 && lng <= -52.5) {
    return 'Canada'
  }
  // United Kingdom
  if (lat >= 49.8 && lat <= 60.9 && lng >= -8.5 && lng <= 1.8) {
    return 'United Kingdom'
  }
  // Germany
  if (lat >= 47.2 && lat <= 55.1 && lng >= 5.8 && lng <= 15.1) {
    return 'Germany'
  }
  // France
  if (lat >= 41.3 && lat <= 51.1 && lng >= -5.2 && lng <= 9.6) {
    return 'France'
  }
  // Australia
  if (lat >= -44.0 && lat <= -10.0 && lng >= 113.0 && lng <= 154.0) {
    return 'Australia'
  }
  // Japan
  if (lat >= 24.0 && lat <= 46.0 && lng >= 122.0 && lng <= 154.0) {
    return 'Japan'
  }
  // United Arab Emirates
  if (lat >= 22.5 && lat <= 26.2 && lng >= 51.5 && lng <= 56.5) {
    return 'United Arab Emirates'
  }
  // Singapore
  if (lat >= 1.15 && lat <= 1.48 && lng >= 103.6 && lng <= 104.1) {
    return 'Singapore'
  }
  // Malaysia
  if (lat >= 0.8 && lat <= 7.4 && lng >= 99.6 && lng <= 119.3) {
    return 'Malaysia'
  }
  // Brazil
  if (lat >= -33.8 && lat <= 5.3 && lng >= -74.0 && lng <= -34.8) {
    return 'Brazil'
  }

  // Default fallback for IEEE YP Green Legacy deployment region
  return 'India'
}

