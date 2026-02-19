import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { deleteTrip, fetchTrip, updateTrip, type TripVisibility } from '../../../api/trips'
import {
  addItineraryItem,
  deleteItineraryItem,
  fetchItineraryV2,
  moveItineraryItem,
  type ItineraryItemV2Request,
  type MoveItineraryItemV2Request,
} from '../../../api/itinerary'
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  type CreateExpenseRequest,
} from '../../../api/expenses'
import {
  fetchCollaborators,
  inviteMember,
  leaveTrip,
  removeInvite,
  respondInvite,
  type TripRole,
} from '../../../api/collaborators'

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

  const { data: trip, isLoading: isTripLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => fetchTrip(id!),
    enabled: !!id,
  })

  const {
    data: itinerary,
    isLoading: isItineraryLoading,
    error: itineraryLoadError,
  } = useQuery({
    queryKey: ['itinerary-v2', id],
    queryFn: () => fetchItineraryV2(id!),
    enabled: !!id,
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => fetchExpenses(id!),
    enabled: !!id,
  })

  const {
    data: collaborators,
    isLoading: isCollaboratorsLoading,
    error: collaboratorsLoadError,
  } = useQuery({
    queryKey: ['collaborators', id],
    queryFn: () => fetchCollaborators(id!),
    enabled: !!id && isAuthenticated,
  })

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

  function handleAddItinerary(e: React.FormEvent) {
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

  function handleAddExpense(e: React.FormEvent) {
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

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCollaboratorError('')
    if (!inviteEmail.trim()) {
      setCollaboratorError('Invite email is required.')
      return
    }
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole })
  }

  function handleUpdateTripDetails(e: React.FormEvent, canEditPrivacy: boolean) {
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

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:underline">
              {'<-'} Back
            </Link>
            <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.displayName ?? 'Guest'}</span>
            {isAuthenticated && (
              <button onClick={logout} className="text-sm text-primary-600 hover:underline">
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="mb-8 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Trip details</h2>
          {tripDetailsError && (
            <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">{tripDetailsError}</div>
          )}
          {canEditTripDetails ? (
            <form onSubmit={(e) => handleUpdateTripDetails(e, canEditPrivacy)} className="space-y-3">
              <input
                type="text"
                placeholder="Trip name"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                />
                <input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="trip-visibility" className="block text-xs text-slate-500">
                  Privacy
                </label>
                <select
                  id="trip-visibility"
                  value={tripVisibility}
                  onChange={(e) => setTripVisibility(e.target.value as TripVisibility)}
                  disabled={!canEditPrivacy}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:opacity-60"
                >
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
                {!canEditPrivacy && (
                  <p className="text-xs text-slate-500">Only owners can change privacy.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={updateTripMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Save details
              </button>
            </form>
          ) : (
            <div className="text-sm text-slate-600 space-y-1">
              <p>{trip.name}</p>
              <p>
                {trip.startDate} - {trip.endDate}
              </p>
              <p>Privacy: {trip.visibility ?? 'PRIVATE'}</p>
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Itinerary</h2>
          {itineraryLoadError && (
            <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">
              Failed to load itinerary.
            </div>
          )}
          {itineraryError && (
            <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">{itineraryError}</div>
          )}

          {canEditPlanning && showItineraryForm && (
            <form
              onSubmit={handleAddItinerary}
              className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
            >
              <input
                type="text"
                placeholder="Place or activity"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                  min={trip.startDate}
                  max={trip.endDate}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Notes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={itemLatitude}
                  onChange={(e) => setItemLatitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={itemLongitude}
                  onChange={(e) => setItemLongitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addItineraryMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowItineraryForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {canEditPlanning && !showItineraryForm && (
            <button
              onClick={() => setShowItineraryForm(true)}
              className="mb-4 text-sm text-primary-600 hover:underline"
            >
              + Add place
            </button>
          )}
          {!canEditPlanning && (
            <p className="mb-4 text-sm text-slate-500">
              Read-only itinerary view. Editors/owners (and pending invitees) can plan items.
            </p>
          )}

          <div className="space-y-4">
            {itinerary.days.map((day, dayIndex) => (
              <section key={day.dayNumber} className="p-4 bg-white rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Day {day.dayNumber} ({day.date})
                </h3>
                {day.items.length === 0 ? (
                  <p className="text-slate-500 text-sm">No items in this day.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.items.map((item, itemIndex) => (
                      <li
                        key={item.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{item.placeName}</p>
                          {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
                        </div>
                        {canEditPlanning && (
                          <div className="flex flex-wrap items-start gap-2">
                            <button
                              onClick={() =>
                                handleMove(item.id, {
                                  targetDayNumber: day.dayNumber,
                                  beforeItemId: day.items[itemIndex - 1]?.id,
                                })
                              }
                              disabled={itemIndex === 0 || moveItineraryMutation.isPending}
                              className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                            >
                              Move up
                            </button>
                            <button
                              onClick={() =>
                                handleMove(item.id, {
                                  targetDayNumber: day.dayNumber,
                                  afterItemId: day.items[itemIndex + 1]?.id,
                                })
                              }
                              disabled={itemIndex === day.items.length - 1 || moveItineraryMutation.isPending}
                              className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                            >
                              Move down
                            </button>
                            <button
                              onClick={() => handleMove(item.id, {})}
                              disabled={moveItineraryMutation.isPending}
                              className="text-xs px-2 py-1 rounded border border-slate-300"
                            >
                              To places
                            </button>
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                            >
                              Remove
                            </button>
                            {dayIndex > 0 && (
                              <button
                                onClick={() =>
                                  handleMove(item.id, {
                                    targetDayNumber: itinerary.days[dayIndex - 1]?.dayNumber,
                                  })
                                }
                                disabled={moveItineraryMutation.isPending}
                                className="text-xs px-2 py-1 rounded border border-slate-300"
                              >
                                Prev day
                              </button>
                            )}
                            {dayIndex < itinerary.days.length - 1 && (
                              <button
                                onClick={() =>
                                  handleMove(item.id, {
                                    targetDayNumber: itinerary.days[dayIndex + 1]?.dayNumber,
                                  })
                                }
                                disabled={moveItineraryMutation.isPending}
                                className="text-xs px-2 py-1 rounded border border-slate-300"
                              >
                                Next day
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section className="p-4 bg-white rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">{itinerary.placesToVisit.label}</h3>
              {itinerary.placesToVisit.items.length === 0 ? (
                <p className="text-slate-500 text-sm">No places waiting to be scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {itinerary.placesToVisit.items.map((item, itemIndex) => (
                    <li
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium">{item.placeName}</p>
                        {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
                      </div>
                      {canEditPlanning && (
                        <div className="flex flex-wrap items-start gap-2">
                          <button
                            onClick={() =>
                              handleMove(item.id, {
                                beforeItemId: itinerary.placesToVisit.items[itemIndex - 1]?.id,
                              })
                            }
                            disabled={itemIndex === 0 || moveItineraryMutation.isPending}
                            className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                          >
                            Move up
                          </button>
                          <button
                            onClick={() =>
                              handleMove(item.id, {
                                afterItemId: itinerary.placesToVisit.items[itemIndex + 1]?.id,
                              })
                            }
                            disabled={
                              itemIndex === itinerary.placesToVisit.items.length - 1 ||
                              moveItineraryMutation.isPending
                            }
                            className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                          >
                            Move down
                          </button>
                          <button
                            onClick={() =>
                              handleMove(item.id, { targetDayNumber: itinerary.days[0]?.dayNumber })
                            }
                            disabled={!itinerary.days.length || moveItineraryMutation.isPending}
                            className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                          >
                            To day 1
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Collaborators</h2>
          {isAuthenticated ? (
            <>
              {collaboratorsLoadError && (
                <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">
                  {(collaboratorsLoadError as Error).message || 'Failed to load collaborators.'}
                </div>
              )}
              {collaboratorError && (
                <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">{collaboratorError}</div>
              )}
              {isCollaboratorsLoading ? (
                <p className="text-slate-500 text-sm">Loading collaborators...</p>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Members</h3>
                    {!collaborators?.memberships.length ? (
                      <p className="text-slate-500 text-sm">No collaborators yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {collaborators.memberships.map((member) => (
                          <li
                            key={member.userId}
                            className="flex items-center justify-between p-2 rounded-md bg-slate-50"
                          >
                            <span className="text-sm text-slate-700">{member.userId}</span>
                            <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                              {member.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Invites</h3>
                    {!collaborators?.invites.length ? (
                      <p className="text-slate-500 text-sm">No invites yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {collaborators.invites.map((invite) => {
                          const isMyInvite =
                            user?.email?.toLowerCase() === invite.email.toLowerCase() &&
                            invite.status === 'PENDING'
                          return (
                            <li
                              key={`${invite.email}-${invite.status}`}
                              className="p-2 rounded-md bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-700">{invite.email}</span>
                                <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                                  {invite.role}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    invite.status === 'DECLINED'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {invite.status}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {isMyInvite && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setCollaboratorError('')
                                        respondInviteMutation.mutate(true)
                                      }}
                                      className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCollaboratorError('')
                                        respondInviteMutation.mutate(false)
                                      }}
                                      className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                {isOwner && (invite.status === 'PENDING' || invite.status === 'DECLINED') && (
                                  <button
                                    onClick={() => {
                                      setCollaboratorError('')
                                      revokeInviteMutation.mutate(invite.email)
                                    }}
                                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {isOwner && (
                    <form
                      onSubmit={handleInviteSubmit}
                      className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
                    >
                      <h3 className="font-semibold text-slate-900">Invite collaborator</h3>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as TripRole)}
                          className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                          <option value="OWNER">Owner</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviteMutation.isPending}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          Invite
                        </button>
                      </div>
                    </form>
                  )}

                  {isMember && (
                    <button
                      onClick={() => {
                        setCollaboratorError('')
                        leaveTripMutation.mutate()
                      }}
                      disabled={leaveTripMutation.isPending}
                      className="text-sm px-3 py-2 rounded border border-red-300 text-red-700 disabled:opacity-50"
                    >
                      Leave trip
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm">Sign in to manage collaborators and invites.</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Expenses</h2>
          <p className="text-sm text-slate-600 mb-3">Total: {totalExpenses.toFixed(2)}</p>

          {canEditPlanning && showExpenseForm ? (
            <form
              onSubmit={handleAddExpense}
              className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
            >
              {expenseError && (
                <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">{expenseError}</div>
              )}
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Description"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                min={trip.startDate}
                max={trip.endDate}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : canEditPlanning ? (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="mb-4 text-sm text-primary-600 hover:underline"
            >
              + Add expense
            </button>
          ) : (
            <p className="mb-4 text-sm text-slate-500">
              Read-only expenses view. Editors/owners (and pending invitees) can add expenses.
            </p>
          )}

          {expenses.length === 0 ? (
            <p className="text-slate-500 text-sm">No expenses yet.</p>
          ) : (
            <ul className="space-y-2">
              {expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">
                      {expense.currency} {expense.amount}
                    </span>
                    {expense.description && (
                      <p className="text-sm text-slate-500">{expense.description}</p>
                    )}
                    <span className="text-xs text-slate-400">{expense.date}</span>
                  </div>
                  {canEditPlanning && (
                    <button
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

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
