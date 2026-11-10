export interface TreeTagStatusInfo {
  isTagged: boolean
  label: string
  shortLabel: string
  badgeClass: string
  iconName: string
  tooltip: string
}

/**
 * Ensures ONLY trees that are verified are labelled as 'Tagged'.
 * Pending, rejected, or unverified trees are explicitly labelled as 'Pending Verification' or 'Rejected'.
 */
export function getTreeTagStatus(status?: string | null): TreeTagStatusInfo {
  const normalized = (status || '').toUpperCase()

  if (normalized === 'VERIFIED') {
    return {
      isTagged: true,
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
      label: 'Rejected',
      shortLabel: 'Rejected',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      iconName: 'cancel',
      tooltip: 'Verification Rejected (Not Tagged)',
    }
  }

  if (normalized === 'FLAGGED') {
    return {
      isTagged: false,
      label: 'Flagged for Audit',
      shortLabel: 'Flagged',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      iconName: 'flag',
      tooltip: 'Flagged for Audit (Not Tagged)',
    }
  }

  return {
    isTagged: false,
    label: 'Pending Verification',
    shortLabel: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'schedule',
    tooltip: 'Pending Administrative Verification (Not Tagged)',
  }
}
