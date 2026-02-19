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

  it('redirects anonymous users from protected dashboard route to login', async () => {
    navigateTo('/')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login Page' })).toBeInTheDocument()
    })
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

  it('routes unknown paths to auth flow for anonymous users', async () => {
    navigateTo('/unknown-route')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login Page' })).toBeInTheDocument()
    })
  })
})
