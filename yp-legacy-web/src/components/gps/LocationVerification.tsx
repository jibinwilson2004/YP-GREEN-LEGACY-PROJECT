import { GPSAccuracy } from './GPSAccuracy'
import { GPSReadings } from './GPSReadings'
import { GPSStatus } from './GPSStatus'
import type { GeoReading, VerifiedLocation } from '../../types/tree'
import type { GpsPhase } from '../../hooks/useGPS'

export function LocationVerification({
  phase,
  readings,
  verified,
  error,
  onStart,
}: {
  phase: GpsPhase
  readings: GeoReading[]
  verified: VerifiedLocation | null
  error: string | null
  onStart: () => void
}) {
  return (
    <div className="space-y-4">
      {phase === 'idle' && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 text-center">
          <span className="material-symbols-outlined text-[48px] text-secondary">my_location</span>
          <h2 className="font-headline-md text-headline-md text-primary mt-3">Request Location</h2>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
            We collect multiple GPS readings over 5–15 seconds to verify stability before you capture a tree photo.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-6 bg-primary hover:bg-secondary text-on-primary font-label-md px-6 py-3 rounded-lg shadow-sm"
          >
            Collect GPS Readings
          </button>
        </div>
      )}

      {(phase === 'requesting' || phase === 'collecting') && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary animate-spin">progress_activity</span>
            <div>
              <h2 className="font-headline-sm text-primary">Collecting GPS Readings</h2>
              <p className="text-body-sm text-on-surface-variant">Hold steady in an open area…</p>
            </div>
          </div>
          <GPSReadings readings={readings} />
        </div>
      )}

      {phase === 'error' && error && (
        <div className="rounded-xl p-5 bg-error-container text-on-error-container border border-error/20">
          <div className="flex items-center gap-2 font-label-md">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
          <button type="button" onClick={onStart} className="mt-4 text-label-md font-semibold text-primary underline">
            Try again
          </button>
        </div>
      )}

      {verified && phase === 'done' && (
        <>
          <GPSAccuracy meters={verified.accuracy} />
          <GPSStatus location={verified} />
          <GPSReadings readings={readings} />
        </>
      )}
    </div>
  )
}
