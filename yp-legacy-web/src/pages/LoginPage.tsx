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

  // Ensure fields start completely empty on mount
  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    const user = authService.login(email, password)
    if (!user) {
      setLoginError('Invalid credentials. Please try again.')
      return
    }
    navigate(user.role === 'admin' ? '/admin' : '/profile')
  }

  return (
    <div className="min-h-screen bg-white font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      {/* 4. CORE LOGIN CONTENT (Pixel-perfect matching Stitch image.png_11) */}
      <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-white py-12 md:py-16">
        <div className="w-full max-w-[420px] mx-auto px-4 z-10">
          <div className="text-center pb-2">
            <h1 className="font-headline-md text-2xl font-bold text-gray-900 tracking-wider uppercase">
              LOGIN
            </h1>
            <div className="w-full h-px bg-gray-200 mt-3 mx-auto max-w-[340px]" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} autoComplete="off">
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
                className="w-full py-2.5 px-6 rounded-lg bg-[#109367] hover:bg-[#0c7a54] text-white font-label-md text-sm tracking-wider uppercase font-bold shadow-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
                type="submit"
              >
                <span>LOGIN</span>
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
                  onClick={() => alert(`Password reset link sent to ${email}`)}
                >
                  Reset Password
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
