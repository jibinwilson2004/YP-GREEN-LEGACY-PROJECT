import fs from 'node:fs'
import path from 'node:path'

// Minimal .env loader if dotenv is not present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}
loadEnv()

export const config = {
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FATAL: JWT_SECRET environment variable is required in production mode.')
        })()
      : 'ieee-yp-green-legacy-fallback-secret-2026'),

  // Google Drive configuration
  googleDrive: {
    clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '',
    privateKey: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '',
  },

  // Gmail SMTP credentials (empty fallbacks require explicit env configuration)
  smtp: {
    user: process.env.GMAIL_ADDRESS || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
    adminRecipient: process.env.ADMIN_NOTIFY_EMAIL || '',
  },

  // Admin user bootstrap (no weak default passwords in production)
  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@ieee-yp.org').toLowerCase(),
    initialPassword: process.env.ADMIN_INITIAL_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin'),
  },
}
