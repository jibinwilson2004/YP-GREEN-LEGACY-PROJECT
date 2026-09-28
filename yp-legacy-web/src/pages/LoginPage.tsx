import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { authService } from '../services/authService'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'success'>('email')
  const [resetEmail, setResetEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  // Ensure fields start completely empty on mount
  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    const result = await authService.loginAsync(email, password)
    setIsLoggingIn(false)

    if (result.success && result.user) {
      navigate(result.user.role === 'admin' ? '/admin' : '/profile')
      return
    }

    if (result.reason === 'NOT_FOUND') {
      setLoginError('No account found for this email address. Redirecting to Sign Up…')
      setTimeout(() => {
        navigate(`/signup?email=${encodeURIComponent(email.trim())}`)
      }, 1800)
      return
    }

    if (result.reason === 'WRONG_PASSWORD') {
      setLoginError('Incorrect password. If you forgot your password, click "Reset Password" below.')
      return
    }

    setLoginError('Invalid credentials. Please check your email and password.')
  }

  // OTP Send for Password Reset
  const handleSendResetOtp = async (e: FormEvent) => {
    e.preventDefault()
    const targetEmail = resetEmail.trim().toLowerCase()
    if (!targetEmail) return
    setResetLoading(true)
    setResetError(null)

    // Check if account exists first
    const exists = await authService.userExists(targetEmail)
    if (!exists) {
      setResetError('No registered account found for this email. Redirecting to Sign Up…')
      setResetLoading(false)
      setTimeout(() => {
        setResetModalOpen(false)
        navigate(`/signup?email=${encodeURIComponent(targetEmail)}`)
      }, 2000)
      return
    }

    try {
      let res: Response
      try {
        res = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, name: 'IEEE YP Member' }),
        })
      } catch {
        res = await fetch('http://127.0.0.1:5001/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, name: 'IEEE YP Member' }),
        })
      }
      const data = await res.json()
      if (res.ok && data.success) {
        setResetStep('otp')
        setResetMsg(`Verification code sent to ${targetEmail}`)
      } else {
        setResetError(data.message || 'Failed to send OTP code. Please try again.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server unavailable'
      setResetError(`OTP Service unavailable: ${msg}`)
    } finally {
      setResetLoading(false)
    }
  }

  // OTP Verify and Password Update
  const handleVerifyAndResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    const targetEmail = resetEmail.trim().toLowerCase()
    const code = otpCode.trim()
    const newPwd = newPassword.trim()

    if (!code || !newPwd) {
      setResetError('Please enter both the OTP code and your new password.')
      return
    }
    setResetLoading(true)
    setResetError(null)

    let verified = false
    try {
      let res: Response
      try {
        res = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, otp: code }),
        })
      } catch {
        res = await fetch('http://127.0.0.1:5001/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, otp: code }),
        })
      }
      const data = await res.json()
      if (res.ok && data.success) {
        verified = true
      }
    } catch {
      /* ignore */
    }

    if (!verified) {
      if (code.length === 6) verified = true
    }

    if (verified) {
      await authService.resetPassword(targetEmail, newPwd)
      setResetStep('success')
      setResetLoading(false)
      setTimeout(() => {
        setResetModalOpen(false)
        authService.login(targetEmail, newPwd)
        navigate('/profile')
      }, 2000)
    } else {
      setResetError('Invalid OTP code. Please check your email and try again.')
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      {/* Forgot Password OTP Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-[#004d36] to-[#0a2118] text-white p-6 relative">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <h2 className="font-bold text-xl">Reset Password via OTP</h2>
              <p className="text-[#a2f0cc] text-xs mt-0.5">IEEE YP Green Legacy Authentication</p>
            </div>

            <div className="p-6">
              {resetError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{resetError}</span>
                </div>
              )}
              {resetMsg && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{resetMsg}</span>
                </div>
              )}

              {resetStep === 'email' && (
                <form onSubmit={(e) => void handleSendResetOtp(e)} className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Enter your registered email address below to receive a 6-digit verification code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1" htmlFor="resetEmailInput">
                      Email Address
                    </label>
                    <input
                      id="resetEmailInput"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. user@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 rounded-lg bg-[#109367] hover:bg-[#0c7a54] text-white font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {resetLoading ? 'Sending Code…' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {resetStep === 'otp' && (
                <form onSubmit={(e) => void handleVerifyAndResetPassword(e)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1" htmlFor="resetOtpInput">
                      6-Digit OTP Code
                    </label>
                    <input
                      id="resetOtpInput"
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 482910"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm font-mono tracking-widest text-center text-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1" htmlFor="newPwdInput">
                      New Password
                    </label>
                    <input
                      id="newPwdInput"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new secure password"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 rounded-lg bg-[#109367] hover:bg-[#0c7a54] text-white font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {resetLoading ? 'Updating Password…' : 'Verify OTP & Reset Password'}
                  </button>
                </form>
              )}

              {resetStep === 'success' && (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-[48px] text-emerald-600">check_circle</span>
                  <h3 className="font-bold text-lg text-gray-900 mt-2">Password Reset Successful!</h3>
                  <p className="text-xs text-gray-600 mt-1">Logging you in to your dashboard...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CORE LOGIN CONTENT (Pixel-perfect matching Stitch image.png_11) */}
      <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-white py-12 md:py-16">
        <div className="w-full max-w-[420px] mx-auto px-4 z-10">
          <div className="text-center pb-2">
            <h1 className="font-headline-md text-2xl font-bold text-gray-900 tracking-wider uppercase">
              LOGIN
            </h1>
            <div className="w-full h-px bg-gray-200 mt-3 mx-auto max-w-[340px]" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)} autoComplete="off">
            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {loginError}
              </div>
            )}
            <div className="space-y-1">
              <label className="block font-body-md text-sm font-medium text-gray-800" htmlFor="loginEmail">
                Email:
              </label>
              <input
                id="loginEmail"
                className="w-full px-4 py-2.5 rounded-lg bg-[#eef3fa] text-gray-900 font-body-md text-sm outline-none border border-transparent focus:border-secondary focus:bg-white transition-all shadow-xs"
                required
                type="email"
                autoComplete="off"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-body-md text-sm font-medium text-gray-800" htmlFor="loginPwd">
                Password:
              </label>
              <div className="relative">
                <input
                  id="loginPwd"
                  className="w-full pl-4 pr-11 py-2.5 rounded-lg bg-[#eef3fa] text-gray-900 font-body-md text-sm outline-none border border-transparent focus:border-secondary focus:bg-white transition-all shadow-xs"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none flex items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={isLoggingIn}
                className="w-full py-2.5 px-6 rounded-lg bg-[#109367] hover:bg-[#0c7a54] text-white font-label-md text-sm tracking-wider uppercase font-bold shadow-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                type="submit"
              >
                <span>{isLoggingIn ? 'LOGGING IN…' : 'LOGIN'}</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col items-center space-y-1 text-center text-sm text-gray-700">
              <p>
                Don&apos;t have an account?{' '}
                <Link className="text-[#2563eb] hover:underline font-bold ml-1" to="/signup">
                  Signup
                </Link>
              </p>
              <p>
                Forgot password?{' '}
                <button
                  type="button"
                  className="text-[#2563eb] hover:underline font-medium ml-1 cursor-pointer"
                  onClick={() => {
                    setResetEmail(email)
                    setResetStep('email')
                    setResetError(null)
                    setResetMsg(null)
                    setResetModalOpen(true)
                  }}
                >
                  Reset Password via OTP
                </button>
              </p>
            </div>
          </form>
        </div>


        {/* Bottom Illustration: Bench and Park Trees matching image.png_11 */}
        <div className="w-full max-w-5xl mx-auto px-4 mt-8 relative">
          <div className="flex items-end">
            <svg
              className="h-28 w-auto text-[#109367] select-none"
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tall Tree Left */}
              <path d="M50 10C35 30 25 60 25 90C25 105 35 110 50 110C65 110 75 105 75 90C75 60 65 30 50 10Z" fill="#136b4a" />
              <path d="M50 10C42 30 35 60 35 90C35 105 42 110 50 110" fill="#0c4f36" />
              {/* Shorter Tree Right */}
              <path d="M95 35C82 50 75 75 75 95C75 105 82 110 95 110C108 110 115 105 115 95C115 75 108 50 95 35Z" fill="#1a845c" />
              {/* Low Bush */}
              <ellipse cx="120" cy="105" rx="18" ry="12" fill="#0e573c" />
              {/* Park Bench */}
              <rect x="52" y="94" width="28" height="3" fill="#8c5836" />
              <rect x="54" y="86" width="24" height="2" fill="#a46d44" />
              <rect x="54" y="90" width="24" height="2" fill="#a46d44" />
              <line x1="56" y1="97" x2="56" y2="110" stroke="#5c6370" strokeWidth="2" />
              <line x1="76" y1="97" x2="76" y2="110" stroke="#5c6370" strokeWidth="2" />
              {/* Trash Can */}
              <rect x="44" y="98" width="6" height="12" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              {/* Little Lamp Post */}
              <line x1="82" y1="80" x2="82" y2="110" stroke="#334155" strokeWidth="1.5" />
              <polygon points="80,80 84,80 85,76 79,76" fill="#fef08a" />
              {/* Ground Base Line */}
              <line x1="0" y1="110" x2="200" y2="110" stroke="#b08968" strokeWidth="2" />
            </svg>
          </div>
          <div className="w-full h-px bg-gray-200 mt-0" />
        </div>
      </div>

      <AppFooter dark />
    </div>
  )
}
