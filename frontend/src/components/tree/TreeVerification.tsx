import type { TreeCaptureDraft } from '../../types/tree'
import { GPSStatus } from '../gps/GPSStatus'
import { formatMeters } from '../../services/gps/gpsAccuracy'
import { stabilityLabel } from '../../services/gps/gpsStability'

function gpsSourceLabel(source: string) {
  if (source === 'SMARTPHONE_GPS') return 'Smartphone GPS'
  if (source === 'RTK_GNSS') return 'RTK GNSS'
  return source.replace(/_/g, ' ')
}

export function TreeVerification({
  draft,
  identificationConfidence,
  onConfirm,
  submitting,
}: {
  draft: TreeCaptureDraft
  identificationConfidence: number
  onConfirm: () => void
  submitting?: boolean
}) {
  const loc = draft.location
  if (!loc) return null

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/40">
        <h2 className="font-headline-md text-headline-md text-primary mb-6">Review & Verify</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-md">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">Tree ID</dt>
            <dd className="font-mono-metric text-primary font-semibold mt-1">{draft.treeIdPreview}</dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">Species</dt>
            <dd className="font-medium text-primary mt-1">{draft.species}</dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low sm:col-span-2">
            <dt className="text-label-sm uppercase text-outline">Location</dt>
            <dd className="font-mono-metric text-[14px] mt-1">
              {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
            </dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">GPS Accuracy</dt>
            <dd className="font-mono-metric text-primary mt-1">{formatMeters(loc.accuracy)}</dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">GPS Readings</dt>
            <dd className="font-mono-metric text-primary mt-1">{loc.readingCount}</dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">GPS Source</dt>
            <dd className="font-medium mt-1">{gpsSourceLabel(loc.source)}</dd>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <dt className="text-label-sm uppercase text-outline">Stability</dt>
            <dd className="font-medium mt-1">{stabilityLabel(loc.stabilityScore)}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-secondary-container bg-secondary-container/30">
            <span className="text-label-sm uppercase text-outline">🌳 Tree Identification</span>
            <div className="font-display-hero text-[32px] text-primary">{identificationConfidence}%</div>
          </div>
          <div className="p-4 rounded-xl border border-outline-variant/40">
            <span className="text-label-sm uppercase text-outline">📍 Location Verification</span>
            <div className="font-display-hero text-[32px] text-secondary">{loc.confidence}%</div>
          </div>
        </div>

        <GPSStatus location={loc} />

        {draft.photoPreviewUrl && (
          <div className="mt-6">
            <span className="text-label-sm uppercase text-outline">Tree Photo</span>
            <img
              src={draft.photoPreviewUrl}
              alt="Tree"
              className="mt-2 rounded-xl max-h-64 w-full object-cover border border-outline-variant/40"
            />
          </div>
        )}

        {draft.anomalies.length > 0 && (
          <ul className="mt-4 space-y-2">
            {draft.anomalies.map((a) => (
              <li key={a.type} className="flex items-center gap-2 text-error font-label-md">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                ⚠ {a.message}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={onConfirm}
          className="mt-8 w-full sm:w-auto bg-primary hover:bg-secondary disabled:opacity-50 text-on-primary font-label-md px-8 py-3.5 rounded-lg shadow-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">verified</span>
          Confirm & Register Tree
        </button>
      </div>
    </div>
  )
}
