import crypto from 'node:crypto'
import { db, initDb } from '../server/db'
import { hashPassword } from '../server/services/auth'
import { config } from '../server/config'

async function seedAdmin() {
  console.log('========================================================')
  console.log(' IEEE YP Green Legacy — Administrator Bootstrap Utility')
  console.log('========================================================')

  await initDb()

  const adminEmail = process.argv[2]?.toLowerCase() || config.admin.email
  let adminPassword = process.argv[3] || config.admin.initialPassword

  if (!adminPassword || adminPassword === 'admin') {
    // Generate secure random 16-character password if none provided or if weak
    adminPassword = crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, 'x')
    console.log('🔑 Generated secure random administrator password.')
  }

  const existing = await db.getUserByEmail(adminEmail)
  const hashed = await hashPassword(adminPassword)

  if (existing) {
    await db.updateUserPassword(adminEmail, hashed)
    console.log(`✓ Updated password for existing administrator: ${adminEmail}`)
  } else {
    await db.createUser({
      email: adminEmail,
      full_name: 'IEEE YP Administrator',
      password_hash: hashed,
      role: 'admin',
      institution: 'IEEE YP CSTF Central Administration',
    })
    console.log(`✓ Created new administrator account for: ${adminEmail}`)
  }

  console.log('--------------------------------------------------------')
  console.log('ADMINISTRATOR CREDENTIALS:')
  console.log(`Email:    ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log('--------------------------------------------------------')
  console.log('⚠️ Store these credentials securely. They will not be displayed again.')
  console.log('========================================================')
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err)
  process.exit(1)
})
