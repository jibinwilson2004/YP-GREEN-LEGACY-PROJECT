import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from '../server/services/auth'

describe('Authentication & Cryptography Suite', () => {
  it('hashes passwords using scrypt with unique random salts', async () => {
    const raw = 'SecurePlanting2026!'
    const hash1 = await hashPassword(raw)
    const hash2 = await hashPassword(raw)

    expect(hash1).not.toBe(hash2) // Different salts
    expect(hash1.includes(':')).toBe(true)

    const valid1 = await verifyPassword(raw, hash1)
    const valid2 = await verifyPassword(raw, hash2)
    expect(valid1).toBe(true)
    expect(valid2).toBe(true)

    const invalid = await verifyPassword('WrongPassword123', hash1)
    expect(invalid).toBe(false)
  })

  it('generates cryptographically signed stateless tokens', () => {
    const user = {
      email: 'volunteer@ieee.org',
      role: 'user' as const,
      displayName: 'Volunteer Planter',
    }

    const token = generateToken(user, 3600)
    expect(token.split('.').length).toBe(3)

    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.email).toBe('volunteer@ieee.org')
    expect(decoded?.role).toBe('user')
    expect(decoded?.displayName).toBe('Volunteer Planter')
  })

  it('rejects tampered tokens', () => {
    const token = generateToken({ email: 'user@test.org', role: 'user', displayName: 'User' })
    const parts = token.split('.')

    // Tamper with payload (e.g. elevate role to admin)
    const tamperedPayload = Buffer.from(JSON.stringify({ email: 'user@test.org', role: 'admin' }))
      .toString('base64')
      .replace(/=/g, '')
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

    expect(verifyToken(tamperedToken)).toBeNull()
  })

  it('rejects expired tokens', () => {
    // Generate token expired 10 seconds ago
    const expiredToken = generateToken(
      { email: 'user@test.org', role: 'user', displayName: 'User' },
      -10
    )
    expect(verifyToken(expiredToken)).toBeNull()
  })
})
