import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { treeService } from '../services/treeService'
import { authService } from '../services/authService'

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
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [socialLink, setSocialLink] = useState('N.A')
  const [isPublic, setIsPublic] = useState(true)

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

  // Load signup profile data if available
  const storedProfile: UserProfile = (() => {
    try {
      const raw = localStorage.getItem('tree_tag_user')
      return raw ? (JSON.parse(raw) as UserProfile) : {}
    } catch {
      return {}
    }
  })()

  // Determine display values — signup data takes priority, then auth email
  const displayName =
    storedProfile.fullName ||
    authUser?.displayName ||
    authUser?.email?.split('@')[0] ||
    'User'

  const displayEmail = storedProfile.email || authUser?.email || ''
  const displayInstitution = storedProfile.institution || '—'
  const userId = authUser?.email ?? ''

  const myTrees = userId ? treeService.getByUser(userId) : []
  const verifiedCount = myTrees.filter((t) => t.verificationStatus === 'VERIFIED').length
  const pendingCount = myTrees.filter((t) => t.verificationStatus === 'PENDING').length
  const primaryTree = myTrees[0]

  const handleEditSocial = () => {
    const url = prompt('Enter your LinkedIn or Twitter URL:', socialLink === 'N.A' ? '' : socialLink)
    if (url) setSocialLink(url)
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
        <div className="bg-white rounded-lg p-6 sm:p-10 shadow-sm border border-gray-200 min-h-[540px] flex flex-col justify-between">
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

            <hr className="border-t border-gray-200 mt-4 mb-8" />

            {/* Profile Section */}
            <section aria-labelledby="profile-heading" className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 underline decoration-2 underline-offset-4 tracking-tight" id="profile-heading">Profile</h2>

              <div className="flex items-center space-x-2 text-sm text-gray-800">
                <span>Social Media Profile:</span>
                <span className="font-normal text-gray-700">{socialLink}</span>
                <button type="button" aria-label="Edit Social Media Link" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={handleEditSocial}>
                  <svg className="w-4 h-4 ml-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center space-x-3 pt-1">
                <span className="text-sm text-gray-800 font-medium">Profile visible to public</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" id="visibilityToggle" type="checkbox" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]" />
                </label>
              </div>

              {displayInstitution !== '—' && (
                <div className="text-sm text-gray-800 pt-1">
                  <span>Institution: </span>
                  <span className="font-bold text-gray-900">{displayInstitution}</span>
                </div>
              )}

              {storedProfile.isIeeeMember && storedProfile.ieeeId && (
                <div className="text-sm text-gray-800">
                  <span>IEEE Member ID: </span>
                  <span className="font-bold text-gray-900 font-mono">{storedProfile.ieeeId}</span>
                </div>
              )}

              {storedProfile.region && (
                <div className="text-sm text-gray-800">
                  <span>IEEE Region / Section: </span>
                  <span className="font-bold text-gray-900">{storedProfile.region}{storedProfile.section ? ` — ${storedProfile.section}` : ''}</span>
                </div>
              )}

              {storedProfile.country && (
                <div className="text-sm text-gray-800">
                  <span>Country: </span>
                  <span className="font-bold text-gray-900">{storedProfile.country}</span>
                </div>
              )}
            </section>

            {/* Summary Section */}
            <section aria-labelledby="summary-heading" className="mt-8 space-y-3">
              <h2 className="text-base font-bold text-gray-900 underline decoration-2 underline-offset-4 tracking-tight" id="summary-heading">Summary</h2>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-800">
                <div>
                  <span>Trees Registered: </span>
                  <span className="font-bold text-primary font-mono text-base">{myTrees.length}</span>
                </div>
                <div>
                  <span>Verified: </span>
                  <span className="font-bold text-emerald-700 font-mono text-base">{verifiedCount}</span>
                </div>
                {pendingCount > 0 && (
                  <div>
                    <span>Pending: </span>
                    <span className="font-bold text-amber-600 font-mono text-base">{pendingCount}</span>
                  </div>
                )}
              </div>

              {/* Primary Tree Card */}
              {primaryTree ? (
                <Link
                  to={`/trees/${primaryTree.id}`}
                  className="group block p-4 rounded-xl border border-secondary/40 bg-secondary-container/20 hover:bg-secondary-container/40 transition-all shadow-xs"
                  title="View your latest registered tree"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">forest</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-primary text-sm">#{primaryTree.id} • {primaryTree.species}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            primaryTree.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : primaryTree.verificationStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {primaryTree.verificationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Lat: {primaryTree.latitude.toFixed(5)}° N, Lon: {primaryTree.longitude.toFixed(5)}° E • ±{primaryTree.accuracy?.toFixed(1)} m
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-secondary font-bold text-xs group-hover:translate-x-1 transition-transform">
                      <span>View</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm text-on-surface-variant text-center">
                  <span className="material-symbols-outlined text-[28px] text-outline block mb-1">park</span>
                  No trees registered yet.{' '}
                  <Link to="/capture" className="text-secondary font-semibold hover:underline">Capture your first tree →</Link>
                </div>
              )}

              {/* All trees link */}
              {myTrees.length > 1 && (
                <Link to="/trees" className="text-sm text-secondary font-semibold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">list</span>
                  View all {myTrees.length} registered trees
                </Link>
              )}
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
