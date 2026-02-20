import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { type TripVisibility } from '../../../api/trips'
import {
  type ItineraryItemV2,
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
import { useTripMutations } from '../../../hooks/useTripMutations'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import { CollaboratorsSection } from './detail/CollaboratorsSection'
import { ExpensesSection } from './detail/ExpensesSection'
import { ItinerarySection } from './detail/ItinerarySection'
import { TripDetailHeader } from './detail/TripDetailHeader'
import { TripDetailsSection } from './detail/TripDetailsSection'

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const isAuthenticated = Boolean(token)

  const [showItineraryForm, setShowItineraryForm] = useState(false)
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
    tripLoadError,
    itinerary,
    isItineraryLoading,
    itineraryLoadError,
    expenses,
    collaborators,
    isCollaboratorsLoading,
    collaboratorsLoadError,
  } = useTripDetailData({ id, isAuthenticated })

  const {
    deleteTripMutation,
    updateTripMutation,
    addItineraryMutation,
    updateItineraryMutation,
    moveItineraryMutation,
    removeItineraryMutation,
  } = useTripMutations({
    tripId: id,
    onTripDeleted: () => {
      navigate('/')
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

  function handleMove(itemId: string, payload: MoveItineraryItemV2Request) {
    setItineraryError('')
    moveItineraryMutation.mutate(
      { itemId, payload },
      {
        onError: (error: Error) => {
          setItineraryError(error.message || 'Failed to move itinerary item.')
        },
      }
    )
  }

  function handleRemove(itemId: string) {
    setItineraryError('')
    removeItineraryMutation.mutate(itemId, {
      onError: (error: Error) => {
        setItineraryError(error.message || 'Failed to remove itinerary item.')
      },
    })
  }

  function handleAddItinerary(payload: {
    placeName: string
    notes?: string
    latitude: number
    longitude: number
    dayNumber?: number
  }) {
    setItineraryError('')
    addItineraryMutation.mutate(
      payload,
      {
        onSuccess: () => {
          setShowItineraryForm(false)
        },
        onError: (error: Error) => {
          setItineraryError(error.message || 'Failed to add itinerary item.')
        },
      }
    )
  }

  async function handleEditItinerary(item: ItineraryItemV2, payload: { notes?: string; dayNumber?: number }) {
    setItineraryError('')
    try {
      await updateItineraryMutation.mutateAsync({
        itemId: item.id,
        data: {
          placeName: item.placeName,
          notes: payload.notes,
          latitude: item.latitude,
          longitude: item.longitude,
          dayNumber: payload.dayNumber,
        },
      })
    } catch (error) {
      setItineraryError(getErrorMessage(error, 'Failed to update itinerary item.'))
      throw error
    }
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

    updateTripMutation.mutate(
      {
        name: tripName.trim(),
        startDate: tripStartDate,
        endDate: tripEndDate,
        visibility: canEditPrivacy ? tripVisibility : undefined,
      },
      {
        onSuccess: () => {
          setTripDetailsError('')
        },
        onError: (error: Error) => {
          setTripDetailsError(error.message || 'Failed to update trip details.')
        },
      }
    )
  }

  useEffect(() => {
    if (!trip) return
    setTripName(trip.name)
    setTripStartDate(trip.startDate)
    setTripEndDate(trip.endDate)
    setTripVisibility((trip.visibility ?? 'PRIVATE') as TripVisibility)
  }, [trip])

  const totalExpenses = expenses.reduce((sum, expense) => {
    const parsedAmount = parseFloat(expense.amount)
    return sum + (Number.isNaN(parsedAmount) ? 0 : parsedAmount)
  }, 0)

  if (!id) return null
  if (tripLoadError || itineraryLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {getErrorMessage(
            tripLoadError ?? itineraryLoadError,
            'Failed to load trip details.'
          )}
        </div>
      </div>
    )
  }

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
          isItineraryLoading={isItineraryLoading}
          canEditPlanning={canEditPlanning}
          showItineraryForm={showItineraryForm}
          itineraryLoadError={itineraryLoadError}
          itineraryError={itineraryError}
          isAddPending={addItineraryMutation.isPending}
          isMovePending={moveItineraryMutation.isPending}
          isEditPending={updateItineraryMutation.isPending}
          onShowForm={() => setShowItineraryForm(true)}
          onHideForm={() => setShowItineraryForm(false)}
          onAddItinerary={handleAddItinerary}
          onEditItinerary={handleEditItinerary}
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
