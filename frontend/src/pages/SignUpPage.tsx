import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppFooter } from '../components/layout/AppFooter'
import { IEEE_MEMBERSHIP_GRADES, IEEE_REGIONS } from '../constants/ieeeRegions'
import { authService } from '../services/authService'



export function SignUpPage() {
  const navigate = useNavigate()

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // IEEE Membership Fields
  const [isIeeeMember, setIsIeeeMember] = useState(true)
  const [ieeeId, setIeeeId] = useState('')
  const [membershipGrade, setMembershipGrade] = useState('Student Member')
  const [selectedRegionId, setSelectedRegionId] = useState('region-10')
  const [selectedSection, setSelectedSection] = useState('Kerala')
  const [country, setCountry] = useState('India')

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Selected region object to populate dynamic sections
  const activeRegion = IEEE_REGIONS.find((r) => r.id === selectedRegionId) || IEEE_REGIONS[0]

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId)
    const newRegion = IEEE_REGIONS.find((r) => r.id === regionId)
    if (newRegion && newRegion.sections.length > 0) {
      setSelectedSection(newRegion.sections[0])
    }
  }

  // Create the account through the FastAPI authentication service.
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError('')

    if (password !== confirmPassword) {
      setOtpError('Passwords do not match. Please verify your password.')
      return
    }

    if (password.length < 10) {
      setOtpError('Password must be at least 10 characters long.')
      return
    }

    if (isIeeeMember && !ieeeId.trim()) {
      setOtpError('Please enter your IEEE Membership ID.')
      return
    }

    setOtpLoading(true)
    try {
      const result = await authService.registerUserAsync({
        fullName,
        email: email.trim().toLowerCase(),
        institution,
        ieeeId: isIeeeMember ? ieeeId : undefined,
        membershipGrade: isIeeeMember ? membershipGrade : undefined,
        region: isIeeeMember ? activeRegion.name : undefined,
        section: isIeeeMember ? selectedSection : undefined,
        country,
        password,
      })
      if (!result.success) {
        setOtpError(result.error || 'Account registration failed.')
        return
      }
      setStep('success')
      setTimeout(() => {
        navigate('/profile')
      }, 2200)
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Account registration failed.')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest font-body-md text-on-surface antialiased flex flex-col justify-between">
      <AppHeader />

      {/* 4. MAIN REGISTRATION CARD */}
      <div className="relative w-full flex-1 flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#004d36] to-[#0a2118] text-white p-6 sm:p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
              <span className="material-symbols-outlined text-[28px] text-[#a2f0cc]">
                {step === 'success' ? 'check_circle' : 'person_add'}
              </span>
            </div>
            <h1 className="font-headline-md text-2xl sm:text-3xl font-bold tracking-tight">
              {step === 'success'
                ? 'Registration Successful!'
                : 'Create IEEE YP Green Legacy Account'}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              {step === 'success'
                ? 'Your account has been verified. Redirecting to your personal dashboard...'
                : 'Join the IEEE Young Professionals Climate & Sustainability Telemetry Network'}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* STEP 1: INITIAL REGISTRATION FORM */}
            {step === 'form' && (
              <form className="space-y-5" onSubmit={handleInitiateSignup}>
                {otpError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Primary Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="fullName">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                      required
                      autoComplete="on"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="signupEmail">
                      Email Address *
                    </label>
                    <input
                      id="signupEmail"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                      required
                      autoComplete="on"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="institution">
                    Institution / University / Organization *
                  </label>
                  <input
                    id="institution"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                    required
                    autoComplete="on"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  />
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="signupPassword">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="signupPassword"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                        placeholder="••••••••"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="confirmPassword">
                      Confirm Password *
                    </label>
                    <input
                      id="confirmPassword"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* IEEE Member Question Section */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#00629b] text-white flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[18px]">badge</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Are you an IEEE Member?</div>
                          <div className="text-[11px] text-gray-500">Access exclusive student section badges & regional leaderboards</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setIsIeeeMember(true)}
                          className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                            isIeeeMember ? 'bg-secondary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsIeeeMember(false)}
                          className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                            !isIeeeMember ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* IEEE Member Specific Fields */}
                    {isIeeeMember && (
                      <div className="mt-4 pt-4 border-t border-emerald-200/80 space-y-4 animate-fade-in">
                        {/* IEEE ID & Grade */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="ieeeId">
                              Enter IEEE ID *
                            </label>
                            <input
                              id="ieeeId"
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary text-sm font-mono outline-none transition-all"
                              placeholder="e.g. 98452310"
                              required={isIeeeMember}
                              type="text"
                              value={ieeeId}
                              onChange={(e) => setIeeeId(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="membershipGrade">
                              Membership Grade *
                            </label>
                            <select
                              id="membershipGrade"
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all cursor-pointer"
                              value={membershipGrade}
                              onChange={(e) => setMembershipGrade(e.target.value)}
                            >
                              {IEEE_MEMBERSHIP_GRADES.map((grade) => (
                                <option key={grade} value={grade}>
                                  {grade}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Region & Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="region">
                              Region *
                            </label>
                            <select
                              id="region"
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all cursor-pointer"
                              value={selectedRegionId}
                              onChange={(e) => handleRegionChange(e.target.value)}
                            >
                              {IEEE_REGIONS.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="section">
                              Section ({activeRegion.sections.length} available) *
                            </label>
                            <select
                              id="section"
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all cursor-pointer"
                              value={selectedSection}
                              onChange={(e) => setSelectedSection(e.target.value)}
                            >
                              {activeRegion.sections.map((sec) => (
                                <option key={sec} value={sec}>
                                  {sec}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="country">
                    Country *
                  </label>
                  <input
                    id="country"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                    placeholder="e.g. India, United States, Canada, Germany"
                    required
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-secondary hover:bg-primary text-white font-label-md text-sm tracking-wider uppercase font-bold shadow-md transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating your secure account...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Create Account</span>
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-gray-600">
                  Already registered?{' '}
                  <Link to="/login" className="text-secondary font-bold hover:underline">
                    Sign in here
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 3: REGISTRATION SUCCESS */}
            {step === 'success' && (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-secondary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px]">verified</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Welcome to IEEE YP Green Legacy Project, {fullName}!</h2>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Your account is ready. Sign in securely to manage your tree records.
                </p>
                <div className="pt-2">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. FOOTER */}
      <AppFooter dark />
    </div>
  )
}
