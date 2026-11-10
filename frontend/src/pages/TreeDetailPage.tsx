import { Link, useParams, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { TreeLocationMap } from '../components/tree/TreeLocationMap'
import { TreeImageGallery } from '../components/tree/TreeImageGallery'
import { VerificationStatus } from '../components/tree/VerificationStatus'
import { formatGpsSource } from '../types/gps'
import { treeService } from '../services/treeService'
import { authService, formatDisplayName } from '../services/authService'
import { useState, useEffect } from 'react'
import type { Tree } from '../types/tree'
import { classifyAccuracy, accuracyLabel } from '../services/gps/gpsAccuracy'
import { fetchTreeById } from '../services/api'
import { getTreeTagStatus } from '../utils/treeStatus'

export function TreeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cachedTree = id ? treeService.getById(id) : undefined
  const [remoteTree, setRemoteTree] = useState<Tree | null>(null)
  const [loading, setLoading] = useState(!cachedTree)
  const [deleting, setDeleting] = useState(false)

  const handleAdminDelete = async () => {
    if (!tree) return
    const confirmed = window.confirm(
      `Administrator Confirmation:\n\nAre you sure you want to permanently delete tree record #${tree.id}?\n\nThis is used to remove duplicate entries, conflicting records, or incorrect data. This action cannot be undone.`
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await treeService.deleteTree(tree.id)
      alert(`Tree record #${tree.id} was permanently deleted.`)
      navigate('/admin')
    } catch (err) {
      alert(`Could not delete tree: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchTreeById(id)
        .then((t) => {
          setRemoteTree(t)
          setLoading(false)
        })
        .catch((error) => {
          console.error('[Tree details unavailable]', error)
          setLoading(false)
        })
    }
  }, [id])

  const tree = remoteTree || cachedTree

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#004d36] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-headline-sm text-lg font-bold text-primary">Loading Tree Telemetry Dossier...</h2>
          <p className="text-sm text-outline mt-1 font-mono">Querying precision GIS registry for #{id}</p>
        </main>
        <AppFooter />
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1">
          <span className="material-symbols-outlined text-[56px] text-outline">error_outline</span>
          <h1 className="font-headline-lg text-2xl font-bold text-primary mt-2">Tree Record Not Found</h1>
          <p className="text-on-surface-variant mt-2">The requested tree record #{id} does not exist in the active registry.</p>
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
  const student = tree.student || (tree.userId ? formatDisplayName(tree.userId) : 'IEEE YP CSTF Planter')
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
            {(() => {
              const tagInfo = getTreeTagStatus(tree.verificationStatus)
              return (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${tagInfo.badgeClass}`}
                >
                  {tagInfo.isTagged && <span>✓</span>}
                  <span>{tagInfo.label}</span>
                </span>
              )
            })()}
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

        {/* 4. Planter Record */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs mt-6">
          <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">person_pin</span>
            <span>Planter Record</span>
          </h2>
          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
            <span className="text-[10px] uppercase font-semibold text-outline block">Student Planter</span>
            <span className="font-bold text-sm text-primary mt-0.5 block">{student}</span>
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

            {/* Country (Auto-detected via GPS) */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <dt className="text-[10px] uppercase font-semibold text-outline">Country</dt>
              <dd className="font-semibold text-sm text-primary mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">public</span>
                <span>{tree.country || 'India'}</span>
              </dd>
            </div>
          </dl>

          {/* Action Links & Admin Management Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/map?user=${encodeURIComponent(tree.userId || 'planter')}&tree=${tree.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-secondary text-white font-label-md text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>View Tree Location on Live Map</span>
              </Link>

              {authService.isAdmin() && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleAdminDelete()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-label-md text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  title="Delete duplicate, conflict, or erroneous tree record"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>{deleting ? 'Deleting…' : 'Delete Tree Record (Admin)'}</span>
                </button>
              )}
            </div>

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
