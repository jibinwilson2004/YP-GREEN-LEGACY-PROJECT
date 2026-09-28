import {
  accuracyHint,
  accuracyLabel,
  classifyAccuracy,
  formatMeters,
} from '../../services/gps/gpsAccuracy'

export function GPSAccuracy({ meters }: { meters: number }) {
  const tier = classifyAccuracy(meters)
  const ok = tier === 'HIGH_PRECISION' || tier === 'VERIFIED'
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/40">
      <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline">Location Accuracy</span>
      <div className="font-mono-metric text-[28px] text-primary font-semibold mt-2">{formatMeters(meters)}</div>
      <div
        className={`mt-3 flex items-center gap-2 text-label-md font-label-md ${
          ok ? 'text-secondary' : 'text-error'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{ok ? 'check_circle' : 'warning'}</span>
        <span>{ok ? '✓' : '⚠'} {accuracyLabel(tier)}</span>
      </div>
      {accuracyHint(tier) && (
        <p className="mt-2 text-body-sm text-on-surface-variant">{accuracyHint(tier)}</p>
      )}
    </div>
  )
}
