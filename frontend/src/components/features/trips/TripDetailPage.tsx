import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { deleteTrip, updateTrip, type TripVisibility } from '../../../api/trips'
import {
  addItineraryItem,
  deleteItineraryItem,
  moveItineraryItem,
  type ItineraryItemV2Request,
  type MoveItineraryItemV2Request,
} from '../../../api/itinerary'
import { createExpense, deleteExpense, type CreateExpenseRequest } from '../../../api/expenses'
import {
  inviteMember,
  leaveTrip,
  removeInvite,
  respondInvite,
  type TripRole,
} from '../../../api/collaborators'
import { useTripDetailData } from '../../../hooks/useTripDetailData'
import { CollaboratorsSection } from './detail/CollaboratorsSection'
import { ExpensesSection } from './detail/ExpensesSection'
import { ItinerarySection } from './detail/ItinerarySection'
import { TripDetailHeader } from './detail/TripDetailHeader'
import { TripDetailsSection } from './detail/TripDetailsSection'

function toDayNumber(date: string, startDate: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const selectedUtc = Date.UTC(year, month - 1, day)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  return Math.floor((selectedUtc - startUtc) / 86_400_000) + 1
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const isAuthenticated = Boolean(token)

  const [showItineraryForm, setShowItineraryForm] = useState(false)
  const [placeName, setPlaceName] = useState('')
  const [itemDate, setItemDate] = useState('')
  const [itemNotes, setItemNotes] = useState('')
  const [itemLatitude, setItemLatitude] = useState('')
  const [itemLongitude, setItemLongitude] = useState('')
  const [itineraryError, setItineraryError] = useState('')

  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [expenseError, setExpenseError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TripRole>('VIEWER')
  const [collaboratorError, setCollaboratorError] = useState('')
  const [tripName, setTripName] = useState('')
  const [tripStartDate, setTripStartDate] = useState('')
  const [tripEndDate, setTripEndDate] = useState('')
  const [tripVisibility, setTripVisibility] = useState<TripVisibility>('PRIVATE')
  const [tripDetailsError, setTripDetailsError] = useState('')

  const {
    trip,
    isTripLoading,
    itinerary,
    isItineraryLoading,
    itineraryLoadError,
    expenses,
    collaborators,
    isCollaboratorsLoading,
    collaboratorsLoadError,
  } = useTripDetailData({ id, isAuthenticated })

  const deleteTripMutation = useMutation({
    mutationFn: () => deleteTrip(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      navigate('/')
    },
  })

  const addItineraryMutation = useMutation({
    mutationFn: (data: ItineraryItemV2Request) => addItineraryItem(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-v2', id] })
      setShowItineraryForm(false)
      setPlaceName('')
      setItemDate('')
      setItemNotes('')
      setItemLatitude('')
      setItemLongitude('')
    },
    onError: (error: Error) => {
      setItineraryError(error.message || 'Failed to add itinerary item.')
    },
  })

  const moveItineraryMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: MoveItineraryItemV2Request }) =>
      moveItineraryItem(id!, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-v2', id] })
    },
    onError: (error: Error) => {
      setItineraryError(error.message || 'Failed to move itinerary item.')
    },
  })

  const createExpenseMutation = useMutation({
    mutationFn: (data: CreateExpenseRequest) => createExpense(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', id] })
      setShowExpenseForm(false)
      setAmount('')
      setExpenseDesc('')
      setExpenseDate('')
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(id!, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', id] })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: TripRole }) => inviteMember(id!, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', id] })
      setInviteEmail('')
      setInviteRole('VIEWER')
      setCollaboratorError('')
    },
    onError: (error: Error) => {
      setCollaboratorError(error.message || 'Failed to invite collaborator.')
    },
  })

  const respondInviteMutation = useMutation({
    mutationFn: (accept: boolean) => respondInvite(id!, { accept }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', id] })
      setCollaboratorError('')
    },
    onError: (error: Error) => {
      setCollaboratorError(error.message || 'Failed to respond to invite.')
    },
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (email: string) => removeInvite(id!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', id] })
      setCollaboratorError('')
    },
    onError: (error: Error) => {
      setCollaboratorError(error.message || 'Failed to revoke invite.')
    },
  })

  const leaveTripMutation = useMutation({
    mutationFn: () => leaveTrip(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setCollaboratorError('')
      navigate('/')
    },
    onError: (error: Error) => {
      setCollaboratorError(error.message || 'Failed to leave trip.')
    },
  })

  const updateTripMutation = useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string; visibility?: TripVisibility }) =>
      updateTrip(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] })
      setTripDetailsError('')
    },
    onError: (error: Error) => {
      setTripDetailsError(error.message || 'Failed to update trip details.')
    },
  })

  function handleMove(itemId: string, payload: MoveItineraryItemV2Request) {
    setItineraryError('')
    moveItineraryMutation.mutate({ itemId, payload })
  }

  function handleRemove(itemId: string) {
    setItineraryError('')
    deleteItineraryItem(id!, itemId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['itinerary-v2', id] }))
      .catch((error: Error) => {
        setItineraryError(error.message || 'Failed to remove itinerary item.')
      })
  }

  function handleAddItinerary(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!trip) return
    setItineraryError('')
    if (!placeName.trim() || !itemDate || !itemLatitude || !itemLongitude) return

    const lat = parseFloat(itemLatitude)
    const lng = parseFloat(itemLongitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    if (itemDate < trip.startDate || itemDate > trip.endDate) {
      setItineraryError(`Date must be between ${trip.startDate} and ${trip.endDate}.`)
      return
    }

    addItineraryMutation.mutate({
      placeName: placeName.trim(),
      notes: itemNotes || undefined,
      latitude: lat,
      longitude: lng,
      dayNumber: toDayNumber(itemDate, trip.startDate),
    })
  }

  function handleAddExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!trip) return
    setExpenseError('')
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt < 0 || !expenseDate) return
    if (expenseDate < trip.startDate || expenseDate > trip.endDate) {
      setExpenseError(`Date must be between ${trip.startDate} and ${trip.endDate}.`)
      return
    }
    createExpenseMutation.mutate({
      amount: amt,
      currency,
      description: expenseDesc || undefined,
      date: expenseDate,
    })
  }

  function handleInviteSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCollaboratorError('')
    if (!inviteEmail.trim()) {
      setCollaboratorError('Invite email is required.')
      return
    }
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole })
  }

  function handleUpdateTripDetails(e: FormEvent<HTMLFormElement>, canEditPrivacy: boolean) {
    e.preventDefault()
    setTripDetailsError('')

    if (!tripName.trim()) {
      setTripDetailsError('Trip name is required.')
      return
    }
    if (!tripStartDate || !tripEndDate) {
      setTripDetailsError('Start date and end date are required.')
      return
    }
    if (tripStartDate > tripEndDate) {
      setTripDetailsError('Start date must be before or equal to end date.')
      return
    }

    updateTripMutation.mutate({
      name: tripName.trim(),
      startDate: tripStartDate,
      endDate: tripEndDate,
      visibility: canEditPrivacy ? tripVisibility : undefined,
    })
  }

  useEffect(() => {
    if (!trip) return
    setTripName(trip.name)
    setTripStartDate(trip.startDate)
    setTripEndDate(trip.endDate)
    setTripVisibility((trip.visibility ?? 'PRIVATE') as TripVisibility)
  }, [trip])

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

  if (!id) return null
  if (isTripLoading || isItineraryLoading || !trip || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  const myRole = collaborators?.memberships.find((member) => member.userId === user?.id)?.role
  const isOwner = myRole === 'OWNER'
  const isEditor = myRole === 'EDITOR'
  const isMember = Boolean(myRole)
  const isPendingInvitee = Boolean(
    collaborators?.invites.some(
      (invite) => invite.status === 'PENDING' && invite.email.toLowerCase() === user?.email?.toLowerCase()
    )
  )
  const canEditTripDetails = isOwner || isEditor
  const canEditPrivacy = isOwner
  const canEditPlanning = isOwner || isEditor || isPendingInvitee

  return (
    <div className="min-h-screen bg-slate-50">
      <TripDetailHeader
        tripName={trip.name}
        userDisplayName={user?.displayName ?? 'Guest'}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <TripDetailsSection
          trip={trip}
          tripDetailsError={tripDetailsError}
          canEditTripDetails={canEditTripDetails}
          canEditPrivacy={canEditPrivacy}
          tripName={tripName}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          tripVisibility={tripVisibility}
          isSaving={updateTripMutation.isPending}
          onTripNameChange={setTripName}
          onTripStartDateChange={setTripStartDate}
          onTripEndDateChange={setTripEndDate}
          onTripVisibilityChange={setTripVisibility}
          onSubmit={handleUpdateTripDetails}
        />

        <ItinerarySection
          trip={trip}
          itinerary={itinerary}
          canEditPlanning={canEditPlanning}
          showItineraryForm={showItineraryForm}
          itineraryLoadError={itineraryLoadError}
          itineraryError={itineraryError}
          placeName={placeName}
          itemDate={itemDate}
          itemNotes={itemNotes}
          itemLatitude={itemLatitude}
          itemLongitude={itemLongitude}
          isAddPending={addItineraryMutation.isPending}
          isMovePending={moveItineraryMutation.isPending}
          onShowForm={() => setShowItineraryForm(true)}
          onHideForm={() => setShowItineraryForm(false)}
          onPlaceNameChange={setPlaceName}
          onItemDateChange={setItemDate}
          onItemNotesChange={setItemNotes}
          onItemLatitudeChange={setItemLatitude}
          onItemLongitudeChange={setItemLongitude}
          onAddItinerary={handleAddItinerary}
          onMove={handleMove}
          onRemove={handleRemove}
        />

        <CollaboratorsSection
          isAuthenticated={isAuthenticated}
          collaborators={collaborators}
          collaboratorsLoadError={collaboratorsLoadError}
          collaboratorError={collaboratorError}
          isCollaboratorsLoading={isCollaboratorsLoading}
          isOwner={isOwner}
          isMember={isMember}
          userEmail={user?.email}
          inviteEmail={inviteEmail}
          inviteRole={inviteRole}
          isInvitePending={inviteMutation.isPending}
          isRespondPending={respondInviteMutation.isPending}
          isRevokePending={revokeInviteMutation.isPending}
          isLeavePending={leaveTripMutation.isPending}
          onInviteEmailChange={setInviteEmail}
          onInviteRoleChange={setInviteRole}
          onInviteSubmit={handleInviteSubmit}
          onAcceptInvite={() => {
            setCollaboratorError('')
            respondInviteMutation.mutate(true)
          }}
          onDeclineInvite={() => {
            setCollaboratorError('')
            respondInviteMutation.mutate(false)
          }}
          onRevokeInvite={(email) => {
            setCollaboratorError('')
            revokeInviteMutation.mutate(email)
          }}
          onLeaveTrip={() => {
            setCollaboratorError('')
            leaveTripMutation.mutate()
          }}
        />

        <ExpensesSection
          trip={trip}
          expenses={expenses}
          totalExpenses={totalExpenses}
          canEditPlanning={canEditPlanning}
          showExpenseForm={showExpenseForm}
          amount={amount}
          currency={currency}
          expenseDesc={expenseDesc}
          expenseDate={expenseDate}
          expenseError={expenseError}
          isCreatePending={createExpenseMutation.isPending}
          onShowForm={() => setShowExpenseForm(true)}
          onHideForm={() => setShowExpenseForm(false)}
          onAmountChange={setAmount}
          onCurrencyChange={setCurrency}
          onExpenseDescChange={setExpenseDesc}
          onExpenseDateChange={setExpenseDate}
          onAddExpense={handleAddExpense}
          onDeleteExpense={(expenseId) => deleteExpenseMutation.mutate(expenseId)}
        />

        {isOwner && (
          <div className="mt-10 pt-6 border-t border-slate-200">
            <button
              onClick={() => deleteTripMutation.mutate()}
              disabled={deleteTripMutation.isPending}
              className="text-red-600 text-sm hover:underline disabled:opacity-50"
            >
              Delete trip
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
