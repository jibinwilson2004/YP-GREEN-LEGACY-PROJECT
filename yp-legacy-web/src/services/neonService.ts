import { neon } from '@neondatabase/serverless'
import type { Tree } from '../types/tree'

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_4WpX6SjMvuID@ep-wild-block-51065660.us-east-2.aws.neon.tech/neondb?sslmode=require'

export const NEON_DATABASE_URL =
  (import.meta as any).env?.VITE_DATABASE_URL || DEFAULT_NEON_URL


const sql = neon(NEON_DATABASE_URL)

let initialized = false

export const neonService = {
  async initSchema() {
    if (initialized) return
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          full_name TEXT,
          password_hash TEXT,
          institution TEXT,
          ieee_id TEXT,
          membership_grade TEXT,
          region TEXT,
          section TEXT,
          country TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `
      await sql`
        CREATE TABLE IF NOT EXISTS trees (
          id TEXT PRIMARY KEY,
          species TEXT,
          common_name TEXT,
          botanical_name TEXT,
          image_url TEXT,
          images JSONB,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          accuracy DOUBLE PRECISION,
          altitude DOUBLE PRECISION,
          gps_source TEXT,
          location_confidence INT,
          location_status TEXT,
          reading_count INT,
          stability_score INT,
          gps_stability TEXT,
          captured_at TIMESTAMPTZ,
          date_of_planting TEXT,
          updated_at TEXT,
          student TEXT,
          college TEXT,
          cluster TEXT,
          institution TEXT,
          user_id TEXT,
          verification_status TEXT,
          verified_by TEXT,
          verification_date TEXT,
          identification_confidence INT,
          admin_note TEXT
        );
      `
      initialized = true
      console.log('Neon Postgres schema initialized successfully.')
    } catch (err) {
      console.warn('Neon Postgres schema init deferred:', err)
    }
  },

  async syncTreesToDb(trees: Tree[]) {
    try {
      await this.initSchema()
      for (const t of trees) {
        await sql`
          INSERT INTO trees (
            id, species, common_name, botanical_name, image_url, images,
            latitude, longitude, accuracy, altitude, gps_source, location_confidence,
            location_status, reading_count, stability_score, gps_stability,
            captured_at, date_of_planting, updated_at, student, college, cluster,
            institution, user_id, verification_status, verified_by, verification_date,
            identification_confidence, admin_note
          ) VALUES (
            ${t.id}, ${t.species}, ${t.commonName || ''}, ${t.botanicalName || ''}, ${t.imageUrl || ''}, ${JSON.stringify(t.images || [])},
            ${t.latitude}, ${t.longitude}, ${t.accuracy}, ${t.altitude || 0}, ${t.gpsSource}, ${t.locationConfidence},
            ${t.locationStatus}, ${t.readingCount}, ${t.stabilityScore}, ${t.gpsStability || ''},
            ${t.capturedAt}, ${t.dateOfPlanting || ''}, ${t.updatedAt || ''}, ${t.student || ''}, ${t.college || ''}, ${t.cluster || ''},
            ${t.institution || ''}, ${t.userId || ''}, ${t.verificationStatus}, ${t.verifiedBy || ''}, ${t.verificationDate || ''},
            ${t.identificationConfidence || 90}, ${t.adminNote || ''}
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
            captured_at = EXCLUDED.captured_at,
            date_of_planting = EXCLUDED.date_of_planting,
            updated_at = EXCLUDED.updated_at,
            student = EXCLUDED.student,
            college = EXCLUDED.college,
            cluster = EXCLUDED.cluster,
            institution = EXCLUDED.institution,
            user_id = EXCLUDED.user_id,
            verification_status = EXCLUDED.verification_status,
            verified_by = EXCLUDED.verified_by,
            verification_date = EXCLUDED.verification_date,
            identification_confidence = EXCLUDED.identification_confidence,
            admin_note = EXCLUDED.admin_note;
        `
      }
    } catch (err) {
      console.warn('Neon Postgres sync error:', err)
    }
  },

  async fetchTreesFromDb(): Promise<Tree[] | null> {
    try {
      await this.initSchema()
      const rows = await sql`SELECT * FROM trees ORDER BY captured_at DESC;`
      if (!rows || rows.length === 0) return null
      return rows.map((r: any) => ({
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
    } catch (err) {
      console.warn('Neon Postgres fetch error:', err)
      return null
    }
  },

  async upsertUser(user: { email: string; fullName?: string; passwordHash?: string; institution?: string; ieeeId?: string }) {
    try {
      await this.initSchema()
      const email = user.email.toLowerCase().trim()
      await sql`
        INSERT INTO users (email, full_name, password_hash, institution, ieee_id)
        VALUES (${email}, ${user.fullName || ''}, ${user.passwordHash || ''}, ${user.institution || ''}, ${user.ieeeId || ''})
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), users.password_hash),
          institution = EXCLUDED.institution,
          ieee_id = EXCLUDED.ieee_id;
      `
    } catch (err) {
      console.warn('Neon Postgres user upsert error:', err)
    }
  },

  async getUser(email: string) {
    try {
      await this.initSchema()
      const e = email.toLowerCase().trim()
      const rows = await sql`SELECT * FROM users WHERE LOWER(email) = ${e} LIMIT 1;`
      return rows && rows.length > 0 ? rows[0] : null
    } catch {
      return null
    }
  },
}
