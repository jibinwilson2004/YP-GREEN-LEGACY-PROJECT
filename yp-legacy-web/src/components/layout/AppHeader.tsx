import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { IMAGES, SITE_NAME } from '../../constants/assets'
import { authService } from '../../services/authService'

// ── Partner Modal ────────────────────────────────────────────────────────────
function PartnerModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    orgName: '', contactName: '', email: '', phone: '', orgType: 'NGO / Non-Profit', message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.orgName.trim() || !form.email.trim()) return
    setStatus('sending')
    setErrMsg('')

    // Save submission locally as backup
    try {
      const existing = JSON.parse(localStorage.getItem('partner_requests') ?? '[]')
      existing.push({ ...form, submittedAt: new Date().toISOString() })
      localStorage.setItem('partner_requests', JSON.stringify(existing))
    } catch { /* ignore */ }

    try {
      let res: Response
      try {
        res = await fetch('/api/send-partner-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } catch {
        res = await fetch('http://127.0.0.1:5001/api/send-partner-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrMsg(data.message || 'Failed to send partner request via SMTP.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error'
      setStatus('error')
      setErrMsg(`Failed to connect to SMTP service: ${message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004d36] to-[#0a2118] text-white px-7 py-6 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-[#a2f0cc]">handshake</span>
            </div>
            <div>
              <h2 className="font-bold text-xl leading-tight">Become a Partner</h2>
              <p className="text-[#a2f0cc] text-xs mt-0.5">IEEE YP Green Legacy Project</p>
            </div>
          </div>
        </div>

        {status === 'success' ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[56px] text-emerald-500">check_circle</span>
            <h3 className="font-bold text-xl text-gray-900 mt-3">Request Sent!</h3>
            <p className="text-gray-500 text-sm mt-2">Your partnership enquiry has been sent to the IEEE YP Green Legacy Project team. We'll get back to you shortly.</p>
            <button type="button" onClick={onClose} className="mt-6 px-8 py-2.5 rounded-lg bg-[#004d36] text-white font-semibold text-sm hover:bg-[#003326] transition-colors cursor-pointer">Close</button>
          </div>
        ) : (
          <form className="px-7 py-6 space-y-4" onSubmit={(e) => void handleSubmit(e)} autoComplete="on">
            {errMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{errMsg}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Organisation Name *</span>
                <input required autoComplete="on" value={form.orgName} onChange={set('orgName')} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Organisation Type</span>
                <select value={form.orgType} onChange={set('orgType')} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all">
                  {['NGO / Non-Profit', 'Corporate / CSR', 'Academic Institution', 'Government Body', 'Research Organisation', 'IEEE Chapter / Section', 'Other'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Person</span>
              <input autoComplete="on" value={form.contactName} onChange={set('contactName')} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email Address *</span>
                <input required type="email" autoComplete="on" value={form.email} onChange={set('email')} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Phone / WhatsApp</span>
                <input type="tel" autoComplete="on" value={form.phone} onChange={set('phone')} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Message (optional)</span>
              <textarea value={form.message} onChange={set('message')} rows={3} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none transition-all" />
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex-1 py-3 rounded-xl bg-[#004d36] hover:bg-[#003326] disabled:opacity-60 text-white font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Sending…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">send</span>Submit Request</>
                )}
              </button>
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── AppHeader ────────────────────────────────────────────────────────────────
export function AppHeader({ mapActive }: { mapActive?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [partnerOpen, setPartnerOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('tree_tag_logged_in') === 'true')
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('U')

  useEffect(() => {
    const handleAuthChange = () => {
      const logged = localStorage.getItem('tree_tag_logged_in') === 'true'
      setIsLoggedIn(logged)
      if (logged) {
        const auth = authService.getCurrentUser()
        // If admin, show "Admin"
        if (auth?.role === 'admin') {
          setUserName('Admin')
          setUserInitial('A')
          return
        }
        // Try to get full name from signup profile
        try {
          const raw = localStorage.getItem('tree_tag_user')
          if (raw) {
            const p = JSON.parse(raw) as { fullName?: string }
            if (p.fullName) {
              setUserName(p.fullName.split(' ')[0]) // first name only
              setUserInitial(p.fullName[0]?.toUpperCase() ?? 'U')
              return
            }
          }
        } catch { /* ignore */ }
        // Fallback: derive from email
        const email = auth?.email ?? ''
        const name = email.split('@')[0]
        setUserName(name)
        setUserInitial(name[0]?.toUpperCase() ?? 'U')
      } else {
        setUserName('')
        setUserInitial('U')
      }
    }
    handleAuthChange()
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  const handleLogout = () => {
    authService.logout()
    setIsLoggedIn(false)
  }

  const profileLink = authService.getCurrentUser()?.role === 'admin' ? '/admin' : '/profile'

  const orangeNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-semibold text-sm transition-all px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
      isActive ? 'bg-black/20 text-white font-bold shadow-xs' : 'text-white/95 hover:text-white hover:bg-white/10'
    }`

  return (
    <>
      {partnerOpen && <PartnerModal onClose={() => setPartnerOpen(false)} />}

      <header className="w-full z-50 sticky top-0 shadow-md font-sans select-none">
        {/* 1. IEEE TOP BAR */}
        <div className="w-full bg-[#1f5d82] text-white border-b border-white/10 text-[12px] sm:text-[13px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-9 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap opacity-90 text-[12px] font-normal">
              <a className="text-white hover:underline transition-colors" href="https://www.ieee.org" target="_blank" rel="noreferrer">IEEE.org</a>
              <span className="opacity-40 select-none">|</span>
              <a className="text-white hover:underline transition-colors" href="https://ieeexplore.ieee.org" target="_blank" rel="noreferrer">IEEE <em>Xplore</em></a>
              <span className="opacity-40 select-none hidden sm:inline">|</span>
              <a className="text-white hover:underline transition-colors hidden sm:inline" href="https://standards.ieee.org" target="_blank" rel="noreferrer">IEEE Standards</a>
              <span className="opacity-40 select-none hidden md:inline">|</span>
              <a className="text-white hover:underline transition-colors hidden md:inline" href="https://spectrum.ieee.org" target="_blank" rel="noreferrer">IEEE Spectrum</a>
              <span className="opacity-40 select-none hidden lg:inline">|</span>
              <a className="text-white hover:underline transition-colors hidden lg:inline" href="https://www.ieee.org/sitemap.html" target="_blank" rel="noreferrer">More Sites</a>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-[12px]">
              <div className="hidden sm:flex items-center gap-3 text-white/80">
                <a aria-label="Facebook" className="hover:text-white transition-colors" href="https://www.facebook.com/IEEE.org/" target="_blank" rel="noreferrer">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a aria-label="Twitter / X" className="hover:text-white transition-colors" href="https://twitter.com/IEEEorg" target="_blank" rel="noreferrer">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a aria-label="LinkedIn" className="hover:text-white transition-colors" href="https://www.linkedin.com/company/ieee" target="_blank" rel="noreferrer">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
              <span className="opacity-40 select-none hidden sm:inline">|</span>
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link className="font-semibold text-white hover:underline flex items-center gap-1" to={profileLink}>
                    <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    <span>{userName}</span>
                  </Link>
                  <button type="button" onClick={handleLogout} className="text-[11px] text-red-200 hover:text-white hover:underline cursor-pointer">Logout</button>
                </div>
              ) : (
                <Link className="font-semibold text-white hover:underline flex items-center gap-1" to="/login">
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. CO-BRANDING BAR */}
        <div className="w-full bg-white py-2.5 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img alt="IEEE Young Professionals CSTF" className="h-8 sm:h-10 md:h-11 object-contain" src={IMAGES.ieeeYp} />
            </Link>
            <img alt="Official IEEE Diamond Logo" className="h-8 sm:h-10 md:h-11 object-contain" src={IMAGES.ieeeDiamond} />
          </div>
        </div>

        {/* 3. MAIN NAVIGATION BAR */}
        <nav className="w-full bg-[#f47716] text-white shadow-md py-2 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Brand */}
            <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-lg bg-[#002218] flex items-center justify-center text-[#a2f0cc] shadow-xs group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">eco</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base tracking-tight text-white">{SITE_NAME}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/90 font-semibold mt-0.5">Biometric Forest Registry</span>
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink to="/" className={orangeNavLinkClass} end>Home</NavLink>
              <NavLink to="/map" className={orangeNavLinkClass}>Live Map</NavLink>
              <NavLink to="/contest" className={orangeNavLinkClass}>Contest</NavLink>
              <NavLink to="/capture" className={orangeNavLinkClass}>Capture Tree</NavLink>

              {/* Become a Partner */}
              <button
                type="button"
                onClick={() => setPartnerOpen(true)}
                className="font-semibold text-sm bg-white text-[#004d36] hover:bg-white/90 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">handshake</span>
                Become a Partner
              </button>

              <div className="h-5 w-px bg-white/30 mx-1" />

              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link to={profileLink} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/35 text-white text-xs font-bold transition-colors">
                    <div className="w-5 h-5 rounded-full bg-white text-[#002218] flex items-center justify-center text-[10px] font-bold">{userInitial}</div>
                    <span>{userName}</span>
                  </Link>
                  <button type="button" onClick={handleLogout} className="px-2.5 py-1.5 rounded-lg bg-black/15 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/30 transition-colors shadow-xs">Sign In</Link>
              )}
            </div>

            {/* Mobile Toggle */}
            <button type="button" className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-black/20 text-white hover:bg-black/30" aria-label="Toggle Navigation" onClick={() => setMobileOpen((v) => !v)}>
              <span className="material-symbols-outlined text-[24px]">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-white/20 space-y-1 pb-2">
              {[
                { to: '/', label: 'Home', end: true },
                { to: '/map', label: 'Live Map' },
                { to: '/contest', label: 'Contest' },
                { to: '/capture', label: 'Capture Tree' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="block px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/15" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={() => { setPartnerOpen(true); setMobileOpen(false) }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">handshake</span>
                Become a Partner
              </button>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                {isLoggedIn ? (
                  <>
                    <Link to={profileLink} className="text-xs font-bold text-white flex items-center gap-1.5" onClick={() => setMobileOpen(false)}>
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                      <span>{userName}</span>
                    </Link>
                    <button type="button" onClick={() => { handleLogout(); setMobileOpen(false) }} className="text-xs text-red-200 font-bold hover:underline">Logout</button>
                  </>
                ) : (
                  <Link to="/login" className="px-4 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold" onClick={() => setMobileOpen(false)}>Sign In</Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {mapActive && <span className="sr-only">Map active</span>}
      </header>
    </>
  )
}
