import { VerificationStatus } from './VerificationStatus'
import { formatDisplayName } from '../../services/authService'
import type { Tree } from '../../types/tree'

interface TreeInformationProps {
  tree: Tree
}

export function TreeInformation({ tree }: TreeInformationProps) {
  const commonName = tree.commonName || 'Neem'
  // Corrected botanical name from "Azardica indica" to "Azadirachta indica"
  const botanicalName = tree.botanicalName || (tree.species === 'Azardica indica' ? 'Azadirachta indica' : tree.species) || 'Azadirachta indica'
  const dateOfPlanting = tree.dateOfPlanting || '31-08-2026'
  const updatedAt = tree.updatedAt || '31-08-2026'
  const student = tree.student || (tree.userId ? formatDisplayName(tree.userId) : 'IEEE YP CSTF Planter')
  const college = tree.college || 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV'
  const cluster = tree.cluster || 'TRV'
  const institution = tree.institution || 'APJAKTU NSSCELL NRPF'


  return (
    <div className="space-y-3.5">
      {/* 1. Tree Name with Verified Icon & Botanical Name in Italics */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-headline-sm text-xl sm:text-2xl font-bold text-primary tracking-tight">
            {commonName}
          </h2>
          <VerificationStatus status={tree.verificationStatus} />
        </div>
        <p className="text-sm italic font-medium text-secondary mt-0.5">
          {botanicalName}
        </p>
      </div>

      {/* 2. Planting Dates Strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-medium pt-1 pb-2 border-b border-outline-variant/30">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-outline">calendar_today</span>
          <span>Date of Planting:</span>
          <span className="font-semibold text-primary font-mono">{dateOfPlanting}</span>
        </div>
        <span className="text-outline/40 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-outline">update</span>
          <span>Updated:</span>
          <span className="font-semibold text-primary font-mono">{updatedAt}</span>
        </div>
      </div>

      {/* 3. Student, College, Cluster, Institution Details */}
      <div className="space-y-2 text-xs text-on-surface-variant pt-1">
        <div className="flex items-start justify-between gap-3">
          <span className="text-outline uppercase text-[11px] font-semibold tracking-wider flex-shrink-0">
            Student:
          </span>
          <span className="font-bold text-primary text-right break-words">
            {student}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="text-outline uppercase text-[11px] font-semibold tracking-wider flex-shrink-0">
            College:
          </span>
          <span className="font-medium text-on-surface text-right break-words max-w-[260px] sm:max-w-xs leading-snug">
            {college}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-outline uppercase text-[11px] font-semibold tracking-wider">
            Cluster:
          </span>
          <span className="font-semibold text-primary font-mono bg-surface-container-low px-2 py-0.5 rounded">
            {cluster}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="text-outline uppercase text-[11px] font-semibold tracking-wider flex-shrink-0">
            Institution:
          </span>
          <span className="font-medium text-on-surface text-right break-words max-w-[240px] sm:max-w-xs leading-snug">
            {institution}
          </span>
        </div>
      </div>
    </div>
  )
}
