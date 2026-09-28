import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

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

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/contest" element={<ContestPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/trees" element={<TreesPage />} />
          <Route path="/trees/:id" element={<TreeDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
