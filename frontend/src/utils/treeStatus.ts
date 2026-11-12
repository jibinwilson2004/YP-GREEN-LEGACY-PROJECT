export interface TreeTagStatusInfo {
  isTagged: boolean
  isRejected: boolean
  isPending: boolean
  label: string
  shortLabel: string
  badgeClass: string
  iconName: string
  tooltip: string
}

/**
 * Ensures ONLY trees that are verified are labeled as 'Tagged'.
 * If a tree is rejected, it is prominently marked as 'Rejected'.
 * Pending trees are explicitly labeled as 'Pending Verification'.
 */
export function getTreeTagStatus(status?: string | null): TreeTagStatusInfo {
  const normalized = (status || '').toUpperCase()

  if (normalized === 'VERIFIED') {
    return {
      isTagged: true,
      isRejected: false,
      isPending: false,
      label: 'Tagged (Verified)',
      shortLabel: 'Tagged',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconName: 'verified',
      tooltip: 'Tree Record Verified & Officially Tagged',
    }
  }

  if (normalized === 'REJECTED') {
    return {
      isTagged: false,
      isRejected: true,
      isPending: false,
      label: 'Rejected',
      shortLabel: 'Rejected',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      iconName: 'cancel',
      tooltip: 'Tree Verification Rejected by Administrator',
    }
  }

  if (normalized === 'FLAGGED') {
    return {
      isTagged: false,
      isRejected: false,
      isPending: false,
      label: 'Flagged for Audit',
      shortLabel: 'Flagged',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      iconName: 'flag',
      tooltip: 'Flagged for Audit (Not Tagged)',
    }
  }

  return {
    isTagged: false,
    isRejected: false,
    isPending: true,
    label: 'Pending Verification',
    shortLabel: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'schedule',
    tooltip: 'Pending Administrative Verification (Not Tagged)',
  }
}
