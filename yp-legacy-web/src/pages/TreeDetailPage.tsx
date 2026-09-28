import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeLocationMap } from '../components/tree/TreeLocationMap'
import { TreeImageGallery } from '../components/tree/TreeImageGallery'
import { VerificationStatus } from '../components/tree/VerificationStatus'
import { formatGpsSource } from '../types/gps'
import { treeService } from '../services/treeService'
import { classifyAccuracy, accuracyLabel } from '../services/gps/gpsAccuracy'

export function TreeDetailPage() {
  const { id } = useParams()
  const tree = id ? treeService.getById(id) : undefined

  if (!tree) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1">
          <span className="material-symbols-outlined text-[56px] text-outline">error_outline</span>
          <h1 className="font-headline-lg text-2xl font-bold text-primary mt-2">Tree Record Not Found</h1>
          <p className="text-on-surface-variant mt-2">The requested tree record does not exist in the active registry.</p>
          <Link
            to="/trees"
            className="inline-flex items-center gap-1.5 mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:bg-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Tree Registry</span>
          </Link>
        </main>
        <AppFooter />
      </div>
    )
  }

  // Botanical & tree names
  const commonName = tree.commonName || 'Neem'
  const botanicalName =
    tree.botanicalName ||
    (tree.species === 'Azardica indica' ? 'Azadirachta indica' : tree.species) ||
    'Azadirachta indica'
  const dateOfPlanting = tree.dateOfPlanting || '31-08-2026'
  const updatedAt = tree.updatedAt || '31-08-2026'
  const student = tree.student || 'SORNA SAKTHI GANESH V'
  const college = tree.college || 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV'
  const cluster = tree.cluster || 'TRV'
  const institution = tree.institution || 'APJAKTU NSSCELL NRPF'
  const verifiedBy = tree.verifiedBy || 'IEEE YP CSTF'
  const verificationDate = tree.verificationDate || '31-08-2026'
  const accuracyTier = classifyAccuracy(tree.accuracy)
  const sourceLabel = formatGpsSource(tree.gpsSource)
  const stability = tree.gpsStability || (tree.stabilityScore >= 75 ? 'Stable' : 'Moderate')

  const images =
    tree.images && tree.images.length > 0
      ? tree.images
      : [tree.imageUrl || '/assets/images/tree-sapling.png']

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      <main className="max-w-4xl mx-auto w-full px-grid-margin-mobile lg:px-grid-margin-desktop py-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
          <Link
            to="/trees"
            className="text-label-sm text-secondary hover:text-primary flex items-center gap-1 font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Tree Registry</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline font-mono">Tree ID: #{tree.id}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container flex items-center gap-1">
              <span>✓</span>
              <span>{tree.verificationStatus}</span>
            </span>
          </div>
        </div>

        {/* 1. TOP HERO: LIVE INTERACTIVE MAP (Primary Visual Element: Where the tree is) */}
        <div className="mt-6 rounded-2xl overflow-hidden shadow-xl border border-outline-variant/50 bg-[#e5ede9]">
          <TreeLocationMap
            tree={tree}
            height="360px"
            showConfidenceBadge
            showCloseButton={false}
          />
        </div>

        {/* 2. Header Title with Verified Icon & Botanical Subtitle */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-3xl sm:text-4xl font-bold text-primary tracking-tight">
                {commonName}
              </h1>
              <VerificationStatus status={tree.verificationStatus} />
            </div>
            <p className="text-base sm:text-lg italic font-medium text-secondary mt-1">
              {botanicalName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-mono bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-[15px] text-outline">calendar_today</span>
            <span>Date of Planting: {dateOfPlanting}</span>
            <span className="text-outline">•</span>
            <span>Updated: {updatedAt}</span>
          </div>
        </div>

        {/* 3. Dual Independent Confidence Metrics: Tree Identification vs Location Confidence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Tree Identification Confidence */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-secondary-container/80 bg-secondary-container/20 shadow-xs">
            <div className="flex items-center justify-between text-outline text-xs mb-1">
              <span className="font-label-sm uppercase font-semibold">🌳 TREE IDENTIFICATION CONFIDENCE</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">psychiatry</span>
            </div>
            <div className="font-display-hero text-3xl font-extrabold text-primary mt-1">
              {tree.identificationConfidence ?? 91}%
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-snug">
              Botanical species identification confirmed for <em>{botanicalName}</em>.
            </p>
          </div>

          {/* Location Confidence */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-secondary-container/80 bg-secondary-container/20 shadow-xs">
            <div className="flex items-center justify-between text-outline text-xs mb-1">
              <span className="font-label-sm uppercase font-semibold">📍 LOCATION CONFIDENCE</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">my_location</span>
            </div>
            <div className="font-display-hero text-3xl font-extrabold text-secondary mt-1">
              {tree.locationConfidence}%
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-snug">
              Multi-sample stability score of {tree.stabilityScore}% across {tree.readingCount} GPS readings.
            </p>
          </div>
        </div>

        {/* 4. Planting Information & Academic Institution Details */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs mt-6">
          <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">person_pin</span>
            <span>Planting &amp; Academic Institution Record</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <span className="text-[10px] uppercase font-semibold text-outline block">Student Planter</span>
              <span className="font-bold text-sm text-primary mt-0.5 block">{student}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <span className="text-[10px] uppercase font-semibold text-outline block">Cluster</span>
              <span className="font-bold text-sm text-primary mt-0.5 block font-mono">{cluster}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40 sm:col-span-2">
              <span className="text-[10px] uppercase font-semibold text-outline block">College</span>
              <span className="font-medium text-sm text-on-surface mt-0.5 block leading-snug">{college}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40 sm:col-span-2">
              <span className="text-[10px] uppercase font-semibold text-outline block">Institution</span>
              <span className="font-medium text-sm text-on-surface mt-0.5 block leading-snug">{institution}</span>
            </div>
          </div>
        </div>

        {/* 5. Supporting Visual Evidence: Tree Photograph (What the tree looks like) */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs mt-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant/40 mb-4">
            <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">photo_camera</span>
              <span>Photographic Verification Evidence</span>
            </h2>
            <span className="text-xs text-on-surface-variant font-medium">
              Field Capture Evidence • {images.length} photos
            </span>
          </div>
          <TreeImageGallery
            images={images}
            speciesName={commonName}
            heightClass="h-64 sm:h-80"
            roundedClass="rounded-xl"
            showBadge
          />
        </div>

        {/* LOCATION VERIFICATION & AUDIT AUDIT SECTION */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs mt-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant/40">
            <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
              <span>Location Verification &amp; Planting Audit</span>
            </h2>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span>✓</span>
              <span>Verification Status: Verified</span>
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Coordinates */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Coordinates</dt>
              <dd className="font-mono font-bold text-sm text-primary mt-1">
                {tree.latitude.toFixed(5)}°, {tree.longitude.toFixed(5)}°
              </dd>
            </div>

            {/* GPS Accuracy */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">GPS Accuracy</dt>
              <dd className="font-mono font-bold text-sm text-primary mt-1">
                ±{tree.accuracy.toFixed(1)} m ({accuracyLabel(accuracyTier)})
              </dd>
            </div>

            {/* GPS Confidence */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Location Confidence</dt>
              <dd className="font-mono font-bold text-sm text-secondary mt-1">
                {tree.locationConfidence}%
              </dd>
            </div>

            {/* GPS Source */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">GPS Source</dt>
              <dd className="font-medium text-sm text-primary mt-1">
                {sourceLabel}
              </dd>
            </div>

            {/* GPS Stability */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">GPS Stability</dt>
              <dd className="font-semibold text-sm text-secondary mt-1 flex items-center gap-1">
                <span>✓</span>
                <span>{stability}</span>
              </dd>
            </div>

            {/* GPS Readings */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">GPS Readings</dt>
              <dd className="font-mono font-bold text-sm text-primary mt-1">
                {tree.readingCount} samples
              </dd>
            </div>

            {/* Verified By */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Verified By</dt>
              <dd className="font-medium text-sm text-primary mt-1">
                {verifiedBy}
              </dd>
            </div>

            {/* Verification Date */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Verification Date</dt>
              <dd className="font-mono font-medium text-sm text-primary mt-1">
                {verificationDate}
              </dd>
            </div>

            {/* Date of Planting */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Date of Planting</dt>
              <dd className="font-mono font-medium text-sm text-primary mt-1">
                {dateOfPlanting}
              </dd>
            </div>
          </dl>

          {/* Action Link to Live Map */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to={`/map?user=sorna-sakthi-ganesh&tree=${tree.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-secondary text-white font-label-md text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>View Tree Location on Live Map</span>
            </Link>
            <Link
              to="/trees"
              className="text-xs text-outline hover:text-primary font-medium transition-colors"
            >
              Return to Tree Registry List
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
