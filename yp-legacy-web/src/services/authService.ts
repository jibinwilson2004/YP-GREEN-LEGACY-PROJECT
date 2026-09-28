import { neonService } from './neonService'

// Simple admin credentials — in production these would be server-validated
export const ADMIN_EMAIL = 'admin@gmail.com'
export const ADMIN_PASSWORD = 'admin'

export type UserRole = 'admin' | 'user' | 'guest'

export interface AuthUser {
  email: string
  role: UserRole
  displayName: string
}

export function formatDisplayName(email: string, storedName?: string): string {
  const e = email.trim().toLowerCase()
  if (storedName && storedName.trim()) {
    return storedName.trim()
  }
  const prefix = e.split('@')[0]
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export const authService = {
  async userExists(email: string): Promise<boolean> {
    const e = email.trim().toLowerCase()
    if (!e) return false
    if (e === ADMIN_EMAIL) return true
    if (localStorage.getItem(`tree_tag_user_${e}`)) return true
    // Check Neon Postgres DB
    const dbUser = await neonService.getUser(e)
    return !!dbUser
  },

  async loginAsync(email: string, password?: string): Promise<{ success: boolean; user?: AuthUser; reason?: 'NOT_FOUND' | 'NO_PASSWORD' | 'WRONG_PASSWORD' }> {
    const e = email.trim().toLowerCase()
    if (!e) return { success: false, reason: 'NOT_FOUND' }

    if (e === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user: AuthUser = { email: e, role: 'admin', displayName: 'Administrator' }
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', e)
      localStorage.setItem('tree_tag_role', 'admin')
      window.dispatchEvent(new Event('auth-change'))
      return { success: true, user }
    }

    // Check saved user profile in local storage or Neon Postgres DB
    let savedProfileStr = localStorage.getItem(`tree_tag_user_${e}`)
    let savedProfile: any = null

    if (savedProfileStr) {
      try { savedProfile = JSON.parse(savedProfileStr) } catch { /* ignore */ }
    } else {
      const dbUser = await neonService.getUser(e)
      if (dbUser) {
        savedProfile = {
          fullName: dbUser.full_name || formatDisplayName(e),
          email: e,
          passwordHash: dbUser.password_hash,
          institution: dbUser.institution,
        }
        localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(savedProfile))
      }
    }

    // If account not found in local storage or DB, prompt signup
    if (!savedProfile && e !== ADMIN_EMAIL) {
      return { success: false, reason: 'NOT_FOUND' }
    }

    // Check password if set
    if (savedProfile?.passwordHash && password) {
      if (savedProfile.passwordHash !== password) {
        return { success: false, reason: 'WRONG_PASSWORD' }
      }
    }

    let name = formatDisplayName(e, savedProfile?.fullName)

    localStorage.setItem('tree_tag_logged_in', 'true')
    localStorage.setItem('tree_tag_user_id', e)
    localStorage.setItem('tree_tag_role', 'user')

    const newProfile = {
      fullName: name,
      email: e,
      passwordHash: password || savedProfile?.passwordHash || '',
      registeredAt: savedProfile?.registeredAt || new Date().toISOString(),
    }
    localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(newProfile))
    localStorage.setItem('tree_tag_user', JSON.stringify(newProfile))

    // Sync to Neon Postgres DB asynchronously
    neonService.upsertUser({ email: e, fullName: name, passwordHash: newProfile.passwordHash })

    const user: AuthUser = { email: e, role: 'user', displayName: name }
    window.dispatchEvent(new Event('auth-change'))
    return { success: true, user }
  },

  login(email: string, password: string): AuthUser | null {
    const e = email.trim().toLowerCase()
    if (!e) return null
    if (e === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user: AuthUser = { email: e, role: 'admin', displayName: 'Administrator' }
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', e)
      localStorage.setItem('tree_tag_role', 'admin')
      window.dispatchEvent(new Event('auth-change'))
      return user
    }

    let name = formatDisplayName(e)
    let savedProfileStr = localStorage.getItem(`tree_tag_user_${e}`)
    if (savedProfileStr) {
      try {
        const parsed = JSON.parse(savedProfileStr)
        name = formatDisplayName(e, parsed.fullName)
      } catch { /* ignore */ }
    }

    localStorage.setItem('tree_tag_logged_in', 'true')
    localStorage.setItem('tree_tag_user_id', e)
    localStorage.setItem('tree_tag_role', 'user')

    const userObj = { fullName: name, email: e, passwordHash: password }
    localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(userObj))
    localStorage.setItem('tree_tag_user', JSON.stringify(userObj))

    neonService.upsertUser({ email: e, fullName: name, passwordHash: password })

    const user: AuthUser = { email: e, role: 'user', displayName: name }
    window.dispatchEvent(new Event('auth-change'))
    return user
  },

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const e = email.trim().toLowerCase()
    if (!e || !newPassword) return false

    let profile: any = {}
    const raw = localStorage.getItem(`tree_tag_user_${e}`)
    if (raw) {
      try { profile = JSON.parse(raw) } catch { /* ignore */ }
    }
    profile.email = e
    profile.fullName = profile.fullName || formatDisplayName(e)
    profile.passwordHash = newPassword

    localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(profile))
    localStorage.setItem('tree_tag_user', JSON.stringify(profile))

    await neonService.upsertUser({
      email: e,
      fullName: profile.fullName,
      passwordHash: newPassword,
    })
    return true
  },

  logout() {
    localStorage.removeItem('tree_tag_logged_in')
    localStorage.removeItem('tree_tag_user_id')
    localStorage.removeItem('tree_tag_role')
    localStorage.removeItem('tree_tag_user')
    window.dispatchEvent(new Event('auth-change'))
    window.location.href = '/login'
  },

  getCurrentUser(): AuthUser | null {
    const loggedIn = localStorage.getItem('tree_tag_logged_in')
    const email = localStorage.getItem('tree_tag_user_id')
    const role = (localStorage.getItem('tree_tag_role') ?? 'user') as UserRole
    if (!loggedIn || !email) return null

    let name = formatDisplayName(email)
    try {
      const raw = localStorage.getItem(`tree_tag_user_${email}`) || localStorage.getItem('tree_tag_user')
      if (raw) {
        const p = JSON.parse(raw) as { fullName?: string; email?: string }
        if (!p.email || p.email.toLowerCase() === email.toLowerCase()) {
          name = formatDisplayName(email, p.fullName)
        }
      }
    } catch {
      /* ignore */
    }

    return {
      email,
      role,
      displayName: role === 'admin' ? 'Administrator' : name,
    }
  },

  isAdmin(): boolean {
    return localStorage.getItem('tree_tag_role') === 'admin'
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('tree_tag_logged_in')
  },
}


