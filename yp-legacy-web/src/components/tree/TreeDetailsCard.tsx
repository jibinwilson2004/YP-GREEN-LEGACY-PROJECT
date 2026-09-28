import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TreeImageGallery } from './TreeImageGallery'
import { VerificationStatus } from './VerificationStatus'
import { formatGpsSource } from '../../types/gps'
import { formatDisplayName } from '../../services/authService'
import type { Tree } from '../../types/tree'

interface TreeDetailsCardProps {
  tree: Tree
  onClose?: () => void
  onViewDetails?: () => void
  className?: string
  fullWidth?: boolean
  initialMinimized?: boolean
}

export function TreeDetailsCard({
  tree,
  onClose,
  onViewDetails,
  className = '',
  fullWidth = false,
  initialMinimized = false,
}: TreeDetailsCardProps) {
  const [isMinimized, setIsMinimized] = useState(initialMinimized)
  const [showTelemetry, setShowTelemetry] = useState(false)

  const images =
    tree.images && tree.images.length > 0
      ? tree.images
      : [tree.imageUrl || '/assets/images/tree-sapling.png']
  const commonName = tree.commonName || 'Neem'
  const botanicalName =
    tree.botanicalName ||
    (tree.species === 'Azardica indica' ? 'Azadirachta indica' : tree.species) ||
    'Azadirachta indica'
  const dateOfPlanting = tree.dateOfPlanting || '31-08-2026'
  const student = tree.student || (tree.userId ? formatDisplayName(tree.userId) : 'IEEE YP CSTF Planter')
  const college = tree.college || 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV'
  const cluster = tree.cluster || 'TRV'
  const sourceLabel = formatGpsSource(tree.gpsSource)


  // Minimized floating pill mode for maximum map visibility
  if (isMinimized) {
    return (
      <div
        className={`bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-xl border border-outline-variant/60 p-2.5 flex items-center justify-between gap-3 text-on-surface select-none transition-all ${
          fullWidth ? 'w-full' : 'w-full max-w-[320px] sm:max-w-[340px]'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/30">
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
            title="Expand Details Card"
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
      className={`bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/60 overflow-hidden flex flex-col transition-all text-on-surface ${
        fullWidth ? 'w-full' : 'w-full max-w-[320px] sm:max-w-[340px]'
      } ${className}`}
    >
      {/* 1. COMPACT HERO PHOTO CAROUSEL */}
      <div className="relative">
        <TreeImageGallery
          images={images}
          speciesName={commonName}
          heightClass="h-32 sm:h-36"
          roundedClass="rounded-t-2xl rounded-b-none"
          showBadge={false}
          onClose={onClose}
        />
        {/* Top Badges & Controls Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="font-mono text-[10px] font-bold bg-primary/85 text-primary-fixed backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs">
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

      {/* 2. CARD BODY: COMPACT TREE SPECIES & ESSENTIAL METRICS */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col space-y-3">
        {/* Tree Name & Botanical Subtitle */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary tracking-tight leading-tight">
              {commonName}
            </h3>
            <p className="text-xs italic font-medium text-secondary mt-0.5 leading-none">
              {botanicalName}
            </p>
          </div>
          <span className="flex-shrink-0 text-[11px] font-mono font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
            {tree.locationConfidence}% Conf
          </span>
        </div>

        {/* Compact Key Attributes Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-outline tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">person</span>
              <span>Student</span>
            </span>
            <span className="font-bold text-primary truncate mt-0.5" title={student}>
              {student}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-outline tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">school</span>
              <span>Cluster</span>
            </span>
            <span className="font-bold text-primary truncate mt-0.5 font-mono">
              {cluster}
            </span>
          </div>
        </div>

        {/* GPS Coordinates & Accuracy Bar */}
        <div className="px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-mono font-medium text-primary">
            <span className="material-symbols-outlined text-[15px] text-secondary">my_location</span>
            <span>{tree.latitude.toFixed(4)}°, {tree.longitude.toFixed(4)}°</span>
          </div>
          <span className="font-mono font-semibold text-outline text-[10px]">
            ±{tree.accuracy.toFixed(1)}m
          </span>
        </div>

        {/* Expandable Telemetry Accordion */}
        <div className="border-t border-outline-variant/30 pt-2">
          <button
            type="button"
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="w-full flex items-center justify-between text-[11px] font-label-sm font-semibold text-outline hover:text-primary transition-colors cursor-pointer py-0.5"
          >
            <span>Telemetry &amp; Audit Details</span>
            <span className={`material-symbols-outlined text-[16px] transition-transform ${showTelemetry ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {showTelemetry && (
            <div className="mt-2 space-y-1.5 text-[11px] text-on-surface-variant bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/20 animate-fade-in">
              <div className="flex justify-between">
                <span className="text-outline">College:</span>
                <span className="font-medium text-right text-primary truncate max-w-[170px]" title={college}>
                  {college}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Planting Date:</span>
                <span className="font-mono font-semibold text-primary">{dateOfPlanting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">GPS Source:</span>
                <span className="text-primary truncate max-w-[170px]">{sourceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Readings:</span>
                <span className="font-mono font-semibold text-primary">{tree.readingCount} samples</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Verified By:</span>
                <span className="text-secondary font-semibold">{tree.verifiedBy || 'IEEE YP CSTF'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: View Full Tree Details */}
        <div className="pt-1">
          {onViewDetails ? (
            <button
              type="button"
              onClick={onViewDetails}
              className="w-full py-2 px-3.5 bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>View Full Tree Details</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          ) : (
            <Link
              to={`/trees/${tree.id}`}
              className="w-full py-2 px-3.5 bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold rounded-lg transition-colors text-center shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>View Full Tree Details</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
