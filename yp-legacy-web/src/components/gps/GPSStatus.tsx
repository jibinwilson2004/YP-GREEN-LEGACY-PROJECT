import type { VerifiedLocation } from '../../types/tree'
import { stabilityLabel } from '../../services/gps/gpsStability'

function sourceLabel(source: VerifiedLocation['source']) {
  switch (source) {
    case 'SMARTPHONE_GPS':
      return 'Smartphone GPS'
    case 'RTK_GNSS':
      return 'RTK GNSS'
    case 'DUAL_FREQUENCY_GNSS':
      return 'Dual-Frequency GNSS'
    case 'MANUAL':
      return 'Manual'
  }
}

export function GPSStatus({ location }: { location: VerifiedLocation }) {
  const latFormatted = `${Math.abs(location.latitude).toFixed(6)}° ${location.latitude >= 0 ? 'N' : 'S'}`
  const lonFormatted = `${Math.abs(location.longitude).toFixed(6)}° ${location.longitude >= 0 ? 'E' : 'W'}`

  return (
    <div className="space-y-4">
      {/* Location Accepted Banner */}
      <div className="p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium bg-secondary-container/50 border-secondary/30 text-secondary">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Location Acquired — coordinates ready for registration</span>
        </div>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/80 font-bold uppercase tracking-wider">
          READY
        </span>
      </div>

      {/* Primary Coordinates & Confidence Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low">
          <span className="text-label-sm font-label-sm uppercase text-outline">Location Confidence</span>
          <div className="font-display-hero text-[36px] text-secondary leading-none mt-1">
            {location.confidence}%
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex px-2 py-0.5 rounded text-label-sm font-label-sm uppercase font-bold bg-secondary-container text-on-secondary-container"
            >
              {location.status}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-outline uppercase text-label-sm">GPS Source</span>
            <span className="font-medium text-primary">{sourceLabel(location.source)}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-outline uppercase text-label-sm">Stability</span>
            <span className="font-mono-metric text-primary">{stabilityLabel(location.stabilityScore)}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-outline uppercase text-label-sm">Stability Score</span>
            <span className="font-mono-metric text-primary">{location.stabilityScore}%</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-outline uppercase text-label-sm">Accuracy Radius</span>
            <span className="font-mono-metric text-primary">±{location.accuracy.toFixed(1)} m</span>
          </div>
        </div>
      </div>

      {/* Geolocation Details Card: Latitude & Longitude Readouts */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
          <span>Verified Geolocation Coordinates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-surface-container-low">
            <span className="block text-[11px] text-outline font-mono uppercase">Latitude</span>
            <span className="font-mono font-bold text-sm text-primary">{latFormatted}</span>
            <span className="block text-[10px] text-on-surface-variant font-mono">{location.latitude.toFixed(6)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low">
            <span className="block text-[11px] text-outline font-mono uppercase">Longitude</span>
            <span className="font-mono font-bold text-sm text-primary">{lonFormatted}</span>
            <span className="block text-[10px] text-on-surface-variant font-mono">{location.longitude.toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
