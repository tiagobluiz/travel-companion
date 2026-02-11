import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { fetchTrip, deleteTrip } from '../../../api/trips'
import {
  addItineraryItem,
  deleteItineraryItem,
  type ItineraryItemRequest,
} from '../../../api/itinerary'
import {
  fetchExpenses,
  createExpense,
  deleteExpense,
  type CreateExpenseRequest,
} from '../../../api/expenses'
import { useState } from 'react'

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()

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

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => fetchTrip(id!),
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
    mutationFn: (data: ItineraryItemRequest) => addItineraryItem(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] })
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

  function handleAddItinerary(e: React.FormEvent) {
    e.preventDefault()
    if (!trip) return
    setItineraryError('')
    if (!placeName.trim() || !itemDate || !itemLatitude || !itemLongitude) return
    const lat = parseFloat(itemLatitude)
    const lng = parseFloat(itemLongitude)
    if (isNaN(lat) || isNaN(lng)) return
    if (itemDate < trip.startDate || itemDate > trip.endDate) {
      setItineraryError(`Date must be between ${trip.startDate} and ${trip.endDate}.`)
      return
    }
    addItineraryMutation.mutate({
      placeName: placeName.trim(),
      date: itemDate,
      notes: itemNotes || undefined,
      latitude: lat,
      longitude: lng,
    })
  }

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!trip) return
    setExpenseError('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 0 || !expenseDate) return
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

  // Sum expenses (MVP: ignores multi-currency)
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  )

  if (!id) return null
  if (isLoading || !trip) {
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
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.displayName}</span>
            <button
              onClick={logout}
              className="text-sm text-primary-600 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-sm text-slate-500">
          {trip.startDate} – {trip.endDate}
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Itinerary
          </h2>
          {showItineraryForm ? (
            <form
              onSubmit={handleAddItinerary}
              className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
            >
              {itineraryError && (
                <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">
                  {itineraryError}
                </div>
              )}
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
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 48.8566"
                    value={itemLatitude}
                    onChange={(e) => setItemLatitude(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2.3522"
                    value={itemLongitude}
                    onChange={(e) => setItemLongitude(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
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
          ) : (
            <button
              onClick={() => setShowItineraryForm(true)}
              className="mb-4 text-sm text-primary-600 hover:underline"
            >
              + Add place
            </button>
          )}

          {trip.itineraryItems.length === 0 ? (
            <p className="text-slate-500 text-sm">No itinerary items yet.</p>
          ) : (
            <ul className="space-y-2">
              {trip.itineraryItems.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{item.placeName}</span>
                    <span className="text-slate-500 text-sm ml-2">
                      {item.date}
                    </span>
                    {item.notes && (
                      <p className="text-sm text-slate-500 mt-1">{item.notes}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      deleteItineraryItem(id, idx).then(() =>
                        queryClient.invalidateQueries({ queryKey: ['trip', id] })
                      )
                    }
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Expenses
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Total: {totalExpenses.toFixed(2)}
          </p>

          {showExpenseForm ? (
            <form
              onSubmit={handleAddExpense}
              className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
            >
              {expenseError && (
                <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">
                  {expenseError}
                </div>
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
