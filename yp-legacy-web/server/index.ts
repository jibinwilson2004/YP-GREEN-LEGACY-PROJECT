import { app } from './app'
import { config } from './config'
import { initDb, db } from './db'
import { hashPassword } from './services/auth'

async function bootstrap() {
  console.log('--------------------------------------------------')
  console.log(' IEEE YP Green Legacy Server Starting...')
  console.log('--------------------------------------------------')

  await initDb()

  // Bootstrap Admin Account
  try {
    const adminEmail = config.admin.email
    const existingAdmin = await db.getUserByEmail(adminEmail)
    if (!existingAdmin) {
      if (config.admin.initialPassword && config.admin.initialPassword.length >= 4) {
        const hashed = await hashPassword(config.admin.initialPassword)
        await db.createUser({
          email: adminEmail,
          full_name: 'Administrator',
          password_hash: hashed,
          role: 'admin',
          institution: 'IEEE YP CSTF Central Administration',
        })
        console.log(`[Bootstrap] Created initial admin account for ${adminEmail}`)
      } else {
        console.warn('[Bootstrap Security Notice] No initial admin account created. Set ADMIN_INITIAL_PASSWORD or run seed command to configure admin.')
      }
    }
  } catch (err) {
    console.warn('[Bootstrap Admin Warning]', err)
  }

  // Seed default demonstration trees if database has no records
  try {
    const stats = await db.getStats()
    if (stats.totalTrees === 0) {
      const baseTrees = [
        {
          id: 'YP-000001',
          species: 'Azadirachta indica',
          commonName: 'Neem',
          botanicalName: 'Azadirachta indica',
          imageUrl: '/assets/images/tree-sapling.png',
          images: [
            '/assets/images/tree-sapling.png',
            '/assets/images/hero-misty-forest.png',
            '/assets/images/pine-forest-aerial.png',
          ],
          latitude: 10.0528,
          longitude: 76.6346,
          accuracy: 4.2,
          altitude: 48.5,
          gpsSource: 'SMARTPHONE_GPS' as const,
          locationConfidence: 96,
          locationStatus: 'HIGH' as const,
          readingCount: 12,
          stabilityScore: 96,
          gpsStability: 'STABLE',
          capturedAt: '2026-08-31T10:30:00.000Z',
          dateOfPlanting: '31-08-2026',
          updatedAt: '31-08-2026',
          student: 'SORNA SAKTHI GANESH V',
          college: 'GOVT. ENGINEERING COLLEGE, BARTON HILL-TRV',
          cluster: 'TRV',
          institution: 'APJAKTU NSSCELL NRPF',
          userId: 'sorna-sakthi-ganesh',
          verificationStatus: 'VERIFIED' as const,
          verifiedBy: 'IEEE YP CSTF',
          verificationDate: '31-08-2026',
          identificationConfidence: 91,
        },
        {
          id: 'YP-002849',
          species: 'Terminalia arjuna',
          commonName: 'Arjuna',
          botanicalName: 'Terminalia arjuna',
          imageUrl: '/assets/images/hero-misty-forest.png',
          latitude: 9.9312,
          longitude: 76.2673,
          accuracy: 5.1,
          altitude: 12.0,
          gpsSource: 'SMARTPHONE_GPS' as const,
          locationConfidence: 88,
          locationStatus: 'HIGH' as const,
          readingCount: 10,
          stabilityScore: 82,
          capturedAt: '2026-09-01T08:15:00.000Z',
          dateOfPlanting: '01-09-2026',
          updatedAt: '01-09-2026',
          student: 'Aswin Kumar',
          college: 'College of Engineering Trivandrum',
          institution: 'IEEE Kerala Section',
          userId: 'aswin-kumar',
          verificationStatus: 'VERIFIED' as const,
          verifiedBy: 'IEEE YP CSTF',
          verificationDate: '01-09-2026',
          identificationConfidence: 89,
        },
        {
          id: 'YP-008924',
          species: 'Swietenia mahagoni',
          commonName: 'Mahogany',
          botanicalName: 'Swietenia mahagoni',
          imageUrl: '/assets/images/pine-forest-aerial.png',
          latitude: 11.6854,
          longitude: 76.132,
          accuracy: 6.3,
          altitude: 720.0,
          gpsSource: 'SMARTPHONE_GPS' as const,
          locationConfidence: 84,
          locationStatus: 'MEDIUM' as const,
          readingCount: 9,
          stabilityScore: 78,
          capturedAt: '2026-09-10T11:45:00.000Z',
          dateOfPlanting: '10-09-2026',
          updatedAt: '10-09-2026',
          student: 'Devika Nair',
          college: 'National Institute of Technology Calicut',
          institution: 'IEEE Malabar Subsection',
          userId: 'devika-nair',
          verificationStatus: 'PENDING' as const,
          identificationConfidence: 84,
        },
      ]

      for (const t of baseTrees) {
        await db.upsertTree(t)
      }
      console.log(`[Bootstrap] Seeded ${baseTrees.length} demonstration trees.`)
    }
  } catch (err) {
    console.warn('[Bootstrap Seed Trees Warning]', err)
  }

  app.listen(config.port, () => {
    console.log(`✓ IEEE YP Green Legacy API Server listening on http://127.0.0.1:${config.port}`)
  })
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]', err)
  process.exit(1)
})
