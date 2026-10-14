import { Router, type Request, type Response } from 'express'
import { db } from '../db'
import { googleDriveStorage } from '../services/googleDriveStorage'
import { optionalAuth } from '../services/auth'

const router = Router()

// 1. POST /api/photos/upload
router.post('/upload', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { treeId, imageBase64, mimeType = 'image/jpeg', role = 'primary' } = req.body

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 payload is required.' })
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // File size limit: 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds maximum 10MB limit.' })
    }

    // Supported formats check
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image format. Allowed: JPEG, PNG, WebP.' })
    }

    const filename = `tree_${treeId || 'capture'}_${Date.now()}.jpg`
    const uploadResult = await googleDriveStorage.uploadPhoto(buffer, filename, mimeType)

    // Save to PostgreSQL tree_photos
    const uploaderId = req.user?.email || 'field-worker'
    const photoRecord = await db.createPhoto({
      tree_id: treeId || 'pending',
      storage_provider: uploadResult.provider,
      storage_file_id: uploadResult.fileId,
      photo_role: role as any,
      mime_type: mimeType,
      file_size: buffer.length,
      uploader_id: uploaderId,
      is_public: false, // private until approved
      upload_status: 'completed',
    })

    const deliveryUrl = `/api/photos/${photoRecord.id}/content`

    // If associated with a tree, update the tree's image_url
    if (treeId && treeId !== 'pending') {
      const tree = await db.getTreeById(treeId)
      if (tree) {
        if (!tree.imageUrl || role === 'primary') {
          tree.imageUrl = deliveryUrl
        }
        tree.images = Array.from(new Set([...(tree.images || []), deliveryUrl]))
        await db.upsertTree(tree)
      }
    }

    return res.status(201).json({
      success: true,
      photo: {
        id: photoRecord.id,
        treeId: photoRecord.tree_id,
        url: deliveryUrl,
        storageProvider: uploadResult.provider,
        fileSize: buffer.length,
        mimeType,
      },
    })
  } catch (err: any) {
    console.error('[Photo Upload Error]', err)
    return res.status(500).json({ error: 'Photo upload processing failed.' })
  }
})

// 2. GET /api/photos/:id/content (Authorized Image Delivery)
router.get('/:id/content', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    let photo = await db.getPhotoById(id)
    let fileId = id
    let provider: 'google_drive' | 'local' = 'local'

    if (photo) {
      fileId = photo.storage_file_id
      provider = photo.storage_provider

      // Access permission verification:
      // Photos for VERIFIED trees or explicitly public photos are accessible to all.
      let isAllowed = photo.is_public
      if (!isAllowed) {
        const tree = await db.getTreeById(photo.tree_id)
        if (tree && tree.verificationStatus === 'VERIFIED') {
          isAllowed = true
        } else {
          // Unverified / pending tree photo: must be uploader or admin
          const isUploader =
            req.user &&
            photo.uploader_id &&
            req.user.email.toLowerCase() === photo.uploader_id.toLowerCase()
          const isAdmin = req.user?.role === 'admin'
          if (isUploader || isAdmin) {
            isAllowed = true
          }
        }
      }

      if (!isAllowed) {
        return res.status(403).json({
          error: 'Access denied. Photographic evidence for unverified trees is restricted to the original planter and administrators.',
          status: 'UNAUTHORIZED_ACCESS',
        })
      }
    }

    const streamData = await googleDriveStorage.getPhotoStream(fileId, provider)
    if (!streamData) {
      return res.status(404).json({ error: 'Photo not found in storage.' })
    }

    res.setHeader('Content-Type', streamData.mimeType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200')
    res.setHeader('Content-Length', streamData.buffer.length)
    return res.end(streamData.buffer)
  } catch (err: any) {
    console.error('[GET Photo Content Error]', err)
    return res.status(500).json({ error: 'Failed to retrieve photo.' })
  }
})

export { router as photoRoutes }
