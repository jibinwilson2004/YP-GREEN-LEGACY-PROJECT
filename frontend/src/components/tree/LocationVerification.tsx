import { formatGpsSource } from '../../types/gps'
import type { Tree } from '../../types/tree'

interface LocationVerificationProps {
  tree: Tree
  className?: string
}

export function LocationVerification({ tree, className = '' }: LocationVerificationProps) {
  // Support dynamic values passed via props or state
  const latFormatted = `${tree.latitude.toFixed(5)}°`
  const lonFormatted = `${tree.longitude.toFixed(5)}°`
  const accuracyMeters = tree.accuracy
  const confidence = tree.locationConfidence
  const readingsCount = tree.readingCount
  const sourceLabel = formatGpsSource(tree.gpsSource)
  const stability = tree.gpsStability || (tree.stabilityScore >= 75 ? 'Stable' : 'Moderate')
  const verificationStatus = tree.verificationStatus === 'VERIFIED' ? 'Verified' : tree.verificationStatus
  const verifiedBy = tree.verifiedBy || 'IEEE YP CSTF'
  const verificationDate = tree.verificationDate || '31-08-2026'

  return (
    <div className={`pt-4 border-t border-outline-variant/40 space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-sm text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">my_location</span>
          <span>LOCATION VERIFICATION</span>
        </h3>
        <span className="text-[11px] font-bold text-secondary flex items-center gap-1">
          <span>✓</span>
          <span>{verificationStatus}</span>
        </span>
      </div>

      {/* Primary Coordinates Readout */}
      <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
        <span className="text-[11px] text-outline font-medium">Coordinates:</span>
        <span className="font-mono text-xs font-bold text-primary">
          {latFormatted}, {lonFormatted}
        </span>
      </div>

      {/* Grid of Key GPS Status Indicators */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* GPS Accuracy */}
        <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
            GPS Accuracy
          </span>
          <span className="font-mono font-bold text-primary mt-0.5">
            ±{accuracyMeters.toFixed(1)} m
          </span>
        </div>

        {/* Location Confidence */}
        <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
            Location Confidence
          </span>
          <span className="font-mono font-bold text-secondary mt-0.5">
            {confidence}%
          </span>
        </div>

        {/* GPS Stability */}
        <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
            GPS Stability
          </span>
          <span className="text-secondary font-bold text-xs mt-0.5 flex items-center gap-1">
            <span>✓</span>
            <span>{stability}</span>
          </span>
        </div>

        {/* GPS Source */}
        <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
            GPS Source
          </span>
          <span className="font-medium text-primary text-xs mt-0.5 truncate" title={sourceLabel}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Audit Meta Rows */}
      <div className="space-y-1.5 pt-1 text-xs text-on-surface-variant">
        <div className="flex items-center justify-between">
          <span className="text-outline text-[11px]">GPS Readings:</span>
          <span className="font-mono font-semibold text-primary">{readingsCount} samples</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-outline text-[11px]">Verified By:</span>
          <span className="font-medium text-on-surface">{verifiedBy}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-outline text-[11px]">Verification Date:</span>
          <span className="font-mono font-medium text-on-surface">{verificationDate}</span>
        </div>
      </div>
    </div>
  )
}
