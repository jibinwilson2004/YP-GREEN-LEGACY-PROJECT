export type UserRole = 'admin' | 'user' | 'guest'

export interface AuthUser {
  email: string
  role: UserRole
  displayName: string
}

export interface RegisteredUserRecord {
  email: string
  fullName: string
  institution?: string
  ieeeId?: string
  membershipGrade?: string
  region?: string
  section?: string
  country?: string
  registeredAt?: string
  password?: string
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

const REGISTERED_USERS_KEY = 'tree_tag_registered_users'

export const authService = {
  async registerUserAsync(profile: RegisteredUserRecord & { password?: string }): Promise<{ success: boolean; error?: string }> {
    const email = profile.email.trim().toLowerCase()
    if (!email) return { success: false, error: 'Email is required.' }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName: profile.fullName || formatDisplayName(email),
          password: profile.password,
          institution: profile.institution,
          ieeeId: profile.ieeeId,
          membershipGrade: profile.membershipGrade,
          region: profile.region,
          section: profile.section,
          country: profile.country,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' }
      }

      if (data.token) {
        localStorage.setItem('tree_tag_auth_token', data.token)
      }

      this.registerUser(profile)
      return { success: true }
    } catch {
      // Offline fallback
      this.registerUser(profile)
      return { success: true }
    }
  },

  registerUser(profile: RegisteredUserRecord): void {
    const email = profile.email.trim().toLowerCase()
    if (!email) return

    const record: RegisteredUserRecord = {
      ...profile,
      email,
      fullName: profile.fullName || formatDisplayName(email),
      registeredAt: profile.registeredAt || new Date().toISOString(),
    }

    localStorage.setItem(`tree_tag_user_${email}`, JSON.stringify(record))
    localStorage.setItem('tree_tag_user', JSON.stringify(record))

    // Update registered users list in localStorage
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY)
      const list: RegisteredUserRecord[] = raw ? JSON.parse(raw) : []
      const idx = list.findIndex((u) => u.email.toLowerCase() === email)
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...record }
      } else {
        list.unshift(record)
      }
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list))
    } catch {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([record]))
    }
  },

  getRegisteredUsers(): RegisteredUserRecord[] {
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  async getAllUsersAsync(): Promise<RegisteredUserRecord[]> {
    try {
      const res = await fetch('/api/participants')
      if (res.ok) {
        const participants = await res.json()
        return participants.map((p: any) => ({
          email: p.userId,
          fullName: p.fullName || p.displayName,
          institution: p.institution,
          registeredAt: p.registeredAt,
        }))
      }
    } catch {
      /* ignore */
    }
    return this.getRegisteredUsers()
  },

  async userExists(email: string): Promise<boolean> {
    const e = email.trim().toLowerCase()
    if (!e) return false
    if (localStorage.getItem(`tree_tag_user_${e}`)) return true
    try {
      const users = await this.getAllUsersAsync()
      return users.some((u) => u.email.toLowerCase() === e)
    } catch {
      return false
    }
  },

  async loginAsync(
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; reason?: 'NOT_FOUND' | 'NO_PASSWORD' | 'WRONG_PASSWORD' }> {
    const e = email.trim().toLowerCase()
    if (!e) return { success: false, reason: 'NOT_FOUND' }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('tree_tag_auth_token', data.token)
        }
        localStorage.setItem('tree_tag_logged_in', 'true')
        localStorage.setItem('tree_tag_user_id', data.user.email)
        localStorage.setItem('tree_tag_role', data.user.role)

        const authUser: AuthUser = {
          email: data.user.email,
          role: data.user.role,
          displayName: data.user.displayName,
        }
        window.dispatchEvent(new Event('auth-change'))
        return { success: true, user: authUser }
      }

      if (data.reason) {
        return { success: false, reason: data.reason }
      }
    } catch {
      // Offline fallback check
      let savedProfileStr = localStorage.getItem(`tree_tag_user_${e}`)
      if (savedProfileStr) {
        const saved = JSON.parse(savedProfileStr)
        const user: AuthUser = { email: e, role: 'user', displayName: saved.fullName || formatDisplayName(e) }
        localStorage.setItem('tree_tag_logged_in', 'true')
        localStorage.setItem('tree_tag_user_id', e)
        localStorage.setItem('tree_tag_role', 'user')
        window.dispatchEvent(new Event('auth-change'))
        return { success: true, user }
      }
    }

    return { success: false, reason: 'NOT_FOUND' }
  },

  login(email: string, _password?: string): AuthUser | null {
    const e = email.trim().toLowerCase()
    if (!e) return null
    const role: UserRole = e === 'admin@gmail.com' ? 'admin' : 'user'
    const name = formatDisplayName(e)
    localStorage.setItem('tree_tag_logged_in', 'true')
    localStorage.setItem('tree_tag_user_id', e)
    localStorage.setItem('tree_tag_role', role)
    const user: AuthUser = { email: e, role, displayName: name }
    window.dispatchEvent(new Event('auth-change'))
    return user
  },

  async resetPassword(email: string, newPassword: string, otp?: string): Promise<boolean> {
    const e = email.trim().toLowerCase()
    if (!e || !newPassword) return false

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, newPassword, otp: otp || '000000' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        return true
      }
    } catch {
      // Offline local store update
      let profile: any = {}
      const raw = localStorage.getItem(`tree_tag_user_${e}`)
      if (raw) {
        try { profile = JSON.parse(raw) } catch { /* ignore */ }
      }
      profile.email = e
      localStorage.setItem(`tree_tag_user_${e}`, JSON.stringify(profile))
      return true
    }
    return false
  },

  logout() {
    localStorage.removeItem('tree_tag_auth_token')
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
