import { Link } from 'react-router-dom'
import type { Tree } from '../../types/tree'
import { IMAGES } from '../../constants/assets'

export function TreeCard({ tree }: { tree: Tree }) {
  return (
    <Link
      to={`/trees/${tree.id}`}
      className="block bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/50 hover:border-secondary hover:shadow-md transition-all group"
    >
      <div className="flex gap-4 items-start">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30">
          <img
            src={tree.imageUrl || IMAGES.treeSapling}
            alt={tree.species}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-secondary font-bold">#{tree.id}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold uppercase">
              {tree.verificationStatus}
            </span>
          </div>
          <h3 className="font-headline-sm text-base font-bold text-primary truncate mt-0.5">{tree.species}</h3>
          <p className="font-mono text-[11px] text-on-surface-variant mt-1">
            {tree.latitude.toFixed(4)}°, {tree.longitude.toFixed(4)}° (±{tree.accuracy}m)
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-surface-variant text-[11px]">
            <span className="text-secondary font-medium">📍 Conf: {tree.locationConfidence}%</span>
            <span className="text-outline">•</span>
            <span className="text-on-surface-variant">Stability: {tree.stabilityScore}%</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

