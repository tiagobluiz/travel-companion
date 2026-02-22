import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'

const mockFetchTrips = vi.fn()
const mockCreateTrip = vi.fn()

const authState = {
  user: { id: 'user-1', email: 'owner@example.com', displayName: 'Owner' },
  logout: vi.fn(),
}

vi.mock('../../../api/trips', () => ({
  fetchTrips: (...args: unknown[]) => mockFetchTrips(...args),
  createTrip: (...args: unknown[]) => mockCreateTrip(...args),
}))

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => authState,
}))

function renderPage(initialRoute = '/?tab=active') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTrip.mockResolvedValue({})
  })

  it('loads active trips by default and can switch to archived tab', async () => {
    mockFetchTrips.mockImplementation((status: string) => {
      if (status === 'ARCHIVED') {
        return Promise.resolve([
          {
            id: 'trip-2',
            name: 'Archived Trip',
            startDate: '2026-01-01',
            endDate: '2026-01-02',
            visibility: 'PRIVATE',
            status: 'ARCHIVED',
            itineraryItems: [],
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      return Promise.resolve([
        {
          id: 'trip-1',
          name: 'Active Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          visibility: 'PRIVATE',
          status: 'ACTIVE',
          itineraryItems: [],
          createdAt: '2026-01-01T00:00:00Z',
        },
      ])
    })

    renderPage()
    expect(await screen.findByText('Active Trip')).toBeInTheDocument()
    expect(mockFetchTrips).toHaveBeenCalledWith('ACTIVE')

    fireEvent.click(screen.getByRole('tab', { name: 'Archived' }))

    await waitFor(() => {
      expect(mockFetchTrips).toHaveBeenCalledWith('ARCHIVED')
    })
    expect(await screen.findByText('Archived Trip')).toBeInTheDocument()
  })

  it('shows archived empty state when archived tab has no trips', async () => {
    mockFetchTrips.mockResolvedValue([])
    renderPage('/?tab=archived')

    expect(await screen.findByText('No archived trips')).toBeInTheDocument()
  })
})
