import { useState } from 'react'

interface VerificationStatusProps {
  status: string
  showBadge?: boolean
  className?: string
}

export function VerificationStatus({
  status,
  showBadge = false,
  className = '',
}: VerificationStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isVerified = status.toUpperCase() === 'VERIFIED'

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip((v) => !v)}
    >
      {/* Icon Beside Tree Name */}
      <span
        className="inline-flex items-center justify-center text-secondary cursor-pointer"
        aria-label="Tree Record Verified"
      >
        <span className="material-symbols-outlined text-[20px] fill-current">
          verified
        </span>
      </span>

      {/* Optional Badge */}
      {showBadge && (
        <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-secondary-container text-on-secondary-container inline-flex items-center gap-1">
          <span>✓</span>
          <span>{isVerified ? 'Verified' : status}</span>
        </span>
      )}

      {/* Tooltip on Hover / Tap */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in">
          Tree Record Verified
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
