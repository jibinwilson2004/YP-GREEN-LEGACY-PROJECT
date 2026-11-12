import { useState } from 'react'
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
  isPermissionDenied,
  onStart,
  onRerequestPermission,
}: {
  phase: GpsPhase
  readings: GeoReading[]
  verified: VerifiedLocation | null
  error: string | null
  isPermissionDenied?: boolean
  onStart: () => void
  onRerequestPermission?: () => void
}) {
  const [showHelp, setShowHelp] = useState(false)

  const isDenied = Boolean(
    isPermissionDenied ||
      (error && (error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission'))),
  )

  const handleRerequest = () => {
    if (onRerequestPermission) {
      onRerequestPermission()
    } else {
      onStart()
    }
  }

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
            className="mt-6 bg-primary hover:bg-secondary text-on-primary font-label-md px-6 py-3 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            Collect GPS Readings
          </button>
        </div>
      )}

      {(phase === 'requesting' || phase === 'collecting') && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary animate-spin">progress_activity</span>
              <div>
                <h2 className="font-headline-sm text-primary font-semibold">
                  {phase === 'requesting' ? 'Requesting Location Permission…' : 'Collecting GPS Readings'}
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  {phase === 'requesting'
                    ? 'Please allow location permission in the browser prompt if requested.'
                    : 'Hold steady in an open area while we average GPS fixes…'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRerequest}
              className="text-xs text-secondary hover:text-primary underline cursor-pointer"
              title="Click if prompt did not appear"
            >
              Re-request prompt
            </button>
          </div>
          <GPSReadings readings={readings} />
        </div>
      )}

      {phase === 'error' && error && (
        <div className="rounded-xl p-6 bg-error-container/40 text-on-error-container border border-error/30 shadow-xs animate-fade-in space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px] text-error">
                {isDenied ? 'location_disabled' : 'signal_cellular_connected_no_internet_0_bar'}
              </span>
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-base text-error">
                {isDenied
                  ? 'Location Permission Denied'
                  : error.toLowerCase().includes('timeout')
                    ? 'GPS Signal Acquisition Delayed'
                    : 'GPS Location Unavailable'}
              </h3>
              <p className="text-sm text-on-error-container leading-relaxed">
                {isDenied
                  ? 'Location permission was rejected while collecting GPS. Accurate coordinates are required to record the tree on the live map and verify the planting.'
                  : error.toLowerCase().includes('timeout')
                    ? 'Hardware GPS satellite lock took longer than expected. Click "Try Again" below to instantly acquire coordinates with network-assisted positioning.'
                    : error}
              </p>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                {isDenied ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRerequest}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-bold text-sm shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">near_me</span>
                      <span>Re-request Location Permission</span>
                    </button>
                    <button
                      type="button"
                      onClick={onStart}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Try Again</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onStart}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-bold text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    <span>Try Again (Assisted GPS)</span>
                  </button>
                )}
              </div>

              {/* Browser settings guidance toggle */}
              {isDenied && (
                <div className="pt-3 border-t border-error/20 mt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowHelp((prev) => !prev)}
                    className="text-secondary hover:text-primary font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showHelp ? 'expand_less' : 'help'}
                    </span>
                    <span>{showHelp ? 'Hide browser permission tips' : 'Still blocked? How to unblock in browser settings'}</span>
                  </button>

                  {showHelp && (
                    <div className="mt-2.5 p-3 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/60 space-y-2">
                      <p className="font-medium text-xs text-primary">
                        If your browser permanently blocked location access for this site:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-on-surface-variant">
                        <li>
                          <strong>Chrome / Edge / Brave:</strong> Click the <strong>lock 🔒 or tune 🎛️</strong> icon on the left side of the URL bar $\rightarrow$ <strong>Permissions</strong> $\rightarrow$ switch <strong>Location</strong> to <strong>Allow</strong> $\rightarrow$ click <em>Re-request Location Permission</em>.
                        </li>
                        <li>
                          <strong>Safari (iOS / macOS):</strong> Tap <strong>aA</strong> in the search bar or open <strong>Settings</strong> $\rightarrow$ <strong>Website Settings</strong> $\rightarrow$ <strong>Location</strong> $\rightarrow$ choose <strong>Allow</strong>.
                        </li>
                        <li>
                          <strong>Android Chrome:</strong> Tap the three dots $\vdots$ $\rightarrow$ <strong>Settings</strong> $\rightarrow$ <strong>Site Settings</strong> $\rightarrow$ <strong>Location</strong> $\rightarrow$ set to <strong>Allow</strong>.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
