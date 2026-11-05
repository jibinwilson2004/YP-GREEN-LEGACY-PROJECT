import { useState } from 'react'

interface TreeImageGalleryProps {
  images: string[]
  speciesName: string
  onClose?: () => void
  roundedClass?: string
  heightClass?: string
  showBadge?: boolean
}

export function TreeImageGallery({
  images,
  speciesName,
  onClose,
  roundedClass = 'rounded-xl',
  heightClass = 'h-52 sm:h-60',
  showBadge = true,
}: TreeImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const validImages = images.length > 0 ? images : ['/assets/images/tree-sapling.png']

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <div
        className={`relative w-full ${heightClass} ${roundedClass} overflow-hidden bg-surface-container-high group select-none border border-outline-variant/40 shadow-xs cursor-pointer`}
        onClick={() => setIsExpanded(true)}
        title="Click to view full photo"
      >
        {/* Active Photo */}
        <img
          src={validImages[currentIndex]}
          alt={`${speciesName} photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Top Left Label: Supporting Evidence */}
        {showBadge && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-label-sm font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[12px]">photo_camera</span>
              <span>Tree Photograph • {currentIndex + 1} of {validImages.length}</span>
            </span>
          </div>
        )}

        {/* Top Right Close Button (if provided) */}
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
            title="Close Card"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}

        {/* Expand Indicator on Hover */}
        <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {!onClose && (
            <span className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[15px]">fullscreen</span>
            </span>
          )}
        </div>

        {/* Navigation Arrows (visible if multiple images) */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/45 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs shadow-md"
              title="Previous Image"
              aria-label="Previous Image"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/45 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs shadow-md"
              title="Next Image"
              aria-label="Next Image"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            {/* Image Dots Indicator */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-xs">
              {validImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(i)
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Expandable Full-Resolution Modal View */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm font-semibold cursor-pointer"
            >
              <span>Close</span>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={validImages[currentIndex]}
              alt={`${speciesName} photo`}
              className="w-auto h-auto max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 text-white text-xs font-medium text-center">
              {speciesName} — Photographic Verification Evidence ({currentIndex + 1} of {validImages.length})
            </div>
          </div>
        </div>
      )}
    </>
  )
}
