import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { authService } from './services/authService'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })))
const CapturePage = lazy(() => import('./pages/CapturePage').then((m) => ({ default: m.CapturePage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const TreesPage = lazy(() => import('./pages/TreesPage').then((m) => ({ default: m.TreesPage })))
const TreeDetailPage = lazy(() => import('./pages/TreeDetailPage').then((m) => ({ default: m.TreeDetailPage })))
const ContestPage = lazy(() => import('./pages/ContestPage').then((m) => ({ default: m.ContestPage })))
const SignUpPage = lazy(() => import('./pages/SignUpPage').then((m) => ({ default: m.SignUpPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
      Loading…
    </div>
  )
}

function ProtectedPage({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const user = authService.getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/contest" element={<ContestPage />} />
          <Route path="/capture" element={<ProtectedPage><CapturePage /></ProtectedPage>} />
          <Route path="/profile" element={<ProtectedPage><ProfilePage /></ProtectedPage>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/trees" element={<TreesPage />} />
          <Route path="/my-trees" element={<TreesPage />} />
          <Route path="/trees/:id" element={<TreeDetailPage />} />
          <Route path="/admin" element={<ProtectedPage admin><AdminPage /></ProtectedPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
