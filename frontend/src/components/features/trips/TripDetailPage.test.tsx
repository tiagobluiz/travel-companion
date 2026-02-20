import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TripDetailPage from './TripDetailPage'

const mockFetchTrip = vi.fn()
const mockDeleteTrip = vi.fn()
const mockUpdateTrip = vi.fn()
const mockFetchItineraryV2 = vi.fn()
const mockAddItineraryItem = vi.fn()
const mockUpdateItineraryItem = vi.fn()
const mockMoveItineraryItem = vi.fn()
const mockDeleteItineraryItem = vi.fn()
const mockFetchExpenses = vi.fn()
const mockCreateExpense = vi.fn()
const mockDeleteExpense = vi.fn()
const mockFetchCollaborators = vi.fn()
const mockInviteMember = vi.fn()
const mockRespondInvite = vi.fn()
const mockRemoveInvite = vi.fn()
const mockLeaveTrip = vi.fn()

let authState: {
  token: string | null
  user: { id: string; email: string; displayName: string } | null
  logout: () => void
}

vi.mock('../../../api/trips', () => ({
  fetchTrip: (...args: unknown[]) => mockFetchTrip(...args),
  deleteTrip: (...args: unknown[]) => mockDeleteTrip(...args),
  updateTrip: (...args: unknown[]) => mockUpdateTrip(...args),
}))

vi.mock('../../../api/itinerary', () => ({
  fetchItineraryV2: (...args: unknown[]) => mockFetchItineraryV2(...args),
  addItineraryItem: (...args: unknown[]) => mockAddItineraryItem(...args),
  updateItineraryItem: (...args: unknown[]) => mockUpdateItineraryItem(...args),
  moveItineraryItem: (...args: unknown[]) => mockMoveItineraryItem(...args),
  deleteItineraryItem: (...args: unknown[]) => mockDeleteItineraryItem(...args),
}))

vi.mock('../../../api/expenses', () => ({
  fetchExpenses: (...args: unknown[]) => mockFetchExpenses(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
}))

vi.mock('../../../api/collaborators', () => ({
  fetchCollaborators: (...args: unknown[]) => mockFetchCollaborators(...args),
  inviteMember: (...args: unknown[]) => mockInviteMember(...args),
  respondInvite: (...args: unknown[]) => mockRespondInvite(...args),
  removeInvite: (...args: unknown[]) => mockRemoveInvite(...args),
  leaveTrip: (...args: unknown[]) => mockLeaveTrip(...args),
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
  visibility: 'PRIVATE',
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

const collaboratorsData = {
  memberships: [
    { userId: 'user-owner', role: 'OWNER' as const },
    { userId: 'user-editor', role: 'EDITOR' as const },
  ],
  invites: [
    { email: 'owner@example.com', role: 'EDITOR' as const, status: 'PENDING' as const },
    { email: 'declined@example.com', role: 'VIEWER' as const, status: 'DECLINED' as const },
  ],
}

describe('TripDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState = {
      token: 'token-1',
      user: { displayName: 'Owner', email: 'owner@example.com', id: 'user-owner' },
      logout: vi.fn(),
    }
    mockFetchTrip.mockResolvedValue(baseTrip)
    mockFetchItineraryV2.mockResolvedValue(itineraryWithItems)
    mockFetchExpenses.mockResolvedValue([])
    mockMoveItineraryItem.mockResolvedValue(itineraryWithItems)
    mockDeleteItineraryItem.mockResolvedValue(itineraryWithItems)
    mockAddItineraryItem.mockResolvedValue(itineraryWithItems)
    mockUpdateItineraryItem.mockResolvedValue(itineraryWithItems)
    mockFetchCollaborators.mockResolvedValue(collaboratorsData)
    mockUpdateTrip.mockResolvedValue(baseTrip)
    mockInviteMember.mockResolvedValue(collaboratorsData)
    mockRespondInvite.mockResolvedValue(collaboratorsData)
    mockRemoveInvite.mockResolvedValue(collaboratorsData)
    mockLeaveTrip.mockResolvedValue({})
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
    await screen.findByText('Read-only itinerary view. Editors/owners (and pending invitees) can plan items.')

    expect(screen.queryByText('+ Add place')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument()
    expect(screen.getByText('Sign in to manage collaborators and invites.')).toBeInTheDocument()
    expect(mockFetchCollaborators).not.toHaveBeenCalled()
  })

  it('owner can edit trip details including privacy (permission matrix)', async () => {
    renderPage()
    const tripDetailsHeading = await screen.findByRole('heading', { name: 'Trip details' })
    const tripDetailsSection = tripDetailsHeading.closest('section')
    expect(tripDetailsSection).not.toBeNull()
    const tripDetails = within(tripDetailsSection!)
    await tripDetails.findByRole('button', { name: 'Save details' })

    fireEvent.change(tripDetails.getByPlaceholderText('Trip name'), { target: { value: 'Paris Updated' } })
    fireEvent.change(tripDetails.getByDisplayValue('2026-01-01'), { target: { value: '2026-01-02' } })
    fireEvent.change(tripDetails.getByDisplayValue('2026-01-03'), { target: { value: '2026-01-04' } })
    fireEvent.change(tripDetails.getByLabelText('Privacy'), { target: { value: 'PUBLIC' } })
    fireEvent.click(tripDetails.getByRole('button', { name: 'Save details' }))

    await waitFor(() => {
      expect(mockUpdateTrip).toHaveBeenCalledWith('trip-1', {
        name: 'Paris Updated',
        startDate: '2026-01-02',
        endDate: '2026-01-04',
        visibility: 'PUBLIC',
      })
    })
  })

  it('editor can edit non-privacy fields but cannot edit privacy (permission matrix)', async () => {
    authState = {
      token: 'token-1',
      user: { displayName: 'Editor', email: 'editor@example.com', id: 'user-editor' },
      logout: vi.fn(),
    }
    renderPage()
    const tripDetailsHeading = await screen.findByRole('heading', { name: 'Trip details' })
    const tripDetailsSection = tripDetailsHeading.closest('section')
    expect(tripDetailsSection).not.toBeNull()
    const tripDetails = within(tripDetailsSection!)
    await tripDetails.findByRole('button', { name: 'Save details' })

    const privacySelect = tripDetails.getByLabelText('Privacy')
    expect(privacySelect).toBeDisabled()

    fireEvent.change(tripDetails.getByPlaceholderText('Trip name'), { target: { value: 'Editor Updated' } })
    fireEvent.click(tripDetails.getByRole('button', { name: 'Save details' }))

    await waitFor(() => {
      expect(mockUpdateTrip).toHaveBeenCalledWith('trip-1', {
        name: 'Editor Updated',
        startDate: '2026-01-01',
        endDate: '2026-01-03',
        visibility: undefined,
      })
    })
  })

  it('viewer gets read-only trip details and no save action (permission matrix)', async () => {
    authState = {
      token: 'token-1',
      user: { displayName: 'Viewer', email: 'viewer@example.com', id: 'user-viewer' },
      logout: vi.fn(),
    }
    mockFetchCollaborators.mockResolvedValue({
      memberships: [{ userId: 'user-viewer', role: 'VIEWER' as const }],
      invites: [],
    })

    renderPage()
    expect(await screen.findByText('Trip details')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save details' })).not.toBeInTheDocument()
    expect(screen.getByText('Privacy: PRIVATE')).toBeInTheDocument()
  })

  it('validates itinerary date range before mutation (validation failure)', async () => {
    renderPage()
    await screen.findByText('+ Add place')

    fireEvent.click(screen.getByText('+ Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Notre Dame' },
    })
    const dateInput = document.querySelector('input[type="date"][min="2026-01-01"][max="2026-01-03"]')
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput!, {
      target: { value: '2026-01-08' },
    })
    fireEvent.change(screen.getByPlaceholderText('Latitude'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('Longitude'), { target: { value: '1' } })
    const itineraryForm = screen.getByPlaceholderText('Place or activity').closest('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    expect(await screen.findByText('Date must be between 2026-01-01 and 2026-01-03.')).toBeInTheDocument()
    expect(mockAddItineraryItem).not.toHaveBeenCalled()
  })

  it('adds item to places to visit when destination is places (happy path)', async () => {
    renderPage()
    await screen.findByText('+ Add place')

    fireEvent.click(screen.getByText('+ Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Arc de Triomphe' },
    })
    fireEvent.change(screen.getByPlaceholderText('Latitude'), { target: { value: '48.87' } })
    fireEvent.change(screen.getByPlaceholderText('Longitude'), { target: { value: '2.29' } })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'PLACES' } })
    const itineraryForm = screen.getByPlaceholderText('Place or activity').closest('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    await waitFor(() => {
      expect(mockAddItineraryItem).toHaveBeenCalledWith('trip-1', {
        placeName: 'Arc de Triomphe',
        notes: undefined,
        latitude: 48.87,
        longitude: 2.29,
        dayNumber: undefined,
      })
    })
  })

  it('updates itinerary item notes and destination day from edit form (happy path)', async () => {
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    fireEvent.change(screen.getByPlaceholderText('Notes'), { target: { value: 'Updated note' } })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'PLACES' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdateItineraryItem).toHaveBeenCalledWith('trip-1', 'day1-a', {
        placeName: 'Louvre',
        notes: 'Updated note',
        latitude: 1,
        longitude: 1,
        dayNumber: undefined,
      })
    })
  })

  it('shows update error from itinerary item edit mutation (error state)', async () => {
    mockUpdateItineraryItem.mockRejectedValueOnce(new Error('Edit failed'))
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Edit failed')).toBeInTheDocument()
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

  it('shows explicit error when trip query fails (error state)', async () => {
    mockFetchTrip.mockRejectedValueOnce(new Error('Trip not found'))

    renderPage()

    expect(await screen.findByText('Trip not found')).toBeInTheDocument()
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

  it('shows collaborator role and pending/declined badges (happy path)', async () => {
    renderPage()

    expect(await screen.findByText('Collaborators')).toBeInTheDocument()
    expect(screen.getByText('OWNER')).toBeInTheDocument()
    expect(screen.getAllByText('EDITOR').length).toBeGreaterThan(0)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('DECLINED')).toBeInTheDocument()
  })

  it('accepts pending invite for current user (invite flow)', async () => {
    renderPage()
    await screen.findByText('PENDING')

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => {
      expect(mockRespondInvite).toHaveBeenCalledWith('trip-1', { accept: true })
    })
  })

  it('revokes a declined invite (edge case)', async () => {
    renderPage()
    await screen.findByText('DECLINED')

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' })
    fireEvent.click(revokeButtons[1]!)

    await waitFor(() => {
      expect(mockRemoveInvite).toHaveBeenCalledWith('trip-1', 'declined@example.com')
    })
  })

  it('validates invite form before submit (validation failure)', async () => {
    renderPage()
    await screen.findByText('Invite collaborator')

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }))

    expect(await screen.findByText('Invite email is required.')).toBeInTheDocument()
    expect(mockInviteMember).not.toHaveBeenCalled()
  })

  it('shows collaborator mutation error state', async () => {
    mockRemoveInvite.mockRejectedValueOnce(new Error('Only owners can manage invites'))

    renderPage()
    await screen.findByText('DECLINED')

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' })
    fireEvent.click(revokeButtons[1]!)

    expect(await screen.findByText('Only owners can manage invites')).toBeInTheDocument()
  })

  it('supports self-remove flow (regression)', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Leave trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Leave trip' }))

    await waitFor(() => {
      expect(mockLeaveTrip).toHaveBeenCalledWith('trip-1')
    })
  })
})
