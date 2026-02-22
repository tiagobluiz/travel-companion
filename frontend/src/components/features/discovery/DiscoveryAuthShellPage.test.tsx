import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DiscoveryAuthShellPage from './DiscoveryAuthShellPage'

const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('../../../api/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  register: (...args: unknown[]) => mockRegister(...args),
}))

function renderPage(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<DiscoveryAuthShellPage />} />
        <Route path="/trips/:id" element={<h1>Trip Detail Destination</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DiscoveryAuthShellPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockResolvedValue({})
    mockRegister.mockResolvedValue({})
  })

  it('renders discovery previews and filters by search term', async () => {
    renderPage('/')

    expect(screen.getByText(/Discover amazing public trips/i)).toBeInTheDocument()
    expect(screen.getByText('Paris Getaway')).toBeInTheDocument()
    expect(screen.queryByText('Japan Highlights')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Asia' }))
    expect(screen.getByText('Japan Highlights')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Search destinations or themes'), 'Japan')

    expect(screen.queryByText('Paris Getaway')).not.toBeInTheDocument()
    expect(screen.getByText('Japan Highlights')).toBeInTheDocument()
  })

  it('opens sign-in tab from query param and validates empty submit', async () => {
    renderPage('/?tab=signin')

    const signInPanel = screen.getByRole('tabpanel')
    await userEvent.click(within(signInPanel).getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits login form and navigates to returnTo route', async () => {
    renderPage('/?tab=signin&returnTo=%2Ftrips%2Ftrip-123')

    const signInPanel = screen.getByRole('tabpanel')
    const signInPanelScope = within(signInPanel)
    await userEvent.type(signInPanelScope.getByLabelText('Email'), 'owner@example.com')
    await userEvent.type(signInPanelScope.getByLabelText('Password'), 'super-secret')
    await userEvent.click(signInPanelScope.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('owner@example.com', 'super-secret')
    })

    expect(await screen.findByRole('heading', { name: 'Trip Detail Destination' })).toBeInTheDocument()
  })
})
