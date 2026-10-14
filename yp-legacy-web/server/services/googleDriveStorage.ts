import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { config } from '../config'

export interface UploadResult {
  fileId: string
  provider: 'google_drive' | 'local'
  mimeType: string
  fileSize: number
  publicUrl?: string
}

function resolveUploadsDir(): string {
  try {
    const localDir = path.resolve(process.cwd(), 'server', 'uploads')
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true })
    }
    fs.accessSync(localDir, fs.constants.W_OK)
    return localDir
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'yp-legacy-uploads')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }
    return tmpDir
  }
}

const UPLOADS_DIR = resolveUploadsDir()

// Minimal JWT minting for Google Service Account token
async function getGoogleServiceAccountToken(): Promise<string | null> {
  if (!config.googleDrive.clientEmail || !config.googleDrive.privateKey) {
    return null
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const claimSet = {
      iss: config.googleDrive.clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    const encode = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

    const encodedHeader = encode(header)
    const encodedClaim = encode(claimSet)
    const unsignedJwt = `${encodedHeader}.${encodedClaim}`

    const sign = crypto.createSign('RSA-SHA256')
    sign.update(unsignedJwt)
    const signature = sign
      .sign(config.googleDrive.privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const assertion = `${unsignedJwt}.${signature}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    if (!res.ok) {
      console.warn('[Google Drive Auth] Token exchange failed:', await res.text())
      return null
    }

    const data = (await res.json()) as { access_token: string }
    return data.access_token
  } catch (err) {
    console.warn('[Google Drive Auth Error]', err)
    return null
  }
}

export const googleDriveStorage = {
  isConfigured(): boolean {
    return Boolean(
      (config.googleDrive.clientEmail && config.googleDrive.privateKey) ||
      (config.googleDrive.clientId && config.googleDrive.refreshToken)
    )
  },

  async uploadPhoto(
    buffer: Buffer,
    filename: string,
    mimeType = 'image/jpeg'
  ): Promise<UploadResult> {
    const token = await getGoogleServiceAccountToken()

    if (token) {
      try {
        const metadata: any = {
          name: filename,
          mimeType,
        }
        if (config.googleDrive.folderId) {
          metadata.parents = [config.googleDrive.folderId]
        }

        const boundary = '-------314159265358979323846'
        const delimiter = `\r\n--${boundary}\r\n`
        const closeDelimiter = `\r\n--${boundary}--`

        const multipartBody = Buffer.concat([
          Buffer.from(
            delimiter +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              `Content-Type: ${mimeType}\r\n\r\n`
          ),
          buffer,
          Buffer.from(closeDelimiter),
        ])

        const res = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
              'Content-Length': String(multipartBody.length),
            },
            body: multipartBody,
          }
        )

        if (res.ok) {
          const driveFile = (await res.json()) as { id: string }
          console.log(`[Google Drive] Uploaded file ${driveFile.id} (${filename})`)
          return {
            fileId: driveFile.id,
            provider: 'google_drive',
            mimeType,
            fileSize: buffer.length,
          }
        } else {
          console.warn('[Google Drive Upload Failed, using local fallback]:', await res.text())
        }
      } catch (err) {
        console.warn('[Google Drive Upload Exception, using local fallback]:', err)
      }
    }

    // Local Disk Fallback
    if (config.nodeEnv === 'production') {
      console.warn(
        `[STORAGE WARNING] Cloud storage is unconfigured or failed. Photo written to ephemeral disk (${UPLOADS_DIR}). It will not persist across container cold starts or redeployments.`
      )
    }

    const localId = `local_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg'
    const filePath = path.join(UPLOADS_DIR, `${localId}${ext}`)
    fs.writeFileSync(filePath, buffer)

    return {
      fileId: `${localId}${ext}`,
      provider: 'local',
      mimeType,
      fileSize: buffer.length,
      publicUrl: `/api/photos/${localId}${ext}/content`,
    }
  },

  async getPhotoStream(
    fileId: string,
    provider: 'google_drive' | 'local'
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (provider === 'google_drive') {
      const token = await getGoogleServiceAccountToken()
      if (token) {
        try {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer()
            const mimeType = res.headers.get('content-type') || 'image/jpeg'
            return { buffer: Buffer.from(arrayBuf), mimeType }
          }
        } catch (err) {
          console.warn('[Google Drive Fetch Failed]', err)
        }
      }
    }

    // Check local storage directory
    const localPath = path.join(UPLOADS_DIR, fileId)
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath)
      const mimeType = fileId.endsWith('.png') ? 'image/png' : fileId.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
      return { buffer, mimeType }
    }

    return null
  },
}
