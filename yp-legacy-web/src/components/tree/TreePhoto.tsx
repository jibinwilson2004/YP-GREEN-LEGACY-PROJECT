import { useRef, useState, useCallback, useEffect } from 'react'

export function TreePhoto({
  previewUrl,
  onCapture,
  onClear,
}: {
  previewUrl?: string
  onCapture: (file: File) => void
  onClear: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [mode, setMode] = useState<'idle' | 'live' | 'error'>('idle')
  const [camError, setCamError] = useState<string | null>(null)

  // Clean up stream on unmount or when leaving live mode
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  async function startCamera() {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('live')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCamError(`Camera unavailable: ${msg}. Please upload an image instead.`)
      setMode('error')
    }
  }

  function snapPhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `tree-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        stopStream()
        setMode('idle')
      },
      'image/jpeg',
      0.88,
    )
  }

  function cancelCamera() {
    stopStream()
    setMode('idle')
    setCamError(null)
  }

  if (previewUrl) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/40">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Tree Photo Preview</h2>
        <div className="relative rounded-xl overflow-hidden aspect-square max-w-md mx-auto shadow-sm">
          <img src={previewUrl} alt="Tree preview" className="w-full h-full object-cover" />
          <div className="absolute bottom-3 inset-x-3 flex gap-2">
            <button
              type="button"
              onClick={onClear}
              className="flex-1 py-2.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur text-primary font-label-md shadow-sm"
            >
              Retake
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'live') {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/40">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Capture Tree Photo</h2>
        <div className="relative rounded-xl overflow-hidden aspect-video max-w-md mx-auto bg-black shadow-sm">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {/* Framing overlay */}
          <div className="absolute inset-0 border-2 border-white/30 rounded-xl pointer-events-none" />
        </div>
        <div className="flex gap-3 mt-4 justify-center">
          <button
            type="button"
            onClick={snapPhoto}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-label-md shadow-lg text-base"
          >
            <span className="material-symbols-outlined text-[22px]">camera</span>
            Capture
          </button>
          <button
            type="button"
            onClick={cancelCamera}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-outline-variant text-on-surface-variant font-label-md"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/40">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Capture Tree Photo</h2>

      {camError && (
        <div className="mb-4 p-3 rounded-lg bg-error-container/60 border border-error/30 text-error text-xs flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">warning</span>
          <span>{camError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => void startCamera()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md shadow-sm"
        >
          <span className="material-symbols-outlined">photo_camera</span>
          Use Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-label-md"
        >
          <span className="material-symbols-outlined">upload</span>
          Upload Image
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onCapture(f)
        }}
      />
      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
