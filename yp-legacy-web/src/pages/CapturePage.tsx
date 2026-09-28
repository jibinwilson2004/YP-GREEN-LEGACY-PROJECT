import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { LocationVerification } from '../components/gps/LocationVerification'
import { TreePhoto } from '../components/tree/TreePhoto'
import { TreeVerification } from '../components/tree/TreeVerification'
import { useGPS } from '../hooks/useGPS'
import { useTreeCapture } from '../hooks/useTreeCapture'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { compressImage, blobToPreviewUrl } from '../utils/imageCompression'
import { registerTreeApi } from '../services/api'
import { treeService } from '../services/treeService'
import { authService } from '../services/authService'
import { SITE_NAME } from '../constants/assets'

const STEPS = [
  'Capture Tree',
  'Request Location',
  'GPS Verification',
  'Tree Photo',
  'Tree Details',
  'Review',
  'Register',
]

export function CapturePage() {
  const gps = useGPS()
  const capture = useTreeCapture()
  const offline = useOfflineQueue()
  const [submitting, setSubmitting] = useState(false)

  // Auth guard — must be a registered/logged-in user (not admin)
  const authUser = authService.getCurrentUser()
  if (!authUser || authUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#004d36] flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[32px] text-[#a2f0cc]">lock</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-500 text-sm mb-7">
              You need to be a registered IEEE YP Green Legacy member to capture and register trees.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-[#004d36] text-white font-bold text-sm hover:bg-[#003326] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full py-3 rounded-xl border-2 border-[#004d36] text-[#004d36] font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Create an Account
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-5">
              Registration is free for all IEEE Young Professionals members.
            </p>
          </div>
        </main>
        <AppFooter />
      </div>
    )
  }
  const [registerError, setRegisterError] = useState<string | null>(null)

  useEffect(() => {
    if (gps.verified && capture.step === 'location') {
      capture.updateDraft({
        location: gps.verified,
        anomalies: gps.anomalies,
      })
    }
  }, [gps.verified, gps.anomalies, capture])

  const stepIndex =
    capture.step === 'intro'
      ? 0
      : capture.step === 'location'
        ? 1
        : capture.step === 'photo'
          ? 3
          : capture.step === 'details'
            ? 4
            : capture.step === 'review'
              ? 5
              : 6

  async function handlePhoto(file: File) {
    try {
      const compressed = await compressImage(file)
      const url = blobToPreviewUrl(compressed)
      capture.updateDraft({
        photoBlob: compressed,
        photoPreviewUrl: url,
      })
    } catch {
      setRegisterError('Photo upload failure')
    }
  }

  async function register() {
    setRegisterError(null)
    setSubmitting(true)
    capture.recomputeAnomalies()
    const draft = {
      ...capture.draft,
      identificationConfidence: capture.identificationConfidence,
    }
    const userId = localStorage.getItem('tree_tag_user_id') || 'field-worker'
    const tree = treeService.buildTreeFromDraft(draft, userId)
    if (!tree) {
      setRegisterError('Registration failure — incomplete data')
      setSubmitting(false)
      return
    }
    try {
      if (!navigator.onLine) {
        await offline.queue(draft, draft.photoBlob)
        capture.setStep('success')
        return
      }
      await registerTreeApi(tree)
      capture.setStep('success')
    } catch {
      await offline.queue(draft, draft.photoBlob)
      capture.setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />
      <main className="max-w-3xl mx-auto w-full px-grid-margin-mobile lg:px-grid-margin-desktop py-8 flex-1">
        <div className="mb-8">
          <Link to="/" className="text-label-sm text-secondary hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {SITE_NAME}
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-primary mt-4">Capture Tree</h1>
          <div className="flex flex-wrap gap-2 mt-4">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`px-2.5 py-1 rounded-full text-label-sm font-label-sm ${
                  i <= stepIndex
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          {!offline.isOnline && (
            <p className="mt-3 text-body-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">cloud_off</span>
              Offline mode — registrations will sync when connectivity returns.
              {offline.pendingCount > 0 && ` (${offline.pendingCount} queued)`}
            </p>
          )}
        </div>

        {capture.step === 'intro' && (
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/40 text-center shadow-sm">
            <span className="material-symbols-outlined text-[56px] text-secondary">forest</span>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-lg mx-auto">
              Field registration collects stable GPS, tree photo, and species data before verification.
            </p>
            <button
              type="button"
              onClick={() => capture.setStep('location')}
              className="mt-8 bg-primary text-on-primary font-label-md px-8 py-3 rounded-lg shadow-sm cursor-pointer hover:bg-secondary transition-colors"
            >
              Start Capture
            </button>
          </div>
        )}

        {capture.step === 'location' && (
          <>
            <LocationVerification
              phase={gps.phase}
              readings={gps.readings}
              verified={gps.verified}
              error={gps.error}
              onStart={() => void gps.startCollection()}
            />
            {gps.verified && (
              <button
                type="button"
                onClick={capture.goNext}
                className="mt-6 w-full bg-primary text-on-primary py-3 rounded-lg font-label-md cursor-pointer hover:bg-secondary transition-colors"
              >
                Continue to Photo
              </button>
            )}

          </>
        )}

        {capture.step === 'photo' && (
          <>
            <TreePhoto
              previewUrl={capture.draft.photoPreviewUrl}
              onCapture={(f) => void handlePhoto(f)}
              onClear={() =>
                capture.updateDraft({ photoPreviewUrl: undefined, photoBlob: undefined })
              }
            />
            {capture.draft.photoPreviewUrl && (
              <button
                type="button"
                onClick={capture.goNext}
                className="mt-6 w-full bg-primary text-on-primary py-3 rounded-lg font-label-md cursor-pointer hover:bg-secondary transition-colors"
              >
                Continue to Tree Information
              </button>
            )}
          </>
        )}

        {capture.step === 'details' && (
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
            <h2 className="font-headline-sm text-primary">Enter / Identify Tree Information</h2>
            <label className="block">
              <span className="text-label-sm uppercase text-outline">Species (scientific or common)</span>
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2.5 focus:ring-2 focus:ring-secondary/30 focus:border-primary outline-none"
                value={capture.draft.species}
                onChange={(e) => capture.updateDraft({ species: e.target.value })}
                placeholder="e.g. Mangifera indica (Mango)"
              />
            </label>
            <label className="block">
              <span className="text-label-sm uppercase text-outline">Common name (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2.5 focus:ring-2 focus:ring-secondary/30 outline-none"
                value={capture.draft.commonName ?? ''}
                onChange={(e) => capture.updateDraft({ commonName: e.target.value })}
              />
            </label>
            <p className="text-body-sm text-on-surface-variant">
              Tree identification confidence (preview):{' '}
              <strong className="text-primary">{capture.identificationConfidence}%</strong>
            </p>
            <button
              type="button"
              disabled={!capture.draft.species.trim()}
              onClick={() => {
                capture.updateDraft({ identificationConfidence: capture.identificationConfidence })
                capture.goNext()
              }}
              className="w-full bg-primary disabled:opacity-40 text-on-primary py-3 rounded-lg font-label-md cursor-pointer hover:bg-secondary transition-colors"
            >
              Review Information
            </button>
          </div>
        )}

        {capture.step === 'review' && (
          <TreeVerification
            draft={{
              ...capture.draft,
              identificationConfidence: capture.identificationConfidence,
            }}
            identificationConfidence={capture.identificationConfidence}
            onConfirm={() => void register()}
            submitting={submitting}
          />
        )}

        {capture.step === 'success' && (
          <div className="bg-secondary-container/40 rounded-xl p-8 text-center border border-secondary/30">
            <span className="material-symbols-outlined text-[48px] text-secondary">check_circle</span>
            <h2 className="font-headline-md text-primary mt-4">Tree Registered</h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              {capture.draft.treeIdPreview} has been submitted for backend verification.
            </p>
            <Link to="/trees" className="inline-block mt-6 text-secondary font-label-md font-semibold hover:underline">
              View registry →
            </Link>
          </div>
        )}

        {registerError && (
          <p className="mt-4 text-error font-label-md">{registerError}</p>
        )}

        {capture.step !== 'intro' && capture.step !== 'success' && (
          <button type="button" onClick={capture.goBack} className="mt-6 text-label-md text-on-surface-variant underline cursor-pointer">
            Back
          </button>
        )}
      </main>
      <AppFooter />
    </div>
  )
}
