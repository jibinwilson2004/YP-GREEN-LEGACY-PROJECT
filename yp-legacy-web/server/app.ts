import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { authRoutes, handleSendOtp, handleVerifyOtp } from './routes/authRoutes'
import { treeRoutes } from './routes/treeRoutes'
import { photoRoutes } from './routes/photoRoutes'
import { statsRoutes, handleSendPartnerRequest, handleNotifyTreeTag } from './routes/statsRoutes'
import { db } from './db'
import { googleDriveStorage } from './services/googleDriveStorage'

export const app = express()

// Security & Parsing
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// Health Check
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'IEEE YP Green Legacy Telemetry & API Server',
    database_connected: db.isConnected(),
    google_drive_configured: googleDriveStorage.isConfigured(),
    timestamp: new Date().toISOString(),
  })
})

// Core API Routers
app.use('/api/auth', authRoutes)
app.use('/api/trees', treeRoutes)
app.use('/api/photos', photoRoutes)
app.use('/api', statsRoutes)

// Backward compatibility with previous Python microservice endpoints
app.post('/api/send-otp', handleSendOtp)
app.post('/api/verify-otp', handleVerifyOtp)
app.post('/api/send-partner-request', handleSendPartnerRequest)
app.post('/api/notify-tree-tag', handleNotifyTreeTag)

// 404 Handler for unmatched /api requests
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})
