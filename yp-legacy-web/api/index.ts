import { app } from '../server/app'
import { initDb } from '../server/db'

// Initialize DB on cold start
let initPromise: Promise<boolean> | null = null
function ensureDb() {
  if (!initPromise) {
    initPromise = initDb()
  }
  return initPromise
}

export default async function handler(req: any, res: any) {
  await ensureDb()
  return app(req, res)
}
