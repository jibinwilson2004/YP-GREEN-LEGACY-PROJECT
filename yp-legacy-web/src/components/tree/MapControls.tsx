import { useState } from 'react'
import { useMap, CircleMarker, Tooltip } from 'react-leaflet'

interface MapControlsProps {
  treeLatitude: number
  treeLongitude: number
  treeCommonName?: string
}

export function MapControls({
  treeLatitude,
  treeLongitude,
}: MapControlsProps) {
  const map = useMap()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleCenterOnTree = () => {
    map.flyTo([treeLatitude, treeLongitude], 18, { duration: 0.8 })
  }

  const handleZoomIn = () => {
    map.zoomIn()
  }

  const handleZoomOut = () => {
    map.zoomOut()
  }

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setTimeout(() => setLocationError(null), 3000)
      return
    }

    setLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords)
        map.flyTo([coords.lat, coords.lng], 16, { duration: 1 })
      },
      (err) => {
        setLocating(false)
        setLocationError(err.message || 'Location permission denied')
        setTimeout(() => setLocationError(null), 3500)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <>
      {/* User Current Location Dot (if enabled) - Distinct Blue Style */}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={7}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#2563eb',
            fillOpacity: 0.9,
            weight: 2.5,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            <span className="font-sans text-[11px] font-semibold text-blue-700">
              ● Your Current Position
            </span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Floating Control Strip on Map (Bottom-Right / Top-Right) */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col items-end gap-1.5 pointer-events-auto">
        {locationError && (
          <div className="bg-error text-on-error text-[10px] px-2.5 py-1 rounded shadow-md animate-fade-in font-medium">
            {locationError}
          </div>
        )}

        {/* Center on Tree Action Button */}
        <button
          type="button"
          onClick={handleCenterOnTree}
          className="bg-surface-container-lowest/95 hover:bg-surface-container text-primary hover:text-secondary px-2.5 py-1.5 rounded-lg shadow-md border border-outline-variant/60 flex items-center gap-1.5 text-xs font-label-md transition-all cursor-pointer backdrop-blur-sm"
          title="Center on Registered Tree"
          aria-label="Center on Registered Tree"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">
            my_location
          </span>
          <span className="font-semibold text-[11px]">Center on Tree</span>
        </button>

        <div className="flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur-sm p-1 rounded-lg shadow-md border border-outline-variant/60">
          {/* User Location Toggle */}
          <button
            type="button"
            onClick={handleLocateUser}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              userLocation
                ? 'bg-blue-600 text-white'
                : 'text-on-surface hover:bg-surface-container'
            }`}
            title="Show My Location (requires GPS permission)"
            aria-label="Show My Location"
          >
            <span className="material-symbols-outlined text-[16px]">
              {locating ? 'sync' : 'near_me'}
            </span>
          </button>

          <span className="w-px h-4 bg-outline-variant/40" />

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
        </div>
      </div>
    </>
  )
}
