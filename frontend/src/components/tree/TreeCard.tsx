import { Link } from 'react-router-dom'
import type { Tree } from '../../types/tree'
import { IMAGES } from '../../constants/assets'
import { getTreeTagStatus } from '../../utils/treeStatus'

export function TreeCard({ tree }: { tree: Tree }) {
  const tagInfo = getTreeTagStatus(tree.verificationStatus)

  return (
    <Link
      to={`/trees/${tree.id}`}
      className="block bg-gradient-to-b from-white to-[#f8fbf8] rounded-xl p-4 sm:p-5 shadow-xs border border-outline-variant/40 hover:border-secondary hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex gap-3.5 items-start">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30 shadow-2xs relative">
          <img
            src={tree.imageUrl || IMAGES.treeSapling}
            alt={tree.species}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <span className="font-mono text-xs text-secondary font-bold tracking-tight truncate">#{tree.id}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 flex-shrink-0 ${tagInfo.badgeClass}`}
            >
              {tagInfo.isTagged && <span>✓</span>}
              <span>{tagInfo.shortLabel}</span>
            </span>
          </div>
          <h3 className="font-headline-sm text-base font-bold text-primary truncate mt-0.5 group-hover:text-secondary transition-colors">
            {tree.species}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant text-[11px] font-mono">
            <span>{tree.latitude.toFixed(4)}°, {tree.longitude.toFixed(4)}°</span>
            {tree.country && (
              <>
                <span className="text-outline/60">•</span>
                <span className="text-secondary font-medium font-sans flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">public</span>
                  <span className="capitalize">{tree.country}</span>
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-surface-variant text-[11px]">
            <span className="text-secondary font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">verified_user</span>
              <span>Conf: {tree.locationConfidence}%</span>
            </span>
            <span className="text-outline/60">•</span>
            <span className="text-on-surface-variant">Stability: {tree.stabilityScore}%</span>
            <span className="text-outline/60">•</span>
            <span className="text-on-surface-variant">±{tree.accuracy.toFixed(1)}m</span>
          </div>
          {tree.verificationStatus === 'REJECTED' && (
            <div className="mt-1.5 pt-1.5 border-t border-red-100 text-[10px] text-red-700 font-medium truncate flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">cancel</span>
              <span>Rejected{tree.adminNote ? `: ${tree.adminNote}` : ' by admin'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
