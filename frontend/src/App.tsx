import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './components/features/auth/LoginPage'
import RegisterPage from './components/features/auth/RegisterPage'
import DashboardPage from './components/features/dashboard/DashboardPage'
import TripDetailPage from './components/features/trips/TripDetailPage'
import DiscoveryAuthShellPage from './components/features/discovery/DiscoveryAuthShellPage'
import { NotFoundPage } from './components/shared/NotFoundPage'

function PublicRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  const token = useAuthStore((s) => s.token)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={token ? <DashboardPage /> : <DiscoveryAuthShellPage />}
        />
        <Route path="/discover" element={<DiscoveryAuthShellPage />} />
        <Route
          path="/trips/:id"
          element={<TripDetailPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
