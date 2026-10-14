import { Router, type Request, type Response } from 'express'
import { db } from '../db'
import { emailService } from '../services/emailService'

const router = Router()

// 1. GET /api/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await db.getStats()
    return res.json(stats)
  } catch (err: any) {
    console.error('[GET /api/stats Error]', err)
    return res.status(500).json({ error: 'Failed to retrieve stats.' })
  }
})

// 2. GET /api/participants (Leaderboard)
router.get('/participants', async (req: Request, res: Response) => {
  try {
    const users = await db.getAllUsers()
    const { trees } = await db.getTrees({ limit: 1000 })

    const statsMap = new Map<string, any>()
    for (const u of users) {
      const e = u.email.toLowerCase()
      statsMap.set(e, {
        userId: u.email,
        displayName: u.full_name,
        fullName: u.full_name,
        institution: u.institution,
        registeredAt: u.created_at,
        treeCount: 0,
        pendingCount: 0,
        verifiedCount: 0,
      })
    }

    for (const t of trees) {
      if (!t.userId) continue
      const e = t.userId.toLowerCase()
      let item = statsMap.get(e)
      if (!item) {
        item = {
          userId: t.userId,
          displayName: t.student || t.userId,
          fullName: t.student || t.userId,
          institution: t.institution || t.college,
          treeCount: 0,
          pendingCount: 0,
          verifiedCount: 0,
        }
        statsMap.set(e, item)
      }
      item.treeCount += 1
      if (t.verificationStatus === 'PENDING') item.pendingCount += 1
      if (t.verificationStatus === 'VERIFIED') item.verifiedCount += 1
    }

    const list = Array.from(statsMap.values()).sort((a, b) => b.treeCount - a.treeCount)
    return res.json(list)
  } catch (err: any) {
    console.error('[GET /api/participants Error]', err)
    return res.status(500).json({ error: 'Failed to retrieve participant stats.' })
  }
})

// 3. POST /api/send-partner-request
const handleSendPartnerRequest = async (req: Request, res: Response) => {
  try {
    const { orgName, contactName, email, phone, orgType, message } = req.body
    if (!orgName || !email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Organisation name and valid email are required.' })
    }

    emailService.sendPartnerRequest({
      orgName: String(orgName).trim(),
      contactName: String(contactName || '').trim(),
      email: String(email).trim(),
      phone: String(phone || '').trim(),
      orgType: String(orgType || '').trim(),
      message: String(message || '').trim(),
    }).catch(() => {})

    return res.json({ success: true, message: 'Partner request sent successfully!' })
  } catch (err: any) {
    console.error('[Send Partner Request Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to send partner request.' })
  }
}
router.post('/send-partner-request', handleSendPartnerRequest)

// 4. POST /api/notify-tree-tag
const handleNotifyTreeTag = async (req: Request, res: Response) => {
  try {
    const { treeId, species, planter, latitude, longitude } = req.body
    if (treeId) {
      emailService.notifyAdminNewTreeTag(
        String(treeId),
        String(species || 'Tree'),
        String(planter || 'Planter'),
        Number(latitude || 0),
        Number(longitude || 0)
      ).catch(() => {})
    }
    return res.json({ success: true, message: `Admin notified of tree tag ${treeId}` })
  } catch (err: any) {
    console.error('[Notify Tree Tag Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to notify admin.' })
  }
}
router.post('/notify-tree-tag', handleNotifyTreeTag)

export { router as statsRoutes, handleSendPartnerRequest, handleNotifyTreeTag }
