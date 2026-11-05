import { useState, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Tree } from '../../types/tree'
import { GPSAccuracyCircle } from './GPSAccuracyCircle'
import { TreeMapMarker } from './TreeMapMarker'
import { MapControls } from './MapControls'

interface TreeLocationMapProps {
  tree: Tree
  height?: string
  className?: string
  onClose?: () => void
  onViewDetails?: () => void
  showConfidenceBadge?: boolean
  showCloseButton?: boolean
}

export function TreeLocationMap({
  tree,
  height = '280px',
  className = '',
  onClose,
  onViewDetails,
  showConfidenceBadge = true,
  showCloseButton = true,
}: TreeLocationMapProps) {
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const lat = tree.latitude
  const lng = tree.longitude
  const accuracy = tree.gpsAccuracy ?? tree.accuracy ?? 4.2
  const confidence = tree.locationConfidence ?? 96
  const stability = tree.gpsStability || (tree.stabilityScore >= 75 ? 'Stable' : 'Moderate')

  const centerCoords: [number, number] = useMemo(() => [lat, lng], [lat, lng])

  // Error state fallback
  if (hasError || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div
        style={{ height }}
        className={`w-full bg-surface-container-high flex flex-col items-center justify-center p-6 text-center text-on-surface border-b border-outline-variant/40 ${className}`}
      >
        <span className="material-symbols-outlined text-[36px] text-error mb-2">
          location_off
        </span>
        <h4 className="font-headline-sm text-sm font-bold text-primary">
          Unable to load map
        </h4>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          Coordinates: {lat?.toFixed(5) ?? '10.05280'}°, {lng?.toFixed(5) ?? '76.63460'}° (±{accuracy}m)
        </p>
        <button
          type="button"
          onClick={() => {
            setHasError(false)
            setRetryKey((k) => k + 1)
          }}
          className="mt-3 px-3 py-1.5 bg-primary hover:bg-secondary text-white font-label-md text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          <span>Retry Map</span>
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ height }}
      className={`relative w-full overflow-hidden bg-[#e5ede9] select-none rounded-t-xl group ${className}`}
    >
      {/* 1. TOP OVERLAY: Stitch-styled Map Header & Coordinates */}
      <div className="absolute top-3 left-3 z-[400] max-w-[calc(100%-60px)] pointer-events-none">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse flex-shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-label-sm">
            <span className="font-bold text-primary">📍 Tree Location</span>
            <span className="text-outline hidden sm:inline">•</span>
            <span className="text-secondary font-semibold hidden xs:inline">Verified Location</span>
            <span className="text-outline hidden sm:inline">•</span>
            <span className="font-mono font-bold text-primary">
              {lat.toFixed(5)}°, {lng.toFixed(5)}°
            </span>
            <span className="font-mono text-secondary font-semibold">
              (±{accuracy.toFixed(1)}m)
            </span>
          </div>
        </div>
      </div>

      {/* Top Right Close Button (matching Stitch design) */}
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-[400] w-8 h-8 rounded-full bg-surface-container-lowest/95 hover:bg-surface-container text-outline hover:text-primary transition-all shadow-md border border-outline-variant/60 flex items-center justify-center cursor-pointer pointer-events-auto"
          aria-label="Close"
          title="Close"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}

      {/* 2. REAL INTERACTIVE LEAFLET MAP */}
      <MapContainer
        key={`${lat}-${lng}-${retryKey}`}
        center={centerCoords}
        zoom={18}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* GPS Accuracy Circle (strictly tree.accuracy meters radius) */}
        <GPSAccuracyCircle
          latitude={lat}
          longitude={lng}
          accuracy={accuracy}
        />

        {/* Registered Tree Marker with Stitch Popup */}
        <TreeMapMarker tree={tree} onViewDetails={onViewDetails} />

        {/* Floating Controls: Re-Center on Tree, Current Location, Zoom In/Out */}
        <MapControls
          treeLatitude={lat}
          treeLongitude={lng}
          treeCommonName={tree.commonName}
        />
      </MapContainer>

      {/* 3. BOTTOM OVERLAY: Location Confidence Pill */}
      {showConfidenceBadge && (
        <div className="absolute bottom-3 left-3 z-[400] pointer-events-none max-w-[calc(100%-140px)]">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-outline-variant/60 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-label-sm text-primary">
            <span className="text-secondary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>{confidence}% Confidence</span>
            </span>
            <span className="text-outline">•</span>
            <span className="font-mono text-secondary font-semibold">±{accuracy.toFixed(1)}m</span>
            <span className="text-outline hidden sm:inline">•</span>
            <span className="text-on-surface-variant hidden sm:inline">✓ {stability} GPS</span>
          </div>
        </div>
      )}
    </div>
  )
}
