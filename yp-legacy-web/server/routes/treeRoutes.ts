import { Router, type Request, type Response } from 'express'
import { db, haversineDistanceM } from '../db'
import { optionalAuth, requireAdmin } from '../services/auth'
import { emailService } from '../services/emailService'
import type { Tree } from '../../src/types/tree'

const router = Router()

// 1. GET /api/trees
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 20
    const search = req.query.search as string
    const species = req.query.species as string
    const status = req.query.status as string
    const userId = req.query.userId as string

    // Viewport coordinates
    const minLat = req.query.minLat !== undefined ? parseFloat(req.query.minLat as string) : undefined
    const maxLat = req.query.maxLat !== undefined ? parseFloat(req.query.maxLat as string) : undefined
    const minLng = req.query.minLng !== undefined ? parseFloat(req.query.minLng as string) : undefined
    const maxLng = req.query.maxLng !== undefined ? parseFloat(req.query.maxLng as string) : undefined

    const result = await db.getTrees({
      page,
      limit,
      search,
      species,
      status,
      userId,
      minLat,
      maxLat,
      minLng,
      maxLng,
    })

    return res.json(result)
  } catch (err: any) {
    console.error('[GET /api/trees Error]', err)
    return res.status(500).json({ error: 'Failed to retrieve tree records.' })
  }
})

// 2. GET /api/trees/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tree = await db.getTreeById(id)
    if (!tree) {
      return res.status(404).json({ error: `Tree record #${id} not found.` })
    }

    // Attach photos from photos table
    const photos = await db.getPhotosByTreeId(id)
    const galleryUrls = photos.map((p) => `/api/photos/${p.id}/content`)
    if (galleryUrls.length > 0) {
      tree.images = Array.from(new Set([...(tree.images || []), ...galleryUrls]))
      if (!tree.imageUrl) tree.imageUrl = galleryUrls[0]
    }

    return res.json(tree)
  } catch (err: any) {
    console.error('[GET /api/trees/:id Error]', err)
    return res.status(500).json({ error: 'Failed to retrieve tree detail.' })
  }
})

// 3. POST /api/trees (Register tree with independent server-side GPS validation)
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const treeData = req.body as Partial<Tree> & { submissionKey?: string; readings?: any[] }
    const submissionKey = treeData.submissionKey || treeData.id

    // Idempotency: prevent duplicates on offline queue retry
    if (submissionKey) {
      const existingBySubKey = await db.getTreeBySubmissionKey(submissionKey)
      if (existingBySubKey) {
        return res.status(200).json(existingBySubKey)
      }
    }
    if (treeData.id) {
      const existing = await db.getTreeById(treeData.id)
      if (existing) {
        return res.status(200).json(existing)
      }
    }

    // 1. Basic validation
    if (!treeData.species || !treeData.species.trim()) {
      return res.status(400).json({ error: 'Tree species is required.' })
    }

    const lat = Number(treeData.latitude)
    const lng = Number(treeData.longitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Invalid latitude coordinate. Must be between -90 and 90.' })
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid longitude coordinate. Must be between -180 and 180.' })
    }

    const accuracy = Number(treeData.accuracy ?? 5.0)
    if (isNaN(accuracy) || accuracy < 0) {
      return res.status(400).json({ error: 'Accuracy must be a non-negative number.' })
    }
    if (accuracy > 50) {
      return res.status(400).json({ error: 'GPS accuracy too low (> 50m). Clear line-of-sight to satellites is required.' })
    }

    // 2. Authoritative server-side GPS verification (independent of client assertions)
    let calculatedAccuracy = accuracy
    let calculatedStability = Math.max(0, Math.min(100, Number(treeData.stabilityScore || 80)))
    let readingCount = Math.max(1, Number(treeData.readingCount || 1))

    if (Array.isArray(treeData.readings) && treeData.readings.length > 0) {
      const validReadings = treeData.readings.filter(
        (r) =>
          typeof r.latitude === 'number' &&
          typeof r.longitude === 'number' &&
          typeof r.accuracy === 'number' &&
          r.latitude >= -90 &&
          r.latitude <= 90 &&
          r.longitude >= -180 &&
          r.longitude <= 180
      )
      if (validReadings.length > 0) {
        readingCount = validReadings.length
        const sortedAcc = validReadings.map((r) => r.accuracy).sort((a: number, b: number) => a - b)
        calculatedAccuracy = sortedAcc[Math.floor(sortedAcc.length / 2)]

        const avgLat = validReadings.reduce((sum, r) => sum + r.latitude, 0) / readingCount
        const avgLng = validReadings.reduce((sum, r) => sum + r.longitude, 0) / readingCount
        const maxDispersionM = Math.max(
          ...validReadings.map((r) => haversineDistanceM(avgLat, avgLng, r.latitude, r.longitude))
        )
        calculatedStability = Math.max(0, Math.min(100, Math.round(100 - maxDispersionM * 10)))
      }
    }

    // Authoritative confidence formula: 45% stability, 45% accuracy, 10% sample depth
    const accuracyScore = Math.max(0, Math.min(100, Math.round(100 - calculatedAccuracy * 2.5)))
    const countScore = Math.min(100, readingCount * 10)
    const serverConfidence = Math.max(
      0,
      Math.min(100, Math.round(calculatedStability * 0.45 + accuracyScore * 0.45 + countScore * 0.1))
    )

    let serverLocationStatus: 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED'
    if (calculatedAccuracy > 50 || serverConfidence < 40) {
      serverLocationStatus = 'REJECTED'
    } else if (calculatedAccuracy <= 6 && serverConfidence >= 80 && calculatedStability >= 70) {
      serverLocationStatus = 'HIGH'
    } else if (calculatedAccuracy <= 16 && serverConfidence >= 60) {
      serverLocationStatus = 'MEDIUM'
    } else {
      serverLocationStatus = 'LOW'
    }

    if (serverLocationStatus === 'REJECTED') {
      return res.status(400).json({
        error: 'GPS evidence verification rejected: signal accuracy or stability below acceptable threshold.',
        serverConfidence,
        serverAccuracy: calculatedAccuracy,
      })
    }

    // 3. Anti-spoofing / Duplicate detection
    const duplicateTree = await db.checkDuplicateLocation(lat, lng, 3.0)
    let verificationStatus: Tree['verificationStatus'] = 'PENDING'
    let adminNote = treeData.adminNote || ''

    if (duplicateTree && duplicateTree.id !== treeData.id) {
      verificationStatus = 'FLAGGED'
      adminNote = `[Anomaly Warning] Registered within 3m of existing tree #${duplicateTree.id}. Marked for review.`
    }

    const todayStr = new Date().toLocaleDateString('en-IN')
    const finalTree: Tree = {
      id: treeData.id || `YP-${Date.now().toString().slice(-6)}`,
      species: treeData.species.trim(),
      commonName: treeData.commonName?.trim() || treeData.species.trim(),
      botanicalName: treeData.botanicalName?.trim() || treeData.species.trim(),
      imageUrl: treeData.imageUrl || '',
      images: treeData.images || (treeData.imageUrl ? [treeData.imageUrl] : []),
      latitude: lat,
      longitude: lng,
      accuracy: calculatedAccuracy,
      altitude: Number(treeData.altitude || 0),
      gpsSource: treeData.gpsSource || 'SMARTPHONE_GPS',
      locationConfidence: serverConfidence,
      locationStatus: serverLocationStatus,
      readingCount,
      stabilityScore: calculatedStability,
      gpsStability: calculatedStability >= 70 ? 'STABLE' : 'UNSTABLE',
      capturedAt: treeData.capturedAt || new Date().toISOString(),
      dateOfPlanting: treeData.dateOfPlanting || todayStr,
      updatedAt: todayStr,
      student: treeData.student || req.user?.displayName || 'IEEE YP CSTF Planter',
      college: treeData.college || 'IEEE YP Green Legacy Campus Unit',
      cluster: treeData.cluster || 'IEEE-YP',
      institution: treeData.institution || 'APJAKTU NSSCELL NRPF',
      userId: req.user?.email || treeData.userId || 'anonymous-planter',
      verificationStatus,
      identificationConfidence: Number(treeData.identificationConfidence || 90),
      adminNote,
    }

    const saved = await db.upsertTree(finalTree, submissionKey)

    // Notify administrator in background
    emailService.notifyAdminNewTreeTag(
      saved.id,
      saved.species,
      saved.student || saved.userId || 'Planter',
      saved.latitude,
      saved.longitude
    ).catch(() => {})

    return res.status(201).json(saved)
  } catch (err: any) {
    console.error('[POST /api/trees Error]', err)
    return res.status(500).json({ error: 'Failed to register tree record.' })
  }
})

// 4. POST /api/trees/:id/review (Approve or Reject tree)
router.post('/:id/review', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, adminNote } = req.body

    if (!['VERIFIED', 'REJECTED', 'FLAGGED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status.' })
    }

    const tree = await db.getTreeById(id)
    if (!tree) {
      return res.status(404).json({ error: `Tree #${id} not found.` })
    }

    tree.verificationStatus = status
    tree.verifiedBy = req.user?.displayName || 'IEEE YP CSTF Admin'
    tree.verificationDate = new Date().toLocaleDateString('en-IN')
    if (adminNote !== undefined) tree.adminNote = adminNote

    const updated = await db.upsertTree(tree)
    return res.json({ success: true, tree: updated })
  } catch (err: any) {
    console.error('[POST /api/trees/:id/review Error]', err)
    return res.status(500).json({ error: 'Failed to review tree record.' })
  }
})

// 5. DELETE /api/trees/:id (Delete tree)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = await db.deleteTree(id)
    if (!success) {
      return res.status(404).json({ error: `Tree #${id} not found.` })
    }
    return res.json({ success: true, message: `Tree #${id} permanently deleted.` })
  } catch (err: any) {
    console.error('[DELETE /api/trees/:id Error]', err)
    return res.status(500).json({ error: 'Failed to delete tree record.' })
  }
})

export { router as treeRoutes }
