import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import type { Tree } from '../../types/tree'

interface TreeMapMarkerProps {
  tree: Tree
  onViewDetails?: () => void
}

// Custom Stitch-styled verified tree marker
const createTreePinIcon = (verified = true) => {
  const pinBg = verified ? '#109367' : '#2f7c5f'
  return L.divIcon({
    className: 'custom-tree-pin-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          background: linear-gradient(135deg, ${pinBg} 0%, #002218 100%);
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 34, 24, 0.45);
          border: 2.5px solid #ffffff;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">
            🌳
          </div>
        </div>
        <div style="
          width: 8px;
          height: 8px;
          background: rgba(0, 34, 24, 0.5);
          border-radius: 50%;
          filter: blur(1px);
          margin-top: 2px;
        "></div>
      </div>
    `,
    iconSize: [38, 48],
    iconAnchor: [19, 46],
    popupAnchor: [0, -42],
  })
}

export function TreeMapMarker({ tree, onViewDetails }: TreeMapMarkerProps) {
  const isVerified = tree.verificationStatus === 'VERIFIED'
  const icon = createTreePinIcon(isVerified)
  const commonName = tree.commonName || 'Neem'
  const botanicalName = tree.botanicalName || tree.species || 'Azadirachta indica'
  const accuracy = tree.gpsAccuracy ?? tree.accuracy ?? 4.2
  const confidence = tree.locationConfidence ?? 96

  return (
    <Marker position={[tree.latitude, tree.longitude]} icon={icon}>
      <Popup className="stitch-map-popup" minWidth={220} maxWidth={280}>
        <div className="p-3 text-left font-body-md text-on-surface">
          {/* Header Tag */}
          <div className="flex items-center justify-between gap-2 border-b border-surface-variant/60 pb-2 mb-2">
            <span className="font-mono text-xs font-bold text-primary">#{tree.id}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary px-2 py-0.5 rounded-full bg-secondary-container">
              <span>✓</span>
              <span>{isVerified ? 'Verified' : tree.verificationStatus}</span>
            </span>
          </div>

          {/* Names */}
          <h4 className="font-headline-sm text-base font-bold text-primary leading-tight">
            {commonName}
          </h4>
          <p className="text-xs italic font-medium text-secondary mt-0.5">
            {botanicalName}
          </p>

          {/* GPS Specs */}
          <div className="mt-2.5 pt-2 border-t border-surface-variant/50 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-outline">Coordinates:</span>
              <span className="font-mono font-semibold text-primary">
                {tree.latitude.toFixed(5)}°, {tree.longitude.toFixed(5)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">GPS Accuracy:</span>
              <span className="font-mono font-semibold text-secondary">±{accuracy.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Location Confidence:</span>
              <span className="font-mono font-semibold text-primary">{confidence}%</span>
            </div>
          </div>

          {/* Action */}
          <div className="mt-3 pt-2 border-t border-surface-variant/50">
            {onViewDetails ? (
              <button
                type="button"
                onClick={onViewDetails}
                className="w-full py-1.5 px-3 bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold rounded-lg transition-colors text-center cursor-pointer shadow-xs"
              >
                View Tree Details
              </button>
            ) : (
              <Link
                to={`/trees/${tree.id}`}
                className="block w-full py-1.5 px-3 bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold rounded-lg transition-colors text-center shadow-xs"
              >
                View Tree Details
              </Link>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
