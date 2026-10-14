import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Server } from 'node:http'
import { app } from '../server/app'
import { db } from '../server/db'
import { generateToken, hashPassword } from '../server/services/auth'

let server: Server
let baseUrl: string
let adminToken: string
let userToken: string

beforeAll(async () => {
  // Bootstrap test admin user
  const adminHashed = await hashPassword('AdminPass2026!')
  await db.createUser({
    email: 'admin_test@ieee.org',
    full_name: 'Admin Test',
    password_hash: adminHashed,
    role: 'admin',
  })
  adminToken = generateToken({
    email: 'admin_test@ieee.org',
    role: 'admin',
    displayName: 'Admin Test',
  })

  userToken = generateToken({
    email: 'planter_test@ieee.org',
    role: 'user',
    displayName: 'Planter Test',
  })

  // Start HTTP server on random available port
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 5001
      baseUrl = `http://127.0.0.1:${port}`
      resolve()
    })
  })
})

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

describe('Backend REST API Integration Suite', () => {
  it('GET /api/health returns operational status', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('online')
    expect(data.service).toContain('IEEE YP Green Legacy')
  })

  it('POST /api/auth/signup registers a new user with password hash', async () => {
    const email = `test_volunteer_${Date.now()}@ieee.org`
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'TreePassword123',
        fullName: 'Jane Volunteer',
        institution: 'NIT Calicut',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.token).toBeDefined()
    expect(data.user.email).toBe(email)
  })

  it('POST /api/auth/login validates credentials correctly', async () => {
    // Attempt invalid password
    const resBad = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin_test@ieee.org',
        password: 'WrongPassword',
      }),
    })
    expect(resBad.status).toBe(401)

    // Valid password
    const resGood = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin_test@ieee.org',
        password: 'AdminPass2026!',
      }),
    })
    expect(resGood.status).toBe(200)
    const data = await resGood.json()
    expect(data.success).toBe(true)
    expect(data.user.role).toBe('admin')
  })

  it('POST /api/trees rejects invalid coordinates', async () => {
    const res = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species: 'Ficus religiosa',
        latitude: 95.0, // Invalid: > 90
        longitude: 76.2,
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('latitude')
  })

  it('POST /api/trees registers a tree and enforces idempotency', async () => {
    const treeId = `TEST-${Date.now().toString().slice(-6)}`
    const payload = {
      id: treeId,
      species: 'Mangifera indica',
      commonName: 'Mango',
      latitude: 10.1234,
      longitude: 76.5678,
      accuracy: 3.5,
      altitude: 25.0,
      readingCount: 8,
      stabilityScore: 92,
      capturedAt: new Date().toISOString(),
      student: 'Test Planter',
    }

    // First creation
    const res1 = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    })
    expect(res1.status).toBe(201)
    const tree1 = await res1.json()
    expect(tree1.id).toBe(treeId)

    // Idempotent retry with same payload
    const res2 = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    })
    expect(res2.status).toBe(200)
    const tree2 = await res2.json()
    expect(tree2.id).toBe(treeId)
  })

  it('POST /api/trees/:id/review requires admin authorization', async () => {
    const treeId = `TEST-REV-${Date.now().toString().slice(-4)}`
    await db.upsertTree({
      id: treeId,
      species: 'Teak',
      latitude: 10.0,
      longitude: 76.0,
      accuracy: 4.0,
      gpsSource: 'SMARTPHONE_GPS',
      locationConfidence: 85,
      locationStatus: 'HIGH',
      readingCount: 5,
      stabilityScore: 85,
      capturedAt: new Date().toISOString(),
      verificationStatus: 'PENDING',
    })

    // User token: must fail with 403 Forbidden
    const resUser = await fetch(`${baseUrl}/api/trees/${treeId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', adminNote: 'Audited' }),
    })
    expect(resUser.status).toBe(403)

    // Admin token: must succeed
    const resAdmin = await fetch(`${baseUrl}/api/trees/${treeId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', adminNote: 'Audited' }),
    })
    expect(resAdmin.status).toBe(200)
    const data = await resAdmin.json()
    expect(data.tree.verificationStatus).toBe('VERIFIED')
  })

  it('DELETE /api/trees/:id deletes tree and prevents resurrection', async () => {
    const treeId = `TEST-DEL-${Date.now().toString().slice(-4)}`
    await db.upsertTree({
      id: treeId,
      species: 'Jackfruit',
      latitude: 10.5,
      longitude: 76.5,
      accuracy: 3.8,
      gpsSource: 'SMARTPHONE_GPS',
      locationConfidence: 88,
      locationStatus: 'HIGH',
      readingCount: 6,
      stabilityScore: 88,
      capturedAt: new Date().toISOString(),
      verificationStatus: 'PENDING',
    })

    // Delete tree via admin endpoint
    const delRes = await fetch(`${baseUrl}/api/trees/${treeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(delRes.status).toBe(200)

    // Ensure it cannot be fetched again
    const getRes = await fetch(`${baseUrl}/api/trees/${treeId}`)
    expect(getRes.status).toBe(404)
  })

  it('POST /api/photos/upload stores image and serves content', async () => {
    // Seed verified tree so photo content is publicly viewable
    await db.upsertTree({
      id: 'YP-000001',
      species: 'Azadirachta indica',
      latitude: 10.0528,
      longitude: 76.6346,
      accuracy: 4.2,
      verificationStatus: 'VERIFIED',
    })

    // 1x1 transparent GIF base64
    const sampleBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const res = await fetch(`${baseUrl}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        treeId: 'YP-000001',
        imageBase64: sampleBase64,
        mimeType: 'image/jpeg',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.photo.url).toBeDefined()

    // Fetch the served image (publicly accessible since tree is VERIFIED)
    const contentRes = await fetch(`${baseUrl}${data.photo.url}`)
    expect(contentRes.status).toBe(200)
    expect(contentRes.headers.get('content-type')).toContain('image')
  })

  it('GET /api/stats returns aggregated metrics', async () => {
    const res = await fetch(`${baseUrl}/api/stats`)
    expect(res.status).toBe(200)
    const stats = await res.json()
    expect(stats.totalTrees).toBeGreaterThanOrEqual(1)
    expect(stats.averageAccuracy).toBeDefined()
  })

  it('Server independently rejects GPS coordinates with poor accuracy (> 50m)', async () => {
    const res = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        species: 'Ficus benghalensis',
        latitude: 10.1,
        longitude: 76.3,
        accuracy: 65.0, // > 50m: must be rejected by server
        locationConfidence: 100, // Attempted client spoofing
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('GPS accuracy too low')
  })

  it('Enforces idempotency using submissionKey across retries', async () => {
    const subKey = `SUB-KEY-${Date.now()}`
    const payload = {
      submissionKey: subKey,
      species: 'Polyalthia longifolia',
      latitude: 10.33,
      longitude: 76.44,
      accuracy: 4.0,
      student: 'Sync Tester',
    }

    const res1 = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    })
    expect(res1.status).toBe(201)
    const tree1 = await res1.json()

    // Second call with same submissionKey (simulating lost response retry)
    const res2 = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    })
    expect(res2.status).toBe(200)
    const tree2 = await res2.json()
    expect(tree2.id).toBe(tree1.id)
  })

  it('Enforces photo authorization: 403 Forbidden for unapproved evidence when unauthorized', async () => {
    // 1. Upload photo for a pending tree as planter_test@ieee.org
    const sampleBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const pendingTreeId = `PENDING-TREE-${Date.now()}`
    await db.upsertTree({
      id: pendingTreeId,
      species: 'Neem',
      latitude: 10.8,
      longitude: 76.8,
      accuracy: 4.0,
      verificationStatus: 'PENDING',
    })

    const uploadRes = await fetch(`${baseUrl}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`, // planter_test@ieee.org
      },
      body: JSON.stringify({
        treeId: pendingTreeId,
        imageBase64: sampleBase64,
        mimeType: 'image/jpeg',
      }),
    })
    expect(uploadRes.status).toBe(201)
    const { photo } = await uploadRes.json()

    // 2. Unauthenticated request to private photo -> 403 Forbidden
    const unauthRes = await fetch(`${baseUrl}${photo.url}`)
    expect(unauthRes.status).toBe(403)

    // 3. Different regular user request -> 403 Forbidden
    const otherUserToken = generateToken({
      email: 'other_user@ieee.org',
      role: 'user',
      displayName: 'Other User',
    })
    const otherRes = await fetch(`${baseUrl}${photo.url}`, {
      headers: { Authorization: `Bearer ${otherUserToken}` },
    })
    expect(otherRes.status).toBe(403)

    // 4. Original uploader request -> 200 OK
    const uploaderRes = await fetch(`${baseUrl}${photo.url}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    expect(uploaderRes.status).toBe(200)

    // 5. Admin request -> 200 OK
    const adminFetchRes = await fetch(`${baseUrl}${photo.url}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(adminFetchRes.status).toBe(200)
  })
})
