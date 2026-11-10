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
        <div className="rounded-xl p-5 bg-error-container text-on-error-container border border-error/30 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-error flex-shrink-0 mt-0.5">
              {error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission')
                ? 'location_disabled'
                : 'signal_cellular_connected_no_internet_0_bar'}
            </span>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-sm text-error">
                {error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission')
                  ? 'Location Access Denied'
                  : 'GPS Location Unavailable'}
              </h3>
              <p className="text-xs text-on-error-container leading-relaxed">
                {error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission')
                  ? 'GPS access was denied by your browser or device permissions. To tag a tree, please allow location access in your browser or device site settings and click Try Again.'
                  : error}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-on-primary text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Grant Permission &amp; Try Again</span>
                </button>
              </div>
            </div>
          </div>
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
