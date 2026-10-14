/**
 * Neon Database Client Bridge (Frontend Service Layer)
 * 
 * ARCHITECTURE SECURITY FIX:
 * Database queries have been migrated from the browser to the authenticated
 * server-side layer (/api). No database passwords, secrets, or raw SQL queries
 * are executed directly in the browser bundle.
 */
import type { Tree } from '../types/tree'
import { fetchTrees, registerTreeApi } from './api'

export const neonService = {
  async initSchema(): Promise<void> {
    // Server-side database initialization is handled automatically on server startup
  },

  async syncTreesToDb(trees: Tree[]): Promise<void> {
    try {
      for (const t of trees) {
        await registerTreeApi(t).catch(() => {})
      }
    } catch (err) {
      console.warn('[Sync trees deferred]', err)
    }
  },

  async fetchTreesFromDb(): Promise<Tree[] | null> {
    try {
      const res = await fetchTrees({ limit: 100 })
      return res.trees
    } catch (err) {
      console.warn('[Fetch trees error]', err)
      return null
    }
  },

  async upsertUser(_user: { email: string; fullName?: string; passwordHash?: string; institution?: string; ieeeId?: string }): Promise<void> {
    // User upserts and credential security are enforced via /api/auth endpoints
  },

  async getUser(email: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tree_tag_auth_token') || ''}`,
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
        return data
      }
      return null
    } catch {
      return null
    }
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const res = await fetch(`/api/participants`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },
}
