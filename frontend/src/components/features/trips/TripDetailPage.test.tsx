import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TripDetailPage from './TripDetailPage'
import { ApiError } from '../../../api/client'

const mockFetchTrip = vi.fn()
const mockDeleteTrip = vi.fn()
const mockArchiveTrip = vi.fn()
const mockRestoreTrip = vi.fn()
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
  archiveTrip: (...args: unknown[]) => mockArchiveTrip(...args),
  restoreTrip: (...args: unknown[]) => mockRestoreTrip(...args),
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

async function openTripDetailTab(name: 'Itinerary' | 'Collaborators' | 'Expenses' | 'Settings') {
  fireEvent.click(await screen.findByRole('tab', { name }))
}

const baseTrip = {
  id: 'trip-1',
  name: 'Paris',
  startDate: '2026-01-01',
  endDate: '2026-01-03',
  visibility: 'PRIVATE',
  status: 'ACTIVE',
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
    mockArchiveTrip.mockResolvedValue({ ...baseTrip, status: 'ARCHIVED' })
    mockRestoreTrip.mockResolvedValue({ ...baseTrip, status: 'ACTIVE' })
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
    await screen.findByText('Read-only itinerary view. Only editors and owners can plan items.')

    expect(screen.queryByText('Add place')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument()
    await openTripDetailTab('Collaborators')
    expect(await screen.findByText('Sign in to manage collaborators and invites.')).toBeInTheDocument()
    expect(mockFetchCollaborators).not.toHaveBeenCalled()
  })

  it('shows auth gate CTA for anonymous users on public trips', async () => {
    authState = {
      token: null,
      user: null,
      logout: vi.fn(),
    }
    mockFetchTrip.mockResolvedValueOnce({ ...baseTrip, visibility: 'PUBLIC' })

    renderPage()

    expect(await screen.findByText('Public trip preview')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copy this trip' }))

    expect(await screen.findByRole('dialog', { name: 'Sign in to copy or edit this trip' })).toBeInTheDocument()
  })

  it('pending invitee cannot edit itinerary actions (permission matrix)', async () => {
    authState = {
      token: 'token-1',
      user: { displayName: 'Pending', email: 'pending@example.com', id: 'user-pending' },
      logout: vi.fn(),
    }
    mockFetchCollaborators.mockResolvedValue({
      memberships: [{ userId: 'user-owner', role: 'OWNER' as const }],
      invites: [{ email: 'pending@example.com', role: 'EDITOR' as const, status: 'PENDING' as const }],
    })

    renderPage()
    await screen.findByText('Read-only itinerary view. Only editors and owners can plan items.')

    expect(screen.queryByText('Add place')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument()
  })

  it('owner can edit trip details including privacy (permission matrix)', async () => {
    renderPage()
    await openTripDetailTab('Settings')
    const tripDetailsHeading = await screen.findByRole('heading', { name: 'Trip details' })
    const tripDetailsSection = tripDetailsHeading.closest('section')
    expect(tripDetailsSection).not.toBeNull()
    const tripDetails = within(tripDetailsSection!)
    await tripDetails.findByRole('button', { name: 'Save details' })

    fireEvent.change(tripDetails.getByDisplayValue('Paris'), { target: { value: 'Paris Updated' } })
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
    await openTripDetailTab('Settings')
    const tripDetailsHeading = await screen.findByRole('heading', { name: 'Trip details' })
    const tripDetailsSection = tripDetailsHeading.closest('section')
    expect(tripDetailsSection).not.toBeNull()
    const tripDetails = within(tripDetailsSection!)
    await tripDetails.findByRole('button', { name: 'Save details' })

    const privacySelect = tripDetails.getByLabelText('Privacy')
    expect(privacySelect).toBeDisabled()

    fireEvent.change(tripDetails.getByDisplayValue('Paris'), { target: { value: 'Editor Updated' } })
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
    await openTripDetailTab('Settings')
    expect(await screen.findByText('Trip details')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save details' })).not.toBeInTheDocument()
    expect(screen.getByText('Privacy: PRIVATE')).toBeInTheDocument()
  })

  it('validates itinerary date range before mutation (validation failure)', async () => {
    renderPage()
    await screen.findByText('Add place')

    fireEvent.click(screen.getByText('Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Notre Dame' },
    })
    const dateInput = document.querySelector('input[type="date"][min="2026-01-01"][max="2026-01-03"]')
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput!, {
      target: { value: '2026-01-08' },
    })
    const itineraryForm = screen.getByPlaceholderText('Place or activity').closest('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    expect(await screen.findByText('Date must be between 2026-01-01 and 2026-01-03.')).toBeInTheDocument()
    expect(mockAddItineraryItem).not.toHaveBeenCalled()
  })

  it('adds item to places to visit when destination is places (happy path)', async () => {
    renderPage()
    await screen.findByText('Add place')

    fireEvent.click(screen.getByText('Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Arc de Triomphe' },
    })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'PLACES' } })
    const itineraryForm = screen.getByPlaceholderText('Place or activity').closest('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    await waitFor(() => {
      expect(mockAddItineraryItem).toHaveBeenCalledWith('trip-1', {
        placeName: 'Arc de Triomphe',
        notes: undefined,
        latitude: 0,
        longitude: 0,
        dayNumber: undefined,
      })
    })
  })

  it('updates itinerary item notes inline (happy path)', async () => {
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getByText('Louvre'))
    fireEvent.change(await screen.findByLabelText('Notes'), { target: { value: 'Updated note' } })

    await waitFor(() => {
      expect(mockUpdateItineraryItem).toHaveBeenCalledWith('trip-1', 'day1-a', {
        placeName: 'Louvre',
        notes: 'Updated note',
        latitude: 1,
        longitude: 1,
        dayNumber: 1,
      })
    })
  })

  it('allows clearing notes from inline notes editor', async () => {
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getByText('Louvre'))
    fireEvent.change(await screen.findByLabelText('Notes'), { target: { value: '' } })

    await waitFor(() => {
      expect(mockUpdateItineraryItem).toHaveBeenCalledWith('trip-1', 'day1-a', {
        placeName: 'Louvre',
        notes: '',
        latitude: 1,
        longitude: 1,
        dayNumber: 1,
      })
    })
  })

  it('shows update error from itinerary item edit mutation (error state)', async () => {
    mockUpdateItineraryItem.mockRejectedValueOnce(new Error('Edit failed'))
    renderPage()
    await screen.findByText('Louvre')

    fireEvent.click(screen.getByText('Louvre'))
    fireEvent.change(await screen.findByLabelText('Notes'), { target: { value: 'Fails save' } })

    expect(await screen.findByText('Edit failed')).toBeInTheDocument()
  })

  it('shows mutation error on move failure (error state)', async () => {
    mockMoveItineraryItem.mockRejectedValueOnce(new Error('Move failed'))

    renderPage()
    await screen.findByText('Louvre')
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]!)

    expect(await screen.findByText('Move failed')).toBeInTheDocument()
  })

  it('shows permission error on 403 move failure (error path)', async () => {
    mockMoveItineraryItem.mockRejectedValueOnce(new Error('403 Forbidden'))

    renderPage()
    await screen.findByText('Louvre')
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]!)

    expect(await screen.findByText('You do not have permission to move itinerary items for this trip.')).toBeInTheDocument()
  })

  it('shows permission error and hides form on 401 add failure (error path)', async () => {
    mockAddItineraryItem.mockRejectedValueOnce(new Error('401 Unauthorized'))

    renderPage()
    await screen.findByText('Add place')

    fireEvent.click(screen.getByText('Add place'))
    fireEvent.change(screen.getByPlaceholderText('Place or activity'), {
      target: { value: 'Notre Dame' },
    })
    const dateInput = document.querySelector('input[type="date"][min="2026-01-01"][max="2026-01-03"]')
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput!, {
      target: { value: '2026-01-02' },
    })
    const itineraryForm = screen.getByPlaceholderText('Place or activity').closest('form')
    expect(itineraryForm).not.toBeNull()
    fireEvent.submit(itineraryForm!)

    expect(await screen.findByText('You do not have permission to add itinerary items for this trip.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Place or activity')).not.toBeInTheDocument()
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

  it('opens inline create form in a day column without destination/date fields', async () => {
    renderPage()
    await screen.findByText('Day 1 (2026-01-01)')

    fireEvent.click(screen.getAllByRole('button', { name: 'Add activity' })[0]!)

    expect(await screen.findByPlaceholderText('Place or activity')).toBeInTheDocument()
    expect(screen.queryByLabelText('Destination')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="date"][min="2026-01-01"][max="2026-01-03"]')).toBeNull()
  })

  it('opens inline create form in places to visit without destination/date fields', async () => {
    renderPage()
    await screen.findByText('Places To Visit')

    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(await screen.findByPlaceholderText('Place or activity')).toBeInTheDocument()
    expect(screen.queryByLabelText('Destination')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="date"][min="2026-01-01"][max="2026-01-03"]')).toBeNull()
  })

  it('renders reusable not found page on trip 404 (auth-loss/private visibility path)', async () => {
    mockFetchTrip.mockRejectedValueOnce(new ApiError('Not Found', 404, '/trips/trip-1'))

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Trip not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
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

  it('shows permission error on 403 remove failure (error path)', async () => {
    mockDeleteItineraryItem.mockRejectedValueOnce(new Error('403 Forbidden'))

    renderPage()
    await screen.findByText('Louvre')
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!)

    expect(await screen.findByText('You do not have permission to remove itinerary items for this trip.')).toBeInTheDocument()
  })

  it('shows collaborator role and pending/declined badges (happy path)', async () => {
    renderPage()
    await openTripDetailTab('Collaborators')

    expect(await screen.findByRole('heading', { name: 'Collaborators' })).toBeInTheDocument()
    expect(screen.getByText('OWNER')).toBeInTheDocument()
    expect(screen.getAllByText('EDITOR').length).toBeGreaterThan(0)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('DECLINED')).toBeInTheDocument()
  })

  it('accepts pending invite for current user (invite flow)', async () => {
    renderPage()
    await openTripDetailTab('Collaborators')
    await screen.findByText('PENDING')

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => {
      expect(mockRespondInvite).toHaveBeenCalledWith('trip-1', { accept: true })
    })
  })

  it('revokes a declined invite (edge case)', async () => {
    renderPage()
    await openTripDetailTab('Collaborators')
    await screen.findByText('DECLINED')

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' })
    fireEvent.click(revokeButtons[1]!)

    await waitFor(() => {
      expect(mockRemoveInvite).toHaveBeenCalledWith('trip-1', 'declined@example.com')
    })
  })

  it('validates invite form before submit (validation failure)', async () => {
    renderPage()
    await openTripDetailTab('Collaborators')
    await screen.findByText('Invite collaborator')

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }))

    expect(await screen.findByText('Invite email is required.')).toBeInTheDocument()
    expect(mockInviteMember).not.toHaveBeenCalled()
  })

  it('shows collaborator mutation error state', async () => {
    mockRemoveInvite.mockRejectedValueOnce(new Error('Only owners can manage invites'))

    renderPage()
    await openTripDetailTab('Collaborators')
    await screen.findByText('DECLINED')

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' })
    fireEvent.click(revokeButtons[1]!)

    expect(await screen.findByText('Only owners can manage invites')).toBeInTheDocument()
  })

  it('requires confirmation before archiving a trip', async () => {
    renderPage()
    await openTripDetailTab('Settings')
    await screen.findByRole('button', { name: 'Archive trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Archive trip' }))
    const archiveDialog = await screen.findByRole('dialog', { name: 'Archive trip?' })
    const archiveDialogScope = within(archiveDialog)
    expect(archiveDialogScope.getByText('Archive trip?')).toBeInTheDocument()

    fireEvent.click(archiveDialogScope.getByRole('button', { name: 'Cancel' }))
    expect(mockArchiveTrip).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Archive trip' }))
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'Archive trip?' })).getByRole('button', {
        name: 'Archive trip',
      })
    )

    await waitFor(() => {
      expect(mockArchiveTrip).toHaveBeenCalledWith('trip-1')
    })
  })

  it('shows restore action for archived trips and requires confirmation', async () => {
    mockFetchTrip.mockResolvedValueOnce({ ...baseTrip, status: 'ARCHIVED' })
    renderPage()
    await openTripDetailTab('Settings')
    await screen.findByRole('button', { name: 'Restore trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Restore trip' }))
    const restoreDialog = await screen.findByRole('dialog', { name: 'Restore trip?' })
    expect(within(restoreDialog).getByText('Restore trip?')).toBeInTheDocument()
    fireEvent.click(within(restoreDialog).getByRole('button', { name: 'Restore trip' }))

    await waitFor(() => {
      expect(mockRestoreTrip).toHaveBeenCalledWith('trip-1')
    })
  })

  it('requires confirmation before deleting an active trip', async () => {
    renderPage()
    await openTripDetailTab('Settings')
    await screen.findByRole('button', { name: 'Delete trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Delete trip' }))
    const deleteDialog = await screen.findByRole('dialog', { name: 'Delete trip permanently?' })
    const deleteDialogScope = within(deleteDialog)
    expect(deleteDialogScope.getByText('This action cannot be undone.')).toBeInTheDocument()

    fireEvent.click(deleteDialogScope.getByRole('button', { name: 'Cancel' }))
    expect(mockDeleteTrip).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete trip' }))
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'Delete trip permanently?' })).getByRole('button', {
        name: 'Delete trip',
      })
    )

    await waitFor(() => {
      expect(mockDeleteTrip).toHaveBeenCalledWith('trip-1')
    })
  })

  it('allows deleting an archived trip with confirmation', async () => {
    mockFetchTrip.mockResolvedValueOnce({ ...baseTrip, status: 'ARCHIVED' })
    renderPage()
    await openTripDetailTab('Settings')
    await screen.findByRole('button', { name: 'Delete trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Delete trip' }))
    const deleteDialog = await screen.findByRole('dialog', { name: 'Delete trip permanently?' })
    expect(within(deleteDialog).getByText('This action cannot be undone.')).toBeInTheDocument()
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete trip' }))

    await waitFor(() => {
      expect(mockDeleteTrip).toHaveBeenCalledWith('trip-1')
    })
  })

  it('non-owners do not see archive restore or delete actions', async () => {
    authState = {
      token: 'token-1',
      user: { displayName: 'Editor', email: 'editor@example.com', id: 'user-editor' },
      logout: vi.fn(),
    }

    renderPage()
    await openTripDetailTab('Settings')
    await screen.findByText('Trip details')

    expect(screen.queryByRole('button', { name: 'Archive trip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restore trip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete trip' })).not.toBeInTheDocument()
  })

  it('supports self-remove flow (regression)', async () => {
    renderPage()
    await openTripDetailTab('Collaborators')
    await screen.findByRole('button', { name: 'Leave trip' })

    fireEvent.click(screen.getByRole('button', { name: 'Leave trip' }))

    await waitFor(() => {
      expect(mockLeaveTrip).toHaveBeenCalledWith('trip-1')
    })
  })
})



