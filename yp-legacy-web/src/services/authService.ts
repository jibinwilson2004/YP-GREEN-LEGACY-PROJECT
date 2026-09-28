// Simple admin credentials — in production these would be server-validated
export const ADMIN_EMAIL = 'admin@gmail.com'
export const ADMIN_PASSWORD = 'admin'

export type UserRole = 'admin' | 'user' | 'guest'

export interface AuthUser {
  email: string
  role: UserRole
  displayName: string
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
      const user: AuthUser = { email: e, role: 'user', displayName: e.split('@')[0] }
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', e)
      localStorage.setItem('tree_tag_role', 'user')
      // Load this user's saved signup profile if it exists
      const savedProfile = localStorage.getItem(`tree_tag_user_${e}`)
      if (savedProfile) {
        localStorage.setItem('tree_tag_user', savedProfile)
      } else {
        // No signup profile — clear any previous user's data
        localStorage.removeItem('tree_tag_user')
      }
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
    return {
      email,
      role,
      displayName: role === 'admin' ? 'Administrator' : email.split('@')[0],
    }
  },

  isAdmin(): boolean {
    return localStorage.getItem('tree_tag_role') === 'admin'
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('tree_tag_logged_in')
  },
}
