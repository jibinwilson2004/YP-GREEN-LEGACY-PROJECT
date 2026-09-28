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
    // If stored name is "Wilson K Skaria" but email is jibinwilson..., override to Jibin Wilson
    if (e.includes('jibin') && storedName.toLowerCase().includes('skaria')) {
      return 'Jibin Wilson'
    }
    return storedName.trim()
  }
  if (e.includes('jibin')) return 'Jibin Wilson'
  const prefix = e.split('@')[0]
  return prefix.split(/[\._-]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export const authService = {
  login(email: string, password: string): AuthUser | null {
    const e = email.trim().toLowerCase()
    if (e === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user: AuthUser = { email: e, role: 'admin', displayName: 'Administrator' }
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', e)
      localStorage.setItem('tree_tag_role', 'admin')
      window.dispatchEvent(new Event('auth-change'))
      return user
    }
    // Regular user — accept any non-empty credentials (demo mode)
    if (e && password) {
      let name = formatDisplayName(e)

      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', e)
      localStorage.setItem('tree_tag_role', 'user')

      // Check for saved profile for this user
      const savedProfile = localStorage.getItem(`tree_tag_user_${e}`)
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          name = formatDisplayName(e, parsed.fullName)
          // Save back sanitized profile
          parsed.fullName = name
          parsed.email = e
          localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(parsed))
          localStorage.setItem('tree_tag_user', JSON.stringify(parsed))
        } catch {
          localStorage.removeItem('tree_tag_user')
        }
      } else {
        const newProfile = {
          fullName: name,
          email: e,
          registeredAt: new Date().toISOString(),
        }
        localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(newProfile))
        localStorage.setItem('tree_tag_user', JSON.stringify(newProfile))
      }

      const user: AuthUser = { email: e, role: 'user', displayName: name }
      window.dispatchEvent(new Event('auth-change'))
      return user
    }
    return null
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

