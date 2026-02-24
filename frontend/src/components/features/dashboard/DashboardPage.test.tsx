import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import { ApiError } from '../../../api/client'

const mockFetchTrips = vi.fn()
const mockCreateTrip = vi.fn()

const authState = {
  user: { id: 'user-1', email: 'owner@example.com', displayName: 'Alex' },
  logout: vi.fn(),
}

vi.mock('../../../api/trips', () => ({
  fetchTrips: (...args: unknown[]) => mockFetchTrips(...args),
  createTrip: (...args: unknown[]) => mockCreateTrip(...args),
}))

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => authState,
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function buildTrip(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'trip-1',
    name: 'Lisbon Adventure',
    startDate: '2026-05-16',
    endDate: '2026-05-20',
    visibility: 'PRIVATE',
    status: 'ACTIVE',
    itineraryItems: [{ placeName: 'Alfama', date: '2026-05-16', notes: '', latitude: 0, longitude: 0 }],
    createdAt: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTrip.mockResolvedValue({})
    authState.logout.mockReset()
  })

  it('loads a unified all-trips list and renders metadata cards', async () => {
    mockFetchTrips.mockResolvedValue([
      buildTrip(),
      buildTrip({
        id: 'trip-2',
        name: 'Thailand Escape',
        visibility: 'PUBLIC',
        status: 'ARCHIVED',
        itineraryItems: [],
        createdAt: '2026-01-05T00:00:00Z',
      }),
    ])

    renderPage()

    expect(await screen.findByText('Lisbon Adventure')).toBeInTheDocument()
    expect(screen.getByText('Thailand Escape')).toBeInTheDocument()
    expect(mockFetchTrips).toHaveBeenCalledWith('ALL')

    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.queryByText('Active trips')).not.toBeInTheDocument()
    expect(screen.getByText(/Archived Trips/i)).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('Pending invites')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Marta' })).toHaveAttribute('href', '/profile/marta')
    expect(screen.getAllByText(/days/i).length).toBeGreaterThan(0)
  })

  it('shows empty state and opens create dialog', async () => {
    mockFetchTrips.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('No trips yet')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Create trip' })[0]!)

    expect(await screen.findByRole('dialog', { name: 'Create a new trip' })).toBeInTheDocument()
  })

  it('submits create trip dialog and invalidates list', async () => {
    mockFetchTrips.mockResolvedValue([])
    mockCreateTrip.mockResolvedValue(buildTrip())
    renderPage()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Create trip' }))[0]!)

    const dialog = await screen.findByRole('dialog', { name: 'Create a new trip' })
    fireEvent.change(within(dialog).getByLabelText('Trip name'), { target: { value: 'Japan Highlights' } })
    fireEvent.change(within(dialog).getByLabelText('Start date'), { target: { value: '2026-06-01' } })
    fireEvent.change(within(dialog).getByLabelText('End date'), { target: { value: '2026-06-10' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create trip' }))

    await waitFor(() => {
      expect(mockCreateTrip).toHaveBeenCalledWith({
        name: 'Japan Highlights',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
      })
    })
  })

  it('logs out and redirects when trips query returns auth error', async () => {
    mockFetchTrips.mockRejectedValue(new ApiError('Forbidden', 403, '/trips?status=ALL'))

    renderPage()

    expect(await screen.findByText('Your session expired. Redirecting to sign in...')).toBeInTheDocument()
    await waitFor(() => {
      expect(authState.logout).toHaveBeenCalled()
    })
  })

  it('filters trips by status using the dashboard filter controls', async () => {
    mockFetchTrips.mockResolvedValue([
      buildTrip({ id: 'trip-a', name: 'Active One', status: 'ACTIVE' }),
      buildTrip({ id: 'trip-b', name: 'Archived One', status: 'ARCHIVED' }),
    ])
    renderPage()

    expect(await screen.findByText('Active One')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.mouseDown(screen.getByLabelText('Status'))
    fireEvent.click(await screen.findByRole('option', { name: 'Archived' }))

    expect(screen.queryByText('Active One')).not.toBeInTheDocument()
    expect(screen.getByText(/Archived Trips/i)).toBeInTheDocument()
    expect(screen.getByText('Archived One')).toBeInTheDocument()
  })
})
