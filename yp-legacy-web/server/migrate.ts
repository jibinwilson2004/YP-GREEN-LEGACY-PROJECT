import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { config } from './config'

export async function runMigrations(): Promise<{ success: boolean; applied: string[] }> {
  console.log('========================================================')
  console.log(' IEEE YP Green Legacy — Database Migration Runner')
  console.log('========================================================')

  if (!config.databaseUrl) {
    console.warn('[Migrate] No DATABASE_URL specified in environment. Skipping Neon migrations.')
    return { success: false, applied: [] }
  }

  const sql = neon(config.databaseUrl)
  const applied: string[] = []

  try {
    // 1. Ensure migration tracking table exists
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 2. Query already applied migrations
    const recordedRows = await sql`SELECT version FROM schema_migrations ORDER BY version ASC;`
    const recordedVersions = new Set(recordedRows.map((r: any) => r.version))

    // 3. Read migration files
    const migrationsDir = path.resolve(process.cwd(), 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`[Migrate] Migrations directory not found at ${migrationsDir}`)
      return { success: true, applied: [] }
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (recordedVersions.has(file)) {
        console.log(`[Migrate] Skipping already applied: ${file}`)
        continue
      }

      console.log(`[Migrate] Applying migration: ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const sqlContent = fs.readFileSync(filePath, 'utf-8')

      // Split statements cleanly
      const statements = sqlContent
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      for (const stmt of statements) {
        await sql(stmt)
      }

      // Record migration
      await sql`INSERT INTO schema_migrations (version) VALUES (${file});`
      applied.push(file)
      console.log(`✓ [Migrate] Successfully applied ${file}`)
    }

    console.log('--------------------------------------------------------')
    console.log(`✓ Migration run completed. ${applied.length} new migrations applied.`)
    console.log('--------------------------------------------------------')
    return { success: true, applied }
  } catch (err: any) {
    console.error('[Migrate Error] Migration execution failed:', err.message)
    throw err
  }
}

// Allow direct CLI invocation: tsx server/migrate.ts
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then((res) => {
      process.exit(res.success ? 0 : 1)
    })
    .catch(() => {
      process.exit(1)
    })
}
