import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CollaboratorsSection } from './CollaboratorsSection'
import { ExpensesSection } from './ExpensesSection'
import { ItinerarySection } from './ItinerarySection'
import { TripDetailHeader } from './TripDetailHeader'
import { TripDetailsSection } from './TripDetailsSection'

const trip = {
  id: 'trip-1',
  name: 'Paris',
  startDate: '2026-01-01',
  endDate: '2026-01-03',
  visibility: 'PRIVATE' as const,
  status: 'ACTIVE' as const,
  itineraryItems: [],
  createdAt: '2026-01-01T00:00:00Z',
}

describe('Trip detail extracted sections', () => {
  it('renders header and handles logout action (smoke)', () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <TripDetailHeader
          tripName="Paris"
          userDisplayName="Owner"
          isAuthenticated
          onLogout={onLogout}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Paris' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('renders trip details editable section and submits (smoke)', () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => e.preventDefault())

    render(
      <TripDetailsSection
        trip={trip}
        tripDetailsError=""
        canEditTripDetails
        canEditPrivacy
        tripName="Paris"
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        tripVisibility="PRIVATE"
        isSaving={false}
        onTripNameChange={vi.fn()}
        onTripStartDateChange={vi.fn()}
        onTripEndDateChange={vi.fn()}
        onTripVisibilityChange={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save details' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders itinerary read-only content (smoke)', () => {
    render(
      <ItinerarySection
        trip={trip}
        itinerary={{
          days: [{ dayNumber: 1, date: '2026-01-01', items: [] }],
          placesToVisit: { label: 'Places To Visit', items: [] },
        }}
        isItineraryLoading={false}
        canEditPlanning={false}
        showItineraryForm={false}
        itineraryLoadError={null}
        itineraryError=""
        isAddPending={false}
        isMovePending={false}
        isEditPending={false}
        onShowForm={vi.fn()}
        onHideForm={vi.fn()}
        onAddItinerary={vi.fn()}
        onEditItinerary={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('Day 1 (2026-01-01)')).toBeInTheDocument()
    expect(screen.getByText('Read-only itinerary view. Only editors and owners can plan items.')).toBeInTheDocument()
  })

  it('renders collaborators unauthenticated message and authenticated list (smoke)', () => {
    const { rerender } = render(
      <CollaboratorsSection
        isAuthenticated={false}
        collaborators={undefined}
        collaboratorsLoadError={null}
        collaboratorError=""
        isCollaboratorsLoading={false}
        isOwner={false}
        isMember={false}
        userEmail={undefined}
        inviteEmail=""
        inviteRole="VIEWER"
        isInvitePending={false}
        isRespondPending={false}
        isRevokePending={false}
        isLeavePending={false}
        onInviteEmailChange={vi.fn()}
        onInviteRoleChange={vi.fn()}
        onInviteSubmit={vi.fn()}
        onAcceptInvite={vi.fn()}
        onDeclineInvite={vi.fn()}
        onRevokeInvite={vi.fn()}
        onLeaveTrip={vi.fn()}
      />
    )

    expect(screen.getByText('Sign in to manage collaborators and invites.')).toBeInTheDocument()

    rerender(
      <CollaboratorsSection
        isAuthenticated
        collaborators={{
          memberships: [{ userId: 'user-owner', role: 'OWNER' }],
          invites: [{ email: 'owner@example.com', role: 'EDITOR', status: 'PENDING' }],
        }}
        collaboratorsLoadError={null}
        collaboratorError=""
        isCollaboratorsLoading={false}
        isOwner
        isMember
        userEmail="owner@example.com"
        inviteEmail=""
        inviteRole="VIEWER"
        isInvitePending={false}
        isRespondPending={false}
        isRevokePending={false}
        isLeavePending={false}
        onInviteEmailChange={vi.fn()}
        onInviteRoleChange={vi.fn()}
        onInviteSubmit={vi.fn()}
        onAcceptInvite={vi.fn()}
        onDeclineInvite={vi.fn()}
        onRevokeInvite={vi.fn()}
        onLeaveTrip={vi.fn()}
      />
    )

    expect(screen.getByText('OWNER')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('renders expenses section and triggers add form action (smoke)', () => {
    const onShowForm = vi.fn()

    render(
      <ExpensesSection
        trip={trip}
        expenses={[]}
        totalExpenses={0}
        canEditPlanning
        showExpenseForm={false}
        amount=""
        currency="USD"
        expenseDesc=""
        expenseDate=""
        expenseError=""
        isCreatePending={false}
        onShowForm={onShowForm}
        onHideForm={vi.fn()}
        onAmountChange={vi.fn()}
        onCurrencyChange={vi.fn()}
        onExpenseDescChange={vi.fn()}
        onExpenseDateChange={vi.fn()}
        onAddExpense={vi.fn()}
        onDeleteExpense={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '+ Add expense' }))
    expect(onShowForm).toHaveBeenCalledTimes(1)
  })
})
