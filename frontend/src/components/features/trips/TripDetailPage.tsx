import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { deleteTrip, fetchTrip } from '../../../api/trips'
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

  const canEdit = Boolean(token)

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

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  if (!id) return null
  if (isTripLoading || isItineraryLoading || !trip || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

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
            {canEdit && (
              <button onClick={logout} className="text-sm text-primary-600 hover:underline">
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-sm text-slate-500">
          {trip.startDate} - {trip.endDate}
        </div>

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

          {canEdit && showItineraryForm && (
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

          {canEdit && !showItineraryForm && (
            <button
              onClick={() => setShowItineraryForm(true)}
              className="mb-4 text-sm text-primary-600 hover:underline"
            >
              + Add place
            </button>
          )}
          {!canEdit && (
            <p className="mb-4 text-sm text-slate-500">Read-only itinerary view for anonymous users.</p>
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
                        {canEdit && (
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
                      {canEdit && (
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

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Expenses</h2>
          <p className="text-sm text-slate-600 mb-3">Total: {totalExpenses.toFixed(2)}</p>

          {showExpenseForm ? (
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
          ) : (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="mb-4 text-sm text-primary-600 hover:underline"
            >
              + Add expense
            </button>
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
                  <button
                    onClick={() => deleteExpenseMutation.mutate(expense.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <button
            onClick={() => deleteTripMutation.mutate()}
            disabled={deleteTripMutation.isPending}
            className="text-red-600 text-sm hover:underline disabled:opacity-50"
          >
            Delete trip
          </button>
        </div>
      </main>
    </div>
  )
}
