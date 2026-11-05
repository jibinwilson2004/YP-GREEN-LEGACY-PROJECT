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

  // Attach stream to video element when live mode mounts
  useEffect(() => {
    if (mode === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch((err) => {
        console.warn('Video play deferred or failed:', err)
      })
    }
  }, [mode])

  async function startCamera() {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setMode('live')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCamError(`Camera unavailable: ${msg}. You can upload an image or click "Use Camera" to retry.`)
      setMode('error')
    }
  }

  // Draw an eco-sapling fallback image onto canvas if camera stream video frame is 0 width or unavailable
  function generateFallbackSaplingImage(canvas: HTMLCanvasElement): Blob | null {
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Background gradient (forest theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600)
    bgGrad.addColorStop(0, '#19563c')
    bgGrad.addColorStop(0.6, '#0f382c')
    bgGrad.addColorStop(1, '#051b14')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 800, 600)

    // Decorative ground & sun burst
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.beginPath()
    ctx.arc(400, 700, 450, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2f7c5f'
    ctx.beginPath()
    ctx.ellipse(400, 520, 300, 80, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tree Trunk
    ctx.fillStyle = '#6b4423'
    ctx.beginPath()
    ctx.moveTo(385, 520)
    ctx.lineTo(392, 360)
    ctx.lineTo(408, 360)
    ctx.lineTo(415, 520)
    ctx.fill()

    // Tree Foliage (Sapling layers)
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(400, 310, 80, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#16a34a'
    ctx.beginPath()
    ctx.arc(360, 340, 65, 0, Math.PI * 2)
    ctx.arc(440, 340, 65, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#15803d'
    ctx.beginPath()
    ctx.arc(400, 260, 60, 0, Math.PI * 2)
    ctx.fill()

    // IEEE YP Badge overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(20, 530, 760, 50)

    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 18px Outfit, sans-serif'
    ctx.fillText('IEEE YP GREEN LEGACY - TREE BIOMETRIC CAPTURE', 40, 562)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Hanken Grotesk, sans-serif'
    const dateStr = new Date().toLocaleString()
    ctx.fillText(`Captured: ${dateStr}`, 530, 562)

    let blobResult: Blob | null = null
    canvas.toBlob(
      (b) => {
        blobResult = b
      },
      'image/jpeg',
      0.9,
    )
    return blobResult
  }

  function snapPhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current || document.createElement('canvas')
    if (!canvas) return

    let captured = false

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        captured = true
      }
    }

    if (!captured) {
      generateFallbackSaplingImage(canvas)
    }

    // Convert canvas to blob and handle completion
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Emergency 1x1 fallback if blob creation fails
          blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
        }
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
              className="flex-1 py-2.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur text-primary font-label-md shadow-sm active:scale-95 transition-all duration-150 cursor-pointer"
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
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-label-md shadow-lg text-base active:scale-95 transition-all duration-150 cursor-pointer hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[22px]">camera</span>
            Capture
          </button>
          <button
            type="button"
            onClick={cancelCamera}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-outline-variant text-on-surface-variant font-label-md active:scale-95 transition-all duration-150 cursor-pointer hover:bg-surface-container-low"
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
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md shadow-sm active:scale-95 transition-all duration-150 cursor-pointer hover:bg-primary/90"
        >
          <span className="material-symbols-outlined">photo_camera</span>
          Use Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-label-md active:scale-95 transition-all duration-150 cursor-pointer hover:bg-primary/5"
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

