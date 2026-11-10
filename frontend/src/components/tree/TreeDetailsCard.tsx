import { useState } from 'react'
import { TreeImageGallery } from './TreeImageGallery'
import { VerificationStatus } from './VerificationStatus'
import { formatGpsSource } from '../../types/gps'
import { formatDisplayName } from '../../services/authService'
import { classifyAccuracy, accuracyLabel } from '../../services/gps/gpsAccuracy'
import type { Tree } from '../../types/tree'

interface TreeDetailsCardProps {
  tree: Tree
  onClose?: () => void
  className?: string
  fullWidth?: boolean
  initialMinimized?: boolean
}

export function TreeDetailsCard({
  tree,
  onClose,
  className = '',
  fullWidth = false,
  initialMinimized = false,
}: TreeDetailsCardProps) {
  const [isMinimized, setIsMinimized] = useState(initialMinimized)

  const images =
    tree.images && tree.images.length > 0
      ? tree.images
      : [tree.imageUrl || '/assets/images/tree-sapling.png']
  const commonName = tree.commonName || tree.species || 'Neem'
  const botanicalName =
    tree.botanicalName ||
    (tree.species === 'Azardica indica' ? 'Azadirachta indica' : tree.species) ||
    'Azadirachta indica'
  const dateOfPlanting = tree.dateOfPlanting || '31-08-2026'
  const capturedAtFormatted = tree.capturedAt ? new Date(tree.capturedAt).toLocaleDateString('en-IN') : dateOfPlanting
  const student = tree.student || (tree.userId ? formatDisplayName(tree.userId) : 'IEEE YP CSTF Planter')
  const sourceLabel = formatGpsSource(tree.gpsSource)
  const accuracyTier = classifyAccuracy(tree.accuracy)
  const stability = tree.gpsStability || (tree.stabilityScore >= 75 ? 'Stable' : 'Moderate')
  const country = tree.country || 'India'

  // Minimized floating pill mode for quick toggling
  if (isMinimized) {
    return (
      <div
        className={`bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-xl border border-outline-variant/60 p-2.5 flex items-center justify-between gap-3 text-on-surface select-none transition-all ${
          fullWidth ? 'w-full' : 'w-full max-w-[320px] sm:max-w-[360px]'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/30">
            <img src={images[0]} alt={commonName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-primary truncate">{commonName}</span>
              <span className="font-mono text-[10px] text-secondary font-semibold">#{tree.id}</span>
            </div>
            <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="text-secondary font-semibold">📍 {tree.locationConfidence}% Conf</span>
              <span>•</span>
              <span className="truncate">{tree.latitude.toFixed(3)}°, {tree.longitude.toFixed(3)}°</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="w-7 h-7 rounded-lg hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
            title="Expand Complete Tree Details"
            aria-label="Expand"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_full</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-surface-container-high text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-surface-container-lowest/98 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/60 overflow-hidden flex flex-col transition-all text-on-surface max-h-[82vh] ${
        fullWidth ? 'w-full' : 'w-full max-w-[340px] sm:max-w-[380px]'
      } ${className}`}
    >
      {/* 1. HERO PHOTO CAROUSEL */}
      <div className="relative flex-shrink-0">
        <TreeImageGallery
          images={images}
          speciesName={commonName}
          heightClass="h-36 sm:h-44"
          roundedClass="rounded-t-2xl rounded-b-none"
          showBadge={false}
          onClose={onClose}
        />

        {/* Top Badges & Controls Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="font-mono text-[11px] font-bold bg-primary/90 text-primary-fixed backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
            #{tree.id}
          </span>
          <VerificationStatus status={tree.verificationStatus} />
        </div>

        <div className="absolute top-2.5 right-10 z-10 flex items-center">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
            title="Minimize Card"
            aria-label="Minimize"
          >
            <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
          </button>
        </div>
      </div>

      {/* 2. COMPLETE TREE DETAILS BODY (Direct complete presentation without separate view details button) */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3.5 pr-3">
        {/* Tree Species Header */}
        <div className="border-b border-outline-variant/30 pb-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-primary tracking-tight leading-tight">
                {commonName}
              </h3>
              <p className="text-xs italic font-medium text-secondary mt-0.5">
                {botanicalName}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full whitespace-nowrap">
              {country}
            </span>
          </div>
        </div>

        {/* Dual Confidence Badges */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-800 tracking-wider">
              Tree ID Conf
            </span>
            <span className="font-bold text-base font-mono text-emerald-900 mt-0.5">
              {tree.identificationConfidence ?? 91}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-100 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-semibold text-teal-800 tracking-wider">
              Location Conf
            </span>
            <span className="font-bold text-base font-mono text-teal-900 mt-0.5">
              {tree.locationConfidence}%
            </span>
          </div>
        </div>

        {/* Planter & Planting Details */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-outline tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">person</span>
              <span>Student Planter</span>
            </span>
            <span className="font-bold text-primary truncate mt-0.5" title={student}>
              {student}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-outline tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">calendar_today</span>
              <span>Planted On</span>
            </span>
            <span className="font-bold text-primary font-mono truncate mt-0.5">
              {dateOfPlanting}
            </span>
          </div>
        </div>

        {/* Complete Geospatial Telemetry Dossier */}
        <div className="space-y-1.5 text-[11px] bg-surface-container-low/70 p-3 rounded-xl border border-outline-variant/30">
          <div className="text-[10px] uppercase font-bold text-secondary tracking-wider flex items-center gap-1 mb-1 border-b border-outline-variant/20 pb-1">
            <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
            <span>Geospatial Verification Telemetry</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">GPS Coordinates:</span>
            <span className="font-mono font-bold text-primary text-[11px]">
              {tree.latitude.toFixed(5)}°, {tree.longitude.toFixed(5)}°
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">GPS Accuracy:</span>
            <span className="font-mono font-semibold text-primary">
              ±{tree.accuracy.toFixed(1)}m ({accuracyLabel(accuracyTier)})
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">GPS Source:</span>
            <span className="font-medium text-primary">{sourceLabel}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">Multi-Sample Stability:</span>
            <span className="font-medium text-emerald-800 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{stability} ({tree.stabilityScore}%)</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">Audit Samples:</span>
            <span className="font-mono text-primary font-semibold">{tree.readingCount} readings</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">Country:</span>
            <span className="font-medium text-primary">{country}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-outline">Recorded Timestamp:</span>
            <span className="font-mono text-primary text-[10px]">{capturedAtFormatted}</span>
          </div>
        </div>

        {/* Audit & Verification Block */}
        <div className="space-y-1 text-[11px] bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
          <div className="flex justify-between items-center">
            <span className="text-outline text-[10px] uppercase font-semibold">Verification:</span>
            <span className="font-bold text-secondary flex items-center gap-1">
              <span>✓</span>
              <span>{tree.verificationStatus}</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-outline text-[10px]">Verified By:</span>
            <span className="font-medium text-primary text-[11px]">{tree.verifiedBy || 'IEEE YP CSTF'}</span>
          </div>
          {tree.verificationDate && (
            <div className="flex justify-between items-center">
              <span className="text-outline text-[10px]">Audit Date:</span>
              <span className="font-mono text-primary text-[10px]">
                {new Date(tree.verificationDate).toLocaleDateString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
