import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TripDetailPage from './TripDetailPage'

const mockFetchTrip = vi.fn()
const mockDeleteTrip = vi.fn()
const mockFetchItineraryV2 = vi.fn()
const mockAddItineraryItem = vi.fn()
const mockMoveItineraryItem = vi.fn()
const mockDeleteItineraryItem = vi.fn()
const mockFetchExpenses = vi.fn()
const mockCreateExpense = vi.fn()
const mockDeleteExpense = vi.fn()

let authState: {
  token: string | null
  user: { displayName: string } | null
  logout: () => void
}

vi.mock('../../../api/trips', () => ({
  fetchTrip: (...args: unknown[]) => mockFetchTrip(...args),
  deleteTrip: (...args: unknown[]) => mockDeleteTrip(...args),
}))

vi.mock('../../../api/itinerary', () => ({
  fetchItineraryV2: (...args: unknown[]) => mockFetchItineraryV2(...args),
  addItineraryItem: (...args: unknown[]) => mockAddItineraryItem(...args),
  moveItineraryItem: (...args: unknown[]) => mockMoveItineraryItem(...args),
  deleteItineraryItem: (...args: unknown[]) => mockDeleteItineraryItem(...args),
}))

vi.mock('../../../api/expenses', () => ({
  fetchExpenses: (...args: unknown[]) => mockFetchExpenses(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
}))

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/trips/trip-1']}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const baseTrip = {
  id: 'trip-1',
  name: 'Paris',
  startDate: '2026-01-01',
  endDate: '2026-01-03',
  itineraryItems: [],
  createdAt: '2026-01-01T00:00:00Z',
}

const itineraryWithItems = {
  days: [
    {
      dayNumber: 1,
      date: '2026-01-01',
      items: [
        {
          id: 'day1-a',
          placeName: 'Louvre',
          notes: 'Morning',
          latitude: 1,
          longitude: 1,
          dayNumber: 1,
        },
        {
          id: 'day1-b',
          placeName: 'Seine',
          notes: 'Evening',
          latitude: 2,
          longitude: 2,
          dayNumber: 1,
        },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-01-02',
      items: [],
    },
  ],
  placesToVisit: {
    label: 'Places To Visit',
    items: [
      {
        id: 'pool-1',
        placeName: 'Montmartre',
        notes: '',
        latitude: 3,
        longitude: 3,
        dayNumber: null,
      },
    ],
  },
}

describe('TripDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState = {
      token: 'token-1',
      user: { displayName: 'Owner' },
      logout: vi.fn(),
    }
    mockFetchTrip.mockResolvedValue(baseTrip)
    mockFetchItineraryV2.mockResolvedValue(itineraryWithItems)
    mockFetchExpenses.mockResolvedValue([])
    mockMoveItineraryItem.mockResolvedValue(itineraryWithItems)
    mockDeleteItineraryItem.mockResolvedValue(itineraryWithItems)
    mockAddItineraryItem.mockResolvedValue(itineraryWithItems)
  })

  it('renders day/list containers and items (happy path)', async () => {
    renderPage()

    expect(await screen.findByText('Day 1 (2026-01-01)')).toBeInTheDocument()
    expect(screen.getByText('Places To Visit')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Montmartre')).toBeInTheDocument()
  })

  it('moves item up with relative reorder payload (edge case)', async () => {
    renderPage()
    await screen.findByText('Seine')

    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' })
    fireEvent.click(moveUpButtons[1]!)

    await waitFor(() => {
      expect(mockMoveItineraryItem).toHaveBeenCalledWith('trip-1', 'day1-b', {
        targetDayNumber: 1,
        beforeItemId: 'day1-a',
      })
    })
  })

  it('hides itinerary edit controls for anonymous users (permission variant)', async () => {
    authState = {
      token: null,
      user: null,
      logout: vi.fn(),
    }

    renderPage()
    await screen.findByText('Read-only itinerary view for anonymous users.')

    expect(screen.queryByText('+ Add place')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument()
  })

  it('validates itinerary date range before mutation (validation failure)', async () => {
    renderPage()
    await screen.findByText('+ Add place')

    fireEvent.click(screen.getByText('+ Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Notre Dame' },
    })
    const dateInput = document.querySelector('input[type="date"]')
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput!, {
      target: { value: '2026-01-08' },
    })
    fireEvent.change(screen.getByPlaceholderText('Latitude'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('Longitude'), { target: { value: '1' } })
    const itineraryForm = document.querySelector('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    expect(await screen.findByText('Date must be between 2026-01-01 and 2026-01-03.')).toBeInTheDocument()
    expect(mockAddItineraryItem).not.toHaveBeenCalled()
  })

  it('shows mutation error on move failure (error state)', async () => {
    mockMoveItineraryItem.mockRejectedValueOnce(new Error('Move failed'))

    renderPage()
    await screen.findByText('Louvre')
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]!)

    expect(await screen.findByText('Move failed')).toBeInTheDocument()
  })

  it('shows loading state while queries are pending (loading state)', () => {
    mockFetchTrip.mockReturnValue(new Promise(() => {}))
    mockFetchItineraryV2.mockReturnValue(new Promise(() => {}))

    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders empty day and places containers (empty state)', async () => {
    mockFetchItineraryV2.mockResolvedValue({
      days: [{ dayNumber: 1, date: '2026-01-01', items: [] }],
      placesToVisit: { label: 'Places To Visit', items: [] },
    })

    renderPage()

    expect(await screen.findByText('No items in this day.')).toBeInTheDocument()
    expect(screen.getByText('No places waiting to be scheduled.')).toBeInTheDocument()
  })

  it('removes item by id instead of index (regression)', async () => {
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!)

    await waitFor(() => {
      expect(mockDeleteItineraryItem).toHaveBeenCalledWith('trip-1', 'day1-a')
    })
  })
})
