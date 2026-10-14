import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { config } from './config'
import type { Tree } from '../src/types/tree'

export interface DbUser {
  id: string
  email: string
  full_name: string
  password_hash: string | null
  role: 'admin' | 'user'
  institution?: string
  ieee_id?: string
  membership_grade?: string
  region?: string
  section?: string
  country?: string
  created_at: string
}

export interface DbPhoto {
  id: string
  tree_id: string
  storage_provider: 'google_drive' | 'local'
  storage_file_id: string
  photo_role: 'primary' | 'evidence' | 'gallery'
  mime_type: string
  file_size: number
  uploader_id?: string
  is_public: boolean
  upload_status: 'pending' | 'completed' | 'failed'
  created_at: string
}

let isNeonConnected = false
let sqlInstance: any = null

// Fallback in-memory / local disk cache for development when DB_URL is invalid/unreachable
const FALLBACK_DATA_PATH = path.resolve(process.cwd(), 'server', 'data_fallback.json')
interface FallbackData {
  users: DbUser[]
  trees: Tree[]
  photos: DbPhoto[]
  otps: Record<string, { otp: string; name: string; expiresAt: number; attempts: number }>
}

let fallbackData: FallbackData = {
  users: [],
  trees: [],
  photos: [],
  otps: {},
}

function loadFallbackData() {
  try {
    if (fs.existsSync(FALLBACK_DATA_PATH)) {
      const raw = fs.readFileSync(FALLBACK_DATA_PATH, 'utf-8')
      fallbackData = JSON.parse(raw)
    }
  } catch {
    /* ignore */
  }
}

function persistFallbackData() {
  try {
    const dir = path.dirname(FALLBACK_DATA_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FALLBACK_DATA_PATH, JSON.stringify(fallbackData, null, 2), 'utf-8')
  } catch {
    /* ignore */
  }
}
loadFallbackData()

export async function initDb(): Promise<boolean> {
  if (!config.databaseUrl) {
    console.warn('[DB] No DATABASE_URL provided. Operating in resilient local storage fallback mode.')
    return false
  }

  try {
    sqlInstance = neon(config.databaseUrl)
    // Verify connectivity with simple query
    await sqlInstance`SELECT 1 as health;`

    // Check if tables are provisioned
    const tables = await sqlInstance`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('trees', 'users', 'tree_photos');
    `
    const foundTables = tables.map((t: any) => t.table_name)
    if (foundTables.length < 3) {
      if (config.nodeEnv !== 'production') {
        console.log('[DB] Provisioning initial database schema for development...')
        const { runMigrations } = await import('./migrate')
        await runMigrations()
      } else {
        console.warn(
          `[DB WARNING] Found ${foundTables.length}/3 required tables (${foundTables.join(', ')}). Run "npm run migrate" to execute controlled schema migrations in production.`
        )
      }
    }

    isNeonConnected = true
    console.log('[DB] Neon PostgreSQL connected and operational.')
    return true
  } catch (err: any) {
    isNeonConnected = false
    console.warn(`[DB] Neon PostgreSQL connection check failed (${err.message}). Using local resilient store.`)
    return false
  }
}

// Haversine distance in meters for duplicate detection
export function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

export const db = {
  isConnected(): boolean {
    return isNeonConnected
  },

  // USERS
  async getUserByEmail(email: string): Promise<DbUser | null> {
    const e = email.toLowerCase().trim()
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM users WHERE LOWER(email) = ${e} LIMIT 1;`
        return rows[0] || null
      } catch {
        /* fallback to local */
      }
    }
    return fallbackData.users.find((u) => u.email.toLowerCase() === e) || null
  },

  async createUser(user: Omit<DbUser, 'id' | 'created_at'>): Promise<DbUser> {
    const e = user.email.toLowerCase().trim()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const record: DbUser = {
      ...user,
      id,
      email: e,
      created_at: now,
    }

    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`
          INSERT INTO users (
            id, email, full_name, password_hash, role, institution, ieee_id,
            membership_grade, region, section, country, created_at, updated_at
          ) VALUES (
            ${id}, ${e}, ${user.full_name}, ${user.password_hash}, ${user.role}, ${user.institution || ''},
            ${user.ieee_id || ''}, ${user.membership_grade || ''}, ${user.region || ''}, ${user.section || ''},
            ${user.country || ''}, ${now}, ${now}
          )
          ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
            role = EXCLUDED.role,
            institution = EXCLUDED.institution,
            ieee_id = EXCLUDED.ieee_id,
            updated_at = ${now};
        `
        return record
      } catch (err) {
        console.warn('[DB User Create Failed, falling back]', err)
      }
    }

    const idx = fallbackData.users.findIndex((u) => u.email.toLowerCase() === e)
    if (idx >= 0) {
      fallbackData.users[idx] = { ...fallbackData.users[idx], ...record }
    } else {
      fallbackData.users.push(record)
    }
    persistFallbackData()
    return record
  },

  async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    const e = email.toLowerCase().trim()
    const now = new Date().toISOString()
    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`
          UPDATE users SET password_hash = ${passwordHash}, updated_at = ${now} WHERE LOWER(email) = ${e};
        `
        return true
      } catch {
        /* fallback */
      }
    }
    const user = fallbackData.users.find((u) => u.email.toLowerCase() === e)
    if (user) {
      user.password_hash = passwordHash
      persistFallbackData()
      return true
    }
    return false
  },

  async getAllUsers(): Promise<DbUser[]> {
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM users ORDER BY created_at DESC;`
        return rows || []
      } catch {
        /* fallback */
      }
    }
    return fallbackData.users
  },

  // TREES
  async getTrees(params: {
    page?: number
    limit?: number
    search?: string
    species?: string
    status?: string
    userId?: string
    minLat?: number
    maxLat?: number
    minLng?: number
    maxLng?: number
  }): Promise<{ trees: Tree[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(200, Math.max(1, params.limit || 20))
    const offset = (page - 1) * limit

    if (isNeonConnected && sqlInstance) {
      try {
        // Query PostgreSQL with bounded params
        let queryConditions: string[] = ['1=1']
        const queryArgs: any[] = []

        if (params.search) {
          queryArgs.push(`%${params.search.toLowerCase()}%`)
          queryConditions.push(`(LOWER(id) LIKE $${queryArgs.length} OR LOWER(species) LIKE $${queryArgs.length} OR LOWER(COALESCE(common_name, '')) LIKE $${queryArgs.length})`)
        }
        if (params.species && params.species !== 'ALL') {
          queryArgs.push(`%${params.species.toLowerCase()}%`)
          queryConditions.push(`LOWER(species) LIKE $${queryArgs.length}`)
        }
        if (params.status && params.status !== 'ALL') {
          queryArgs.push(params.status)
          queryConditions.push(`verification_status = $${queryArgs.length}`)
        }
        if (params.userId) {
          queryArgs.push(params.userId.toLowerCase())
          queryConditions.push(`LOWER(user_id) = $${queryArgs.length}`)
        }
        if (params.minLat !== undefined && params.maxLat !== undefined && params.minLng !== undefined && params.maxLng !== undefined) {
          queryArgs.push(params.minLat, params.maxLat, params.minLng, params.maxLng)
          queryConditions.push(`latitude >= $${queryArgs.length - 3} AND latitude <= $${queryArgs.length - 2} AND longitude >= $${queryArgs.length - 1} AND longitude <= $${queryArgs.length}`)
        }

        const whereClause = queryConditions.join(' AND ')
        const countRes = await sqlInstance(`SELECT COUNT(*)::int as count FROM trees WHERE ${whereClause}`, queryArgs)
        const total = countRes[0]?.count || 0

        queryArgs.push(limit, offset)
        const rows = await sqlInstance(
          `SELECT * FROM trees WHERE ${whereClause} ORDER BY captured_at DESC LIMIT $${queryArgs.length - 1} OFFSET $${queryArgs.length}`,
          queryArgs
        )

        const trees: Tree[] = rows.map((r: any) => ({
          id: r.id,
          species: r.species,
          commonName: r.common_name,
          botanicalName: r.botanical_name,
          imageUrl: r.image_url,
          images: Array.isArray(r.images) ? r.images : (typeof r.images === 'string' ? JSON.parse(r.images) : []),
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          accuracy: Number(r.accuracy),
          altitude: Number(r.altitude),
          gpsSource: r.gps_source,
          locationConfidence: Number(r.location_confidence),
          locationStatus: r.location_status,
          readingCount: Number(r.reading_count),
          stabilityScore: Number(r.stability_score),
          gpsStability: r.gps_stability,
          capturedAt: r.captured_at,
          dateOfPlanting: r.date_of_planting,
          updatedAt: r.updated_at,
          student: r.student,
          college: r.college,
          cluster: r.cluster,
          institution: r.institution,
          userId: r.user_id,
          verificationStatus: r.verification_status,
          verifiedBy: r.verified_by,
          verificationDate: r.verification_date,
          identificationConfidence: Number(r.identification_confidence),
          adminNote: r.admin_note,
        }))

        return { trees, total, page, totalPages: Math.ceil(total / limit) }
      } catch (err) {
        console.warn('[DB Query error, fallback]', err)
      }
    }

    // Fallback in-memory filtration
    let filtered = [...fallbackData.trees]
    if (params.search) {
      const s = params.search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(s) ||
          t.species.toLowerCase().includes(s) ||
          (t.commonName && t.commonName.toLowerCase().includes(s))
      )
    }
    if (params.species && params.species !== 'ALL') {
      const sp = params.species.toLowerCase()
      filtered = filtered.filter((t) => t.species.toLowerCase().includes(sp))
    }
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((t) => t.verificationStatus === params.status)
    }
    if (params.userId) {
      const u = params.userId.toLowerCase()
      filtered = filtered.filter((t) => (t.userId || '').toLowerCase() === u)
    }
    if (params.minLat !== undefined && params.maxLat !== undefined && params.minLng !== undefined && params.maxLng !== undefined) {
      filtered = filtered.filter(
        (t) =>
          t.latitude >= params.minLat! &&
          t.latitude <= params.maxLat! &&
          t.longitude >= params.minLng! &&
          t.longitude <= params.maxLng!
      )
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)
    return {
      trees: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getTreeById(id: string): Promise<Tree | null> {
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM trees WHERE id = ${id} LIMIT 1;`
        if (rows.length > 0) {
          const r = rows[0]
          return {
            id: r.id,
            species: r.species,
            commonName: r.common_name,
            botanicalName: r.botanical_name,
            imageUrl: r.image_url,
            images: Array.isArray(r.images) ? r.images : (typeof r.images === 'string' ? JSON.parse(r.images) : []),
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            accuracy: Number(r.accuracy),
            altitude: Number(r.altitude),
            gpsSource: r.gps_source,
            locationConfidence: Number(r.location_confidence),
            locationStatus: r.location_status,
            readingCount: Number(r.reading_count),
            stabilityScore: Number(r.stability_score),
            gpsStability: r.gps_stability,
            capturedAt: r.captured_at,
            dateOfPlanting: r.date_of_planting,
            updatedAt: r.updated_at,
            student: r.student,
            college: r.college,
            cluster: r.cluster,
            institution: r.institution,
            userId: r.user_id,
            verificationStatus: r.verification_status,
            verifiedBy: r.verified_by,
            verificationDate: r.verification_date,
            identificationConfidence: Number(r.identification_confidence),
            adminNote: r.admin_note,
          }
        }
      } catch {
        /* fallback */
      }
    }
    return fallbackData.trees.find((t) => t.id === id) || null
  },

  async getTreeBySubmissionKey(submissionKey: string): Promise<Tree | null> {
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM trees WHERE submission_key = ${submissionKey} LIMIT 1;`
        if (rows.length > 0) {
          return this.getTreeById(rows[0].id)
        }
      } catch {
        /* fallback */
      }
    }
    return fallbackData.trees.find((t: any) => t.submissionKey === submissionKey || t.id === submissionKey) || null
  },

  async checkDuplicateLocation(lat: number, lng: number, thresholdMeters = 3): Promise<Tree | null> {
    // Check nearest tree within threshold
    const { trees } = await this.getTrees({
      minLat: lat - 0.001,
      maxLat: lat + 0.001,
      minLng: lng - 0.001,
      maxLng: lng + 0.001,
      limit: 50,
    })
    for (const t of trees) {
      const d = haversineDistanceM(lat, lng, t.latitude, t.longitude)
      if (d <= thresholdMeters) return t
    }
    return null
  },

  async upsertTree(tree: Tree, submissionKey?: string): Promise<Tree> {
    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`
          INSERT INTO trees (
            id, submission_key, species, common_name, botanical_name, image_url, images,
            latitude, longitude, accuracy, altitude, gps_source, location_confidence,
            location_status, reading_count, stability_score, gps_stability,
            captured_at, date_of_planting, updated_at, student, college, cluster,
            institution, user_id, verification_status, verified_by, verification_date,
            identification_confidence, admin_note
          ) VALUES (
            ${tree.id}, ${submissionKey || tree.id}, ${tree.species}, ${tree.commonName || ''}, ${tree.botanicalName || ''}, ${tree.imageUrl || ''}, ${JSON.stringify(tree.images || [])},
            ${tree.latitude}, ${tree.longitude}, ${tree.accuracy}, ${tree.altitude || 0}, ${tree.gpsSource}, ${tree.locationConfidence},
            ${tree.locationStatus}, ${tree.readingCount}, ${tree.stabilityScore}, ${tree.gpsStability || ''},
            ${tree.capturedAt}, ${tree.dateOfPlanting || ''}, ${tree.updatedAt || ''}, ${tree.student || ''}, ${tree.college || ''}, ${tree.cluster || ''},
            ${tree.institution || ''}, ${tree.userId || ''}, ${tree.verificationStatus}, ${tree.verifiedBy || ''}, ${tree.verificationDate || ''},
            ${tree.identificationConfidence || 90}, ${tree.adminNote || ''}
          )
          ON CONFLICT (id) DO UPDATE SET
            species = EXCLUDED.species,
            common_name = EXCLUDED.common_name,
            botanical_name = EXCLUDED.botanical_name,
            image_url = EXCLUDED.image_url,
            images = EXCLUDED.images,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            accuracy = EXCLUDED.accuracy,
            altitude = EXCLUDED.altitude,
            gps_source = EXCLUDED.gps_source,
            location_confidence = EXCLUDED.location_confidence,
            location_status = EXCLUDED.location_status,
            reading_count = EXCLUDED.reading_count,
            stability_score = EXCLUDED.stability_score,
            gps_stability = EXCLUDED.gps_stability,
            date_of_planting = EXCLUDED.date_of_planting,
            updated_at = EXCLUDED.updated_at,
            student = EXCLUDED.student,
            college = EXCLUDED.college,
            cluster = EXCLUDED.cluster,
            institution = EXCLUDED.institution,
            verification_status = EXCLUDED.verification_status,
            verified_by = EXCLUDED.verified_by,
            verification_date = EXCLUDED.verification_date,
            identification_confidence = EXCLUDED.identification_confidence,
            admin_note = EXCLUDED.admin_note;
        `
        return tree
      } catch (err) {
        console.warn('[DB Tree Upsert failed, fallback]', err)
      }
    }

    if (submissionKey) {
      ;(tree as any).submissionKey = submissionKey
    }
    const idx = fallbackData.trees.findIndex((t) => t.id === tree.id)
    if (idx >= 0) {
      fallbackData.trees[idx] = { ...fallbackData.trees[idx], ...tree }
    } else {
      fallbackData.trees.unshift(tree)
    }
    persistFallbackData()
    return tree
  },

  async deleteTree(id: string): Promise<boolean> {
    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`DELETE FROM tree_photos WHERE tree_id = ${id};`
        await sqlInstance`DELETE FROM trees WHERE id = ${id};`
        return true
      } catch (err) {
        console.warn('[DB Delete Tree failed, fallback]', err)
      }
    }

    const idx = fallbackData.trees.findIndex((t) => t.id === id)
    if (idx >= 0) {
      fallbackData.trees.splice(idx, 1)
      fallbackData.photos = fallbackData.photos.filter((p) => p.tree_id !== id)
      persistFallbackData()
      return true
    }
    return false
  },

  // PHOTOS
  async createPhoto(photo: Omit<DbPhoto, 'id' | 'created_at'>): Promise<DbPhoto> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const record: DbPhoto = {
      ...photo,
      id,
      created_at: now,
    }

    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`
          INSERT INTO tree_photos (
            id, tree_id, storage_provider, storage_file_id, photo_role,
            mime_type, file_size, uploader_id, is_public, upload_status, created_at, updated_at
          ) VALUES (
            ${id}, ${photo.tree_id}, ${photo.storage_provider}, ${photo.storage_file_id}, ${photo.photo_role},
            ${photo.mime_type}, ${photo.file_size}, ${photo.uploader_id || ''}, ${photo.is_public}, ${photo.upload_status}, ${now}, ${now}
          );
        `
        return record
      } catch (err) {
        console.warn('[DB Create Photo failed, fallback]', err)
      }
    }

    fallbackData.photos.push(record)
    persistFallbackData()
    return record
  },

  async getPhotoById(id: string): Promise<DbPhoto | null> {
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM tree_photos WHERE id = ${id} LIMIT 1;`
        return rows[0] || null
      } catch {
        /* fallback */
      }
    }
    return fallbackData.photos.find((p) => p.id === id) || null
  },

  async getPhotosByTreeId(treeId: string): Promise<DbPhoto[]> {
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM tree_photos WHERE tree_id = ${treeId} ORDER BY created_at ASC;`
        return rows || []
      } catch {
        /* fallback */
      }
    }
    return fallbackData.photos.filter((p) => p.tree_id === treeId)
  },

  // OTPS
  async setOtp(email: string, otp: string, name: string, expiresInMs = 600000): Promise<void> {
    const e = email.toLowerCase().trim()
    const expiresAt = new Date(Date.now() + expiresInMs).toISOString()
    if (isNeonConnected && sqlInstance) {
      try {
        await sqlInstance`
          INSERT INTO otps (email, otp_code, name, expires_at, attempts)
          VALUES (${e}, ${otp}, ${name}, ${expiresAt}, 0)
          ON CONFLICT (email) DO UPDATE SET
            otp_code = EXCLUDED.otp_code,
            name = EXCLUDED.name,
            expires_at = EXCLUDED.expires_at,
            attempts = 0;
        `
        return
      } catch {
        /* fallback */
      }
    }
    fallbackData.otps[e] = {
      otp,
      name,
      expiresAt: Date.now() + expiresInMs,
      attempts: 0,
    }
    persistFallbackData()
  },

  async verifyAndConsumeOtp(email: string, enteredOtp: string): Promise<{ valid: boolean; reason?: string }> {
    const e = email.toLowerCase().trim()
    if (isNeonConnected && sqlInstance) {
      try {
        const rows = await sqlInstance`SELECT * FROM otps WHERE email = ${e} LIMIT 1;`
        if (!rows.length) return { valid: false, reason: 'No OTP requested for this email' }
        const record = rows[0]
        if (new Date(record.expires_at).getTime() < Date.now()) {
          await sqlInstance`DELETE FROM otps WHERE email = ${e};`
          return { valid: false, reason: 'OTP has expired' }
        }
        if (record.otp_code !== enteredOtp) {
          await sqlInstance`UPDATE otps SET attempts = attempts + 1 WHERE email = ${e};`
          return { valid: false, reason: 'Invalid OTP code' }
        }
        await sqlInstance`DELETE FROM otps WHERE email = ${e};`
        return { valid: true }
      } catch {
        /* fallback */
      }
    }

    const item = fallbackData.otps[e]
    if (!item) return { valid: false, reason: 'No OTP requested for this email' }
    if (item.expiresAt < Date.now()) {
      delete fallbackData.otps[e]
      persistFallbackData()
      return { valid: false, reason: 'OTP has expired' }
    }
    if (item.otp !== enteredOtp) {
      item.attempts += 1
      persistFallbackData()
      return { valid: false, reason: 'Invalid OTP code' }
    }
    delete fallbackData.otps[e]
    persistFallbackData()
    return { valid: true }
  },

  // STATS
  async getStats(): Promise<{
    totalTrees: number
    verifiedCount: number
    pendingCount: number
    flaggedCount: number
    rejectedCount: number
    averageAccuracy: number
    speciesBreakdown: Record<string, number>
  }> {
    if (isNeonConnected && sqlInstance) {
      try {
        const totalRes = await sqlInstance`SELECT COUNT(*)::int as count, AVG(accuracy)::float as avg_acc FROM trees;`
        const statusRes = await sqlInstance`SELECT verification_status, COUNT(*)::int as count FROM trees GROUP BY verification_status;`
        const speciesRes = await sqlInstance`SELECT species, COUNT(*)::int as count FROM trees GROUP BY species ORDER BY count DESC LIMIT 10;`

        const totalTrees = totalRes[0]?.count || 0
        const averageAccuracy = Number(totalRes[0]?.avg_acc?.toFixed(2) || 3.4)

        let verifiedCount = 0
        let pendingCount = 0
        let flaggedCount = 0
        let rejectedCount = 0
        for (const s of statusRes) {
          if (s.verification_status === 'VERIFIED') verifiedCount = s.count
          if (s.verification_status === 'PENDING') pendingCount = s.count
          if (s.verification_status === 'FLAGGED') flaggedCount = s.count
          if (s.verification_status === 'REJECTED') rejectedCount = s.count
        }

        const speciesBreakdown: Record<string, number> = {}
        for (const sp of speciesRes) {
          speciesBreakdown[sp.species] = sp.count
        }

        return {
          totalTrees,
          verifiedCount,
          pendingCount,
          flaggedCount,
          rejectedCount,
          averageAccuracy,
          speciesBreakdown,
        }
      } catch {
        /* fallback */
      }
    }

    const totalTrees = fallbackData.trees.length
    const verifiedCount = fallbackData.trees.filter((t) => t.verificationStatus === 'VERIFIED').length
    const pendingCount = fallbackData.trees.filter((t) => t.verificationStatus === 'PENDING').length
    const flaggedCount = fallbackData.trees.filter((t) => t.verificationStatus === 'FLAGGED').length
    const rejectedCount = fallbackData.trees.filter((t) => t.verificationStatus === 'REJECTED').length
    const sumAcc = fallbackData.trees.reduce((acc, t) => acc + (t.accuracy || 3.4), 0)
    const averageAccuracy = totalTrees > 0 ? Number((sumAcc / totalTrees).toFixed(2)) : 3.4

    const speciesBreakdown: Record<string, number> = {}
    for (const t of fallbackData.trees) {
      speciesBreakdown[t.species] = (speciesBreakdown[t.species] || 0) + 1
    }

    return {
      totalTrees,
      verifiedCount,
      pendingCount,
      flaggedCount,
      rejectedCount,
      averageAccuracy,
      speciesBreakdown,
    }
  },
}
