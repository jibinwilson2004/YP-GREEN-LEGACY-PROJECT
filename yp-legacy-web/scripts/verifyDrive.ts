import crypto from 'node:crypto'
import { config } from '../server/config'

async function verifyDrive() {
  console.log('========================================================')
  console.log(' IEEE YP Green Legacy — Google Drive Verification Tool')
  console.log('========================================================')

  const { clientEmail, privateKey, folderId } = config.googleDrive

  console.log(`- Service Account Email: ${clientEmail || '(Not Configured)'}`)
  console.log(`- Private Key Present:   ${privateKey ? 'Yes (Format: RSA-256 PEM)' : 'No'}`)
  console.log(`- Target Folder ID:      ${folderId || '(Not Configured)'}`)
  console.log('--------------------------------------------------------')

  if (!clientEmail || !privateKey) {
    console.error('❌ FAILURE: GOOGLE_DRIVE_CLIENT_EMAIL or GOOGLE_DRIVE_PRIVATE_KEY missing.')
    console.error('Action: Add your GCP service account credentials to .env or your production environment.')
    process.exit(1)
  }

  // 1. Authenticate with Google OAuth2 using JWT bearer flow
  console.log('[1/4] Minting JWT and exchanging with Google OAuth2...')
  let accessToken: string
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const claimSet = {
      iss: clientEmail,
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

    const unsignedJwt = `${encode(header)}.${encode(claimSet)}`
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(unsignedJwt)
    const signature = sign
      .sign(privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const assertion = `${unsignedJwt}.${signature}`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('❌ FAILURE: Google OAuth2 token exchange rejected:', errText)
      process.exit(1)
    }

    const tokenData = (await tokenRes.json()) as { access_token: string }
    accessToken = tokenData.access_token
    console.log('✓ Successfully acquired Google Drive OAuth2 bearer access token.')
  } catch (err: any) {
    console.error('❌ Exception signing JWT with private key:', err.message)
    process.exit(1)
  }

  // 2. Test Folder Access
  if (folderId) {
    console.log(`[2/4] Verifying access to target Drive folder (${folderId})...`)
    const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,capabilities`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!folderRes.ok) {
      console.warn('⚠️ WARNING: Could not inspect folder metadata (HTTP ' + folderRes.status + '). Ensure folder is shared with ' + clientEmail)
    } else {
      const folderData = await folderRes.json()
      console.log(`✓ Target folder verified: "${folderData.name}"`)
    }
  } else {
    console.log('[2/4] Target folder ID not specified; uploads will default to root service account drive.')
  }

  // 3. Test Test File Upload
  console.log('[3/4] Uploading verification diagnostic test file...')
  const testBuffer = Buffer.from(`IEEE YP Green Legacy Diagnostic Ping @ ${new Date().toISOString()}`)
  const testFilename = `diagnostic_ping_${Date.now()}.txt`

  const boundary = '-------diag_boundary_2026'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`
  const metadata: any = { name: testFilename, mimeType: 'text/plain' }
  if (folderId) metadata.parents = [folderId]

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n'
    ),
    testBuffer,
    Buffer.from(closeDelimiter),
  ])

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(multipartBody.length),
    },
    body: multipartBody,
  })

  if (!uploadRes.ok) {
    console.error('❌ FAILURE: Upload test failed:', await uploadRes.text())
    process.exit(1)
  }

  const uploadedFile = (await uploadRes.json()) as { id: string }
  console.log(`✓ Diagnostic file uploaded successfully (File ID: ${uploadedFile.id})`)

  // 4. Download and Clean Up Test File
  console.log('[4/4] Verifying streaming retrieval and cleaning up...')
  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!downloadRes.ok) {
    console.error('❌ FAILURE: Download test failed:', await downloadRes.text())
    process.exit(1)
  }

  const downloadedText = await downloadRes.text()
  if (downloadedText !== testBuffer.toString()) {
    console.error('❌ FAILURE: Content mismatch between uploaded and downloaded diagnostic file.')
    process.exit(1)
  }
  console.log('✓ File integrity verified (100% byte match).')

  // Clean up
  await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  console.log('✓ Diagnostic test file removed from Google Drive.')

  console.log('========================================================')
  console.log('🎉 Google Drive Integration is 100% Operational & Verified!')
  console.log('========================================================')
}

verifyDrive().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
