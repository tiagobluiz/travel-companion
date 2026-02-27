import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useAuthStore } from './stores/authStore'

vi.mock('./components/features/auth/LoginPage', () => ({
  default: () => <h1>Login Page</h1>,
}))

vi.mock('./components/features/auth/RegisterPage', () => ({
  default: () => <h1>Register Page</h1>,
}))

vi.mock('./components/features/discovery/DiscoveryAuthShellPage', () => ({
  default: () => <h1>Discovery Shell Page</h1>,
}))

vi.mock('./components/features/dashboard/DashboardPage', () => ({
  default: () => <h1>Dashboard Page</h1>,
}))

vi.mock('./components/features/trips/TripDetailPage', () => ({
  default: () => <h1>Trip Detail Page</h1>,
}))

function setAnonymousUser() {
  useAuthStore.setState({ token: null, user: null })
}

function setAuthenticatedUser() {
  useAuthStore.setState({
    token: 'token-123',
    user: { id: 'user-1', email: 'user@example.com', displayName: 'User' },
  })
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path)
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear()
    setAnonymousUser()
  })

  it('allows anonymous users to access public trip detail route', () => {
    navigateTo('/trips/trip-1')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Trip Detail Page' })).toBeInTheDocument()
  })

  it('renders discovery shell for anonymous users on root route', () => {
    navigateTo('/')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Discovery Shell Page' })).toBeInTheDocument()
  })

  it('keeps authenticated users on protected dashboard route', () => {
    setAuthenticatedUser()
    navigateTo('/')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Dashboard Page' })).toBeInTheDocument()
  })

  it('redirects authenticated users away from login to dashboard', async () => {
    setAuthenticatedUser()
    navigateTo('/login')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard Page' })).toBeInTheDocument()
    })
  })

  it('renders reusable not found page for unknown paths', async () => {
    navigateTo('/unknown-route')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Go to Home' })).toBeInTheDocument()
    })
  })
})
