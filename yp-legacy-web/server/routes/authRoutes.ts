import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import { db } from '../db'
import { config } from '../config'
import { hashPassword, verifyPassword, generateToken, requireAuth } from '../services/auth'
import { emailService } from '../services/emailService'

const router = Router()

// Helper: Format display name
function formatDisplayName(email: string, storedName?: string): string {
  if (storedName && storedName.trim()) return storedName.trim()
  const prefix = email.split('@')[0]
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

// 1. Sign Up / Register
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, institution, ieeeId, membershipGrade, region, section, country } = req.body

    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    const existing = await db.getUserByEmail(cleanEmail)
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' })
    }

    let passwordHash: string | null = null
    if (password) {
      if (String(password).length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long.' })
      }
      passwordHash = await hashPassword(String(password))
    }

    const displayName = formatDisplayName(cleanEmail, fullName)
    const role = cleanEmail === config.admin.email ? 'admin' : 'user'

    const user = await db.createUser({
      email: cleanEmail,
      full_name: displayName,
      password_hash: passwordHash,
      role,
      institution,
      ieee_id: ieeeId,
      membership_grade: membershipGrade,
      region,
      section,
      country,
    })

    const token = generateToken({ email: user.email, role: user.role, displayName: user.full_name })

    return res.status(201).json({
      success: true,
      token,
      user: {
        email: user.email,
        role: user.role,
        displayName: user.full_name,
        institution: user.institution,
      },
    })
  } catch (err: any) {
    console.error('[Auth Signup Error]', err)
    return res.status(500).json({ error: 'Failed to create account.' })
  }
})

// 2. Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const cleanEmail = String(email || '').trim().toLowerCase()
    const rawPassword = String(password || '')

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    // Admin lookup and verification
    if (cleanEmail === config.admin.email) {
      let adminUser = await db.getUserByEmail(cleanEmail)
      if (!adminUser) {
        if (config.admin.initialPassword) {
          const hash = await hashPassword(config.admin.initialPassword)
          adminUser = await db.createUser({
            email: cleanEmail,
            full_name: 'Administrator',
            password_hash: hash,
            role: 'admin',
          })
        } else {
          return res.status(401).json({
            error: 'Administrator account has not been initialized. Please configure ADMIN_INITIAL_PASSWORD or run seed command.',
            reason: 'ADMIN_UNINITIALIZED',
          })
        }
      }

      if (!adminUser.password_hash) {
        return res.status(401).json({ error: 'Administrator password is not set.', reason: 'WRONG_PASSWORD' })
      }

      const match = await verifyPassword(rawPassword, adminUser.password_hash)
      if (!match) {
        return res.status(401).json({ error: 'Incorrect administrator password.', reason: 'WRONG_PASSWORD' })
      }

      const token = generateToken({ email: cleanEmail, role: 'admin', displayName: adminUser.full_name || 'Administrator' })
      return res.json({
        success: true,
        token,
        user: { email: cleanEmail, role: 'admin', displayName: adminUser.full_name || 'Administrator' },
      })
    }

    // Regular user lookup
    const user = await db.getUserByEmail(cleanEmail)
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email address.', reason: 'NOT_FOUND' })
    }

    if (user.password_hash) {
      const match = await verifyPassword(rawPassword, user.password_hash)
      if (!match) {
        return res.status(401).json({ error: 'Incorrect password.', reason: 'WRONG_PASSWORD' })
      }
    }

    const token = generateToken({ email: user.email, role: user.role, displayName: user.full_name })
    return res.json({
      success: true,
      token,
      user: {
        email: user.email,
        role: user.role,
        displayName: user.full_name,
        institution: user.institution,
      },
    })
  } catch (err: any) {
    console.error('[Auth Login Error]', err)
    return res.status(500).json({ error: 'Internal server login error.' })
  }
})

// 3. Current User /me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  const user = await db.getUserByEmail(req.user.email)
  if (!user) {
    return res.json({
      email: req.user.email,
      role: req.user.role,
      displayName: req.user.displayName,
    })
  }
  return res.json({
    email: user.email,
    role: user.role,
    displayName: user.full_name,
    institution: user.institution,
    ieeeId: user.ieee_id,
    region: user.region,
    section: user.section,
    country: user.country,
  })
})

// 4. Send OTP
const handleSendOtp = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' })
    }

    const otpCode = String(crypto.randomInt(100000, 999999))
    const recipientName = String(name || 'Green Legacy Explorer').trim()

    await db.setOtp(cleanEmail, otpCode, recipientName, 600000)

    // Send email asynchronously in background
    emailService.sendOtp(cleanEmail, recipientName, otpCode).catch((e) => {
      console.warn('[Background OTP Send Error]', e)
    })

    return res.json({
      success: true,
      message: `Verification code successfully sent to ${cleanEmail}`,
      expires_in: 600,
    })
  } catch (err: any) {
    console.error('[Send OTP Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to generate OTP.' })
  }
}
router.post('/send-otp', handleSendOtp)

// 5. Verify OTP
const handleVerifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanOtp = String(otp || '').trim().replace(/[-\s]/g, '')

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' })
    }

    const result = await db.verifyAndConsumeOtp(cleanEmail, cleanOtp)
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason || 'Invalid OTP code.' })
    }

    return res.json({
      success: true,
      message: 'Email verified successfully!',
    })
  } catch (err: any) {
    console.error('[Verify OTP Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' })
  }
}
router.post('/verify-otp', handleVerifyOtp)

// 6. Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanOtp = String(otp || '').trim().replace(/[-\s]/g, '')
    const password = String(newPassword || '')

    if (!cleanEmail || !cleanOtp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' })
    }

    const user = await db.getUserByEmail(cleanEmail)
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found for this email.' })
    }

    const otpResult = await db.verifyAndConsumeOtp(cleanEmail, cleanOtp)
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.reason || 'Invalid or expired OTP.' })
    }

    const hash = await hashPassword(password)
    await db.updateUserPassword(cleanEmail, hash)

    return res.json({
      success: true,
      message: 'Password successfully updated! You can now log in.',
    })
  } catch (err: any) {
    console.error('[Reset Password Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to reset password.' })
  }
})

export { router as authRoutes, handleSendOtp, handleVerifyOtp }
