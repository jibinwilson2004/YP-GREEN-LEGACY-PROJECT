import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { authService, formatDisplayName } from '../services/authService'
import { fetchTrees } from '../services/api'
import { treeService } from '../services/treeService'
import { TreeCard } from '../components/tree/TreeCard'
import type { Tree } from '../types/tree'

interface UserProfile {
  fullName?: string
  email?: string
  institution?: string
  isIeeeMember?: boolean
  ieeeId?: string
  membershipGrade?: string
  region?: string
  section?: string
  country?: string
  registeredAt?: string
  socialLink?: string
  isPublic?: boolean
}

export function ProfilePage() {
  const navigate = useNavigate()

  // Read currently logged-in user from auth + signup data
  const authUser = authService.getCurrentUser()

  // If not logged in, send to login
  useEffect(() => {
    if (!authUser) navigate('/login')
  }, [authUser, navigate])

  // If admin, redirect to admin panel
  useEffect(() => {
    if (authUser?.role === 'admin') navigate('/admin')
  }, [authUser, navigate])

  const userId = authUser?.email ?? ''

  // Load signup profile data if available and matches current logged-in email
  const storedProfile: UserProfile = (() => {
    try {
      if (!userId) return {}
      const raw = localStorage.getItem(`tree_tag_user_${userId}`) || localStorage.getItem('tree_tag_user')
      if (!raw) return {}
      const parsed = JSON.parse(raw) as UserProfile
      if (parsed.email && parsed.email.toLowerCase() !== userId.toLowerCase()) {
        return {}
      }
      return parsed
    } catch {
      return {}
    }
  })()

  // Persistent social link & public visibility state
  const [socialLink, setSocialLink] = useState<string>(() => {
    if (!userId) return 'N.A'
    return localStorage.getItem(`tree_tag_social_${userId}`) || storedProfile.socialLink || 'N.A'
  })

  const [isPublic, setIsPublic] = useState<boolean>(() => {
    if (!userId) return true
    const saved = localStorage.getItem(`tree_tag_public_${userId}`)
    if (saved !== null) return saved === 'true'
    return storedProfile.isPublic !== undefined ? storedProfile.isPublic : true
  })

  // LinkedIn editing Card state
  const [isEditingSocial, setIsEditingSocial] = useState(false)
  const [socialInput, setSocialInput] = useState('')
  const [socialError, setSocialError] = useState<string | null>(null)

  // My trees state with loading indicator
  const [myTrees, setMyTrees] = useState<Tree[]>([])
  const [loading, setLoading] = useState(true)

  // Determine display values
  const displayName = authUser?.email
    ? authService.getCurrentUser()?.displayName || formatDisplayName(authUser.email, storedProfile.fullName)
    : storedProfile.fullName || 'User'

  const displayEmail = storedProfile.email || authUser?.email || ''
  const displayInstitution = storedProfile.institution || '—'

  // Fetch trees for current user
  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)

    void fetchTrees({ limit: 200, userId })
      .then((response) => {
        if (!active) return
        if (response.trees && response.trees.length > 0) {
          setMyTrees(response.trees)
        } else {
          // Check local store fallback for client-side registrations
          const local = treeService.getByUser(userId)
          setMyTrees(local)
        }
      })
      .catch((error) => {
        console.warn('[Profile trees API unavailable; fallback to local store]', error)
        if (!active) return
        const local = treeService.getByUser(userId)
        setMyTrees(local)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [userId])

  // Sync when trees are added, deleted, or verified
  useEffect(() => {
    const handleTreesUpdated = () => {
      if (!userId) return
      void fetchTrees({ limit: 200, userId })
        .then((res) => {
          if (res.trees.length > 0) setMyTrees(res.trees)
          else setMyTrees(treeService.getByUser(userId))
        })
        .catch(() => setMyTrees(treeService.getByUser(userId)))
    }
    window.addEventListener('trees-updated', handleTreesUpdated)
    return () => window.removeEventListener('trees-updated', handleTreesUpdated)
  }, [userId])

  const verifiedCount = myTrees.filter((t) => t.verificationStatus === 'VERIFIED').length
  const pendingCount = myTrees.filter((t) => t.verificationStatus === 'PENDING').length
  const rejectedCount = myTrees.filter((t) => t.verificationStatus === 'REJECTED').length

  const handleOpenEditSocial = () => {
    setSocialInput(socialLink === 'N.A' ? '' : socialLink)
    setSocialError(null)
    setIsEditingSocial(true)
  }

  const handleSaveSocial = () => {
    const trimmed = socialInput.trim()
    if (!trimmed) {
      handleRemoveSocial()
      return
    }

    // Ensure valid URL format
    let finalUrl = trimmed
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    setSocialLink(finalUrl)
    localStorage.setItem(`tree_tag_social_${userId}`, finalUrl)
    try {
      const raw = localStorage.getItem(`tree_tag_user_${userId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile
        localStorage.setItem(`tree_tag_user_${userId}`, JSON.stringify({ ...parsed, socialLink: finalUrl }))
      }
    } catch {
      // ignore
    }
    setIsEditingSocial(false)
  }

  const handleRemoveSocial = () => {
    setSocialLink('N.A')
    localStorage.setItem(`tree_tag_social_${userId}`, 'N.A')
    try {
      const raw = localStorage.getItem(`tree_tag_user_${userId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile
        localStorage.setItem(`tree_tag_user_${userId}`, JSON.stringify({ ...parsed, socialLink: 'N.A' }))
      }
    } catch {
      // ignore
    }
    setIsEditingSocial(false)
  }

  const handleToggleVisibility = (checked: boolean) => {
    setIsPublic(checked)
    localStorage.setItem(`tree_tag_public_${userId}`, String(checked))
    try {
      const raw = localStorage.getItem(`tree_tag_user_${userId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile
        localStorage.setItem(`tree_tag_user_${userId}`, JSON.stringify({ ...parsed, isPublic: checked }))
      }
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  // Avatar initial letter
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col justify-between">
      <AppHeader />

      {/* Main Profile Card */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-200/80 min-h-[540px] flex flex-col justify-between">
          <div>
            {/* Profile Top Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 pb-2">
              {/* Avatar with initial */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#104252] rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="text-5xl font-extrabold text-white select-none">{initial}</span>
                </div>
                <button
                  type="button"
                  aria-label="Edit Profile Picture"
                  className="absolute -bottom-1 -right-1 bg-transparent text-white rounded p-1 transition cursor-pointer"
                  onClick={() => alert('Profile photo upload coming soon.')}
                >
                  <svg className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </button>
              </div>

              {/* User Name and Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{displayName}</h1>
                    <p className="text-sm text-gray-700 font-medium mt-1 tracking-normal flex flex-wrap gap-x-2 items-center">
                      {storedProfile.membershipGrade ? (
                        <span className="uppercase text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{storedProfile.membershipGrade}</span>
                      ) : (
                        <span className="uppercase text-xs text-gray-500">Member</span>
                      )}
                      <span className="text-gray-400">|</span>
                      <a className="hover:underline text-gray-800" href={`mailto:${displayEmail}`}>{displayEmail}</a>
                    </p>
                  </div>
                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-t border-gray-200 mt-4 mb-6" />

            {/* Profile Section */}
            <section aria-labelledby="profile-heading" className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 underline decoration-2 underline-offset-4 tracking-tight" id="profile-heading">Profile</h2>

              {/* Social Media / LinkedIn Card or Display */}
              {!isEditingSocial ? (
                <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-800 bg-gray-50/70 p-3 rounded-xl border border-gray-200/60">
                  <div className="w-7 h-7 rounded-lg bg-[#0077b5] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  </div>
                  <span className="font-semibold text-gray-700">Social Media Profile:</span>
                  {socialLink !== 'N.A' && socialLink ? (
                    <a
                      href={socialLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1 text-sm break-all"
                      title={socialLink}
                    >
                      <span>{socialLink.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>
                  ) : (
                    <span className="font-medium text-gray-500">N.A</span>
                  )}
                  <button
                    type="button"
                    aria-label="Edit LinkedIn Profile Link"
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    onClick={handleOpenEditSocial}
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>{socialLink !== 'N.A' && socialLink ? 'Edit Link' : 'Add LinkedIn'}</span>
                  </button>
                </div>
              ) : (
                /* Dedicated LinkedIn Input Card (replaces browser prompt) */
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 shadow-md space-y-3.5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#0077b5] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">LinkedIn &amp; Professional Profile</h3>
                        <p className="text-xs text-gray-500">Attach your LinkedIn profile to showcase your contributions on your public registry badge.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingSocial(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                      aria-label="Close card"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="linkedin-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">link</span>
                      </span>
                      <input
                        id="linkedin-input"
                        type="url"
                        value={socialInput}
                        onChange={(e) => {
                          setSocialInput(e.target.value)
                          setSocialError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveSocial()
                          } else if (e.key === 'Escape') {
                            setIsEditingSocial(false)
                          }
                        }}
                        placeholder="https://www.linkedin.com/in/username"
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs font-sans"
                        autoFocus
                      />
                    </div>
                    {socialError && (
                      <p className="text-xs text-red-600 font-medium">{socialError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 justify-end">
                    {socialLink !== 'N.A' && (
                      <button
                        type="button"
                        onClick={handleRemoveSocial}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer mr-auto"
                      >
                        Remove Link
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingSocial(false)}
                      className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSocial}
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Save LinkedIn Profile</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-4 pt-1 bg-gray-50/70 p-3 rounded-xl border border-gray-200/60">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-800 font-semibold">Profile visible to public</span>
                  <span className="text-xs text-gray-500">Allow your verified tree counts and public badge to appear on the leaderboard</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                  <input
                    checked={isPublic}
                    onChange={(e) => handleToggleVisibility(e.target.checked)}
                    className="sr-only peer"
                    id="visibilityToggle"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]" />
                </label>
              </div>

              {displayInstitution !== '—' && (
                <div className="text-sm text-gray-800 pt-1">
                  <span className="text-gray-600">Institution: </span>
                  <span className="font-bold text-gray-900">{displayInstitution}</span>
                </div>
              )}

              {storedProfile.isIeeeMember && storedProfile.ieeeId && (
                <div className="text-sm text-gray-800">
                  <span className="text-gray-600">IEEE Member ID: </span>
                  <span className="font-bold text-gray-900 font-mono">{storedProfile.ieeeId}</span>
                </div>
              )}

              {storedProfile.region && (
                <div className="text-sm text-gray-800">
                  <span className="text-gray-600">IEEE Region / Section: </span>
                  <span className="font-bold text-gray-900">{storedProfile.region}{storedProfile.section ? ` — ${storedProfile.section}` : ''}</span>
                </div>
              )}

              {storedProfile.country && (
                <div className="text-sm text-gray-800">
                  <span className="text-gray-600">Country: </span>
                  <span className="font-bold text-gray-900">{storedProfile.country}</span>
                </div>
              )}
            </section>

            {/* Summary Section */}
            <section aria-labelledby="summary-heading" className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 underline decoration-2 underline-offset-4 tracking-tight" id="summary-heading">Summary</h2>
                {!loading && myTrees.length > 0 && (
                  <Link
                    to="/capture"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    <span>Tag Another Tree</span>
                  </Link>
                )}
              </div>

              {/* Stats row with natural badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
                  <span className="text-xs text-gray-500 font-medium block">Total Registered</span>
                  <span className="text-xl font-extrabold text-primary font-mono mt-0.5 block">{loading ? '…' : myTrees.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-medium block">Tagged (Verified)</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5 block">{loading ? '…' : verifiedCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs text-amber-800 font-medium block">Pending Verification</span>
                  <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{loading ? '…' : pendingCount}</span>
                </div>
                {rejectedCount > 0 && (
                  <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200">
                    <span className="text-xs text-red-800 font-medium block">Rejected</span>
                    <span className="text-xl font-extrabold text-red-600 font-mono mt-0.5 block">{loading ? '…' : rejectedCount}</span>
                  </div>
                )}
              </div>

              {/* Trees List */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">My Trees</h3>
                  {!loading && myTrees.length > 0 && (
                    <span className="text-xs text-gray-500 font-semibold font-mono">
                      {verifiedCount} Verified Tagged • {pendingCount} Pending
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="p-8 text-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2" />
                    <p className="font-medium">Loading your tree records…</p>
                  </div>
                ) : myTrees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myTrees.map((tree) => (
                      <TreeCard key={tree.id} tree={tree} />
                    ))}
                  </div>
                ) : (
                  /* ONLY ask to capture your first tree if no trees are registered */
                  <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 text-sm text-gray-600 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">park</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">No trees registered yet</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Begin your ecological contribution by logging your first sapling with GPS telemetry and field photography.
                      </p>
                    </div>
                    <Link
                      to="/capture"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-secondary text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                      <span>Capture your first tree</span>
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Bottom Tab Navigation */}
          <div className="pt-12 pb-2 flex justify-center border-t border-gray-100 mt-8">
            <div className="inline-flex items-center gap-4 sm:gap-6">
              <Link to="/profile" className="flex flex-col items-center justify-center px-4 py-2 bg-[#a7f3d0] text-emerald-900 rounded-xl shadow-xs font-semibold text-xs">
                <span className="material-symbols-outlined text-[22px]">person</span>
                <span className="mt-0.5">Profile</span>
              </Link>
              <Link to="/map" className="flex flex-col items-center justify-center px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-xs font-medium">
                <span className="material-symbols-outlined text-[22px] text-red-500">location_on</span>
                <span className="mt-0.5">Map</span>
              </Link>
              <Link to="/trees" className="flex flex-col items-center justify-center px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-xs font-medium">
                <span className="material-symbols-outlined text-[22px] text-emerald-600">forest</span>
                <span className="mt-0.5">My Trees</span>
              </Link>
              <Link to="/capture" className="flex flex-col items-center justify-center px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-xs font-medium">
                <span className="material-symbols-outlined text-[22px] text-primary">add_a_photo</span>
                <span className="mt-0.5">Capture</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <AppFooter dark />
    </div>
  )
}
