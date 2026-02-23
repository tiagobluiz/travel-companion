import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { useAuthStore } from '../../../stores/authStore'
import { type TripStatus, type TripVisibility } from '../../../api/trips'
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
import type { ItemFormCreatePayload, ItemFormEditPayload } from './itinerary/ItemForm'
import AuthGateModal from '../auth/AuthGateModal'

function isUnauthorizedMutationError(error: unknown) {
  const message = getErrorMessage(error, '').toLowerCase()
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  )
}

function permissionDeniedMessage(actionLabel: string) {
  return `You do not have permission to ${actionLabel} for this trip.`
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
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
  const [tripActionError, setTripActionError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'archive' | 'restore' | 'delete' | null>(null)
  const [showAuthGate, setShowAuthGate] = useState(false)

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
    archiveTripMutation,
    restoreTripMutation,
    updateTripMutation,
    addItineraryMutation,
    updateItineraryMutation,
    moveItineraryMutation,
    removeItineraryMutation,
  } = useTripMutations({
    tripId: id,
    onTripDeleted: () => {
      navigate('/?tab=active')
    },
    onTripArchived: () => {
      navigate('/?tab=active')
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
    if (!canEditPlanning) {
      setItineraryError(permissionDeniedMessage('modify itinerary items'))
      return
    }
    setItineraryError('')
    moveItineraryMutation.mutate(
      { itemId, payload },
      {
        onError: (error: Error) => {
          if (isUnauthorizedMutationError(error)) {
            setItineraryError(permissionDeniedMessage('move itinerary items'))
            return
          }
          setItineraryError(error.message || 'Failed to move itinerary item.')
        },
      }
    )
  }

  function handleRemove(itemId: string) {
    if (!canEditPlanning) {
      setItineraryError(permissionDeniedMessage('modify itinerary items'))
      return
    }
    setItineraryError('')
    removeItineraryMutation.mutate(itemId, {
      onError: (error: Error) => {
        if (isUnauthorizedMutationError(error)) {
          setItineraryError(permissionDeniedMessage('remove itinerary items'))
          return
        }
        setItineraryError(error.message || 'Failed to remove itinerary item.')
      },
    })
  }

  function handleAddItinerary(payload: ItemFormCreatePayload) {
    if (!canEditPlanning) {
      setItineraryError(permissionDeniedMessage('add itinerary items'))
      setShowItineraryForm(false)
      return
    }
    setItineraryError('')
    addItineraryMutation.mutate(
      payload,
      {
        onSuccess: () => {
          setShowItineraryForm(false)
        },
        onError: (error: Error) => {
          if (isUnauthorizedMutationError(error)) {
            setShowItineraryForm(false)
            setItineraryError(permissionDeniedMessage('add itinerary items'))
            return
          }
          setItineraryError(error.message || 'Failed to add itinerary item.')
        },
      }
    )
  }

  async function handleEditItinerary(item: ItineraryItemV2, payload: ItemFormEditPayload) {
    setItineraryError('')
    try {
      const notes = payload.notes ?? item.notes
      await updateItineraryMutation.mutateAsync({
        itemId: item.id,
        data: {
          placeName: item.placeName,
          notes,
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

  function confirmActionDescription(action: 'archive' | 'restore' | 'delete', status: TripStatus) {
    if (action === 'archive') {
      return {
        title: 'Archive trip?',
        body: 'Archived trips are hidden from active planning and can be restored later.',
        buttonLabel: 'Archive trip',
      }
    }
    if (action === 'restore') {
      return {
        title: 'Restore trip?',
        body: `This trip will return to your active trips list (current status: ${status}).`,
        buttonLabel: 'Restore trip',
      }
    }
    return {
      title: 'Delete trip permanently?',
      body: 'This action cannot be undone.',
      buttonLabel: 'Delete trip',
    }
  }

  function handleConfirmTripAction() {
    if (!confirmAction) return
    setTripActionError('')
    if (confirmAction === 'archive') {
      archiveTripMutation.mutate(undefined, {
        onSuccess: () => setConfirmAction(null),
        onError: (error: Error) => {
          setTripActionError(error.message || 'Failed to archive trip.')
        },
      })
      return
    }
    if (confirmAction === 'restore') {
      restoreTripMutation.mutate(undefined, {
        onSuccess: () => setConfirmAction(null),
        onError: (error: Error) => {
          setTripActionError(error.message || 'Failed to restore trip.')
        },
      })
      return
    }
    deleteTripMutation.mutate(undefined, {
      onSuccess: () => setConfirmAction(null),
      onError: (error: Error) => {
        setTripActionError(error.message || 'Failed to delete trip.')
      },
    })
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
  const canEditTripDetails = isOwner || isEditor
  const canEditPrivacy = isOwner
  const canEditPlanning = isOwner || isEditor
  const isAnonymousPublicViewer = !isAuthenticated && trip.visibility === 'PUBLIC'

  return (
    <div className="min-h-screen bg-slate-50">
      <TripDetailHeader
        tripName={trip.name}
        userDisplayName={user?.displayName ?? 'Guest'}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isAnonymousPublicViewer && (
          <Box sx={{ mb: 3 }}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                p: { xs: 2, sm: 2.5 },
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))',
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LockOpenRoundedIcon color="primary" />
                    <Typography variant="h6">Public trip preview</Typography>
                  </Stack>
                  <Alert icon={false} severity="info" sx={{ py: 0, alignItems: 'center' }}>
                    Read-only mode
                  </Alert>
                </Stack>

                <Typography color="text.secondary">
                  You can explore this trip anonymously. Sign in to copy it into your workspace,
                  edit details, or collaborate with others.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyRoundedIcon />}
                    onClick={() => setShowAuthGate(true)}
                  >
                    Copy this trip
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LoginRoundedIcon />}
                    onClick={() => setShowAuthGate(true)}
                  >
                    Sign in to edit
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        )}

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
            {tripActionError && (
              <div className="mb-3 p-2 rounded-md bg-red-50 text-red-700 text-sm">{tripActionError}</div>
            )}
            {trip.status === 'ACTIVE' ? (
              <button
                onClick={() => {
                  setTripActionError('')
                  setConfirmAction('archive')
                }}
                disabled={archiveTripMutation.isPending || deleteTripMutation.isPending}
                className="mr-3 text-amber-700 text-sm hover:underline disabled:opacity-50"
              >
                Archive trip
              </button>
            ) : (
              <button
                onClick={() => {
                  setTripActionError('')
                  setConfirmAction('restore')
                }}
                disabled={restoreTripMutation.isPending || deleteTripMutation.isPending}
                className="mr-3 text-emerald-700 text-sm hover:underline disabled:opacity-50"
              >
                Restore trip
              </button>
            )}
            <button
              onClick={() => {
                setTripActionError('')
                setConfirmAction('delete')
              }}
              disabled={deleteTripMutation.isPending || archiveTripMutation.isPending || restoreTripMutation.isPending}
              className="text-red-600 text-sm hover:underline disabled:opacity-50"
            >
              Delete trip
            </button>
          </div>
        )}
      </main>

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-20"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-action-title"
          aria-describedby="trip-action-description"
        >
          <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 p-5">
            <h3 id="trip-action-title" className="text-base font-semibold text-slate-900">
              {confirmActionDescription(confirmAction, trip.status).title}
            </h3>
            <p id="trip-action-description" className="mt-2 text-sm text-slate-600">
              {confirmActionDescription(confirmAction, trip.status).body}
            </p>
            {tripActionError && (
              <div
                role="alert"
                className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {tripActionError}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={
                  deleteTripMutation.isPending ||
                  archiveTripMutation.isPending ||
                  restoreTripMutation.isPending
                }
                className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTripAction}
                disabled={
                  deleteTripMutation.isPending ||
                  archiveTripMutation.isPending ||
                  restoreTripMutation.isPending
                }
                className={`px-3 py-2 text-sm rounded text-white disabled:opacity-50 ${
                  confirmAction === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction === 'archive'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmActionDescription(confirmAction, trip.status).buttonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthGateModal
        open={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        returnTo={`${location.pathname}${location.search}`}
        title="Sign in to copy or edit this trip"
      />
    </div>
  )
}
