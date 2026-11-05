import { ApiError, fetchParticipantsApi, loginApi, logoutApi, registerUserApi } from './api'

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
  async registerUserAsync(profile: RegisteredUserRecord & { password: string }): Promise<{ success: boolean; error?: string }> {
    const email = profile.email.trim().toLowerCase()
    if (!email) return { success: false, error: 'Email is required.' }

    try {
      const data = await registerUserApi({
        ...profile,
        email,
        fullName: profile.fullName || formatDisplayName(email),
      })
      localStorage.setItem('tree_tag_auth_token', data.token)
      sessionStorage.setItem('tree_tag_csrf_token', data.csrfToken)
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', data.user.email)
      localStorage.setItem('tree_tag_role', data.user.role)
      this.registerUser({ ...profile, email, fullName: data.user.fullName })
      window.dispatchEvent(new Event('auth-change'))
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed.' }
    }
  },

  registerUser(profile: RegisteredUserRecord): void {
    const email = profile.email.trim().toLowerCase()
    if (!email) return

    const { password: _password, ...safeProfile } = profile as RegisteredUserRecord & { password?: string }
    const record: RegisteredUserRecord = {
      ...safeProfile,
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
    const participants = await fetchParticipantsApi()
    return participants.map((participant) => ({
      email: String(participant.userId),
      fullName: String(participant.fullName || participant.displayName || ''),
      institution: participant.institution ? String(participant.institution) : undefined,
      registeredAt: participant.registeredAt ? String(participant.registeredAt) : undefined,
    }))
  },

  async loginAsync(
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; reason?: 'NOT_FOUND' | 'NO_PASSWORD' | 'WRONG_PASSWORD' }> {
    const e = email.trim().toLowerCase()
    if (!e) return { success: false, reason: 'NOT_FOUND' }

    try {
      const data = await loginApi(e, password || '')
      localStorage.setItem('tree_tag_auth_token', data.token)
      sessionStorage.setItem('tree_tag_csrf_token', data.csrfToken)
      localStorage.setItem('tree_tag_logged_in', 'true')
      localStorage.setItem('tree_tag_user_id', data.user.email)
      localStorage.setItem('tree_tag_role', data.user.role)
      const user: AuthUser = {
        email: data.user.email,
        role: data.user.role as UserRole,
        displayName: data.user.fullName || formatDisplayName(data.user.email),
      }
      this.registerUser({ email: user.email, fullName: user.displayName })
      window.dispatchEvent(new Event('auth-change'))
      return { success: true, user }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { success: false, reason: 'WRONG_PASSWORD' }
      }
      throw error
    }
  },

  async logout() {
    try {
      await logoutApi()
    } catch (error) {
      console.error('[Logout request failed]', error)
    }
    localStorage.removeItem('tree_tag_auth_token')
    sessionStorage.removeItem('tree_tag_csrf_token')
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
