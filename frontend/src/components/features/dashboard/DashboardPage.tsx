import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { fetchTrips, createTrip, type CreateTripRequest, type TripStatus } from '../../../api/trips'
import { useState } from 'react'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const tabParam = searchParams.get('tab')
  const selectedTab: TripStatus = tabParam === 'archived' ? 'ARCHIVED' : 'ACTIVE'

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', selectedTab],
    queryFn: () => fetchTrips(selectedTab),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTripRequest) => createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setShowCreate(false)
      setName('')
      setStartDate('')
      setEndDate('')
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return
    createMutation.mutate({ name: name.trim(), startDate, endDate })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Travel Companion</h1>
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your trips</h2>
            <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setSearchParams({ tab: 'active' })}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedTab === 'ACTIVE'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'archived' })}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedTab === 'ARCHIVED'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Archived
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
          >
            New trip
          </button>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 p-4 bg-white rounded-lg border border-slate-200 space-y-3"
          >
            <input
              type="text"
              placeholder="Trip name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-slate-600">Loading trips...</p>
        ) : trips.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">
              {selectedTab === 'ACTIVE' ? 'No active trips yet' : 'No archived trips'}
            </p>
            {selectedTab === 'ACTIVE' ? (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Create your first trip to start planning.
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-primary-600 font-medium hover:underline"
                >
                  Create a trip
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  to={`/trips/${trip.id}`}
                  className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:shadow-sm transition"
                >
                  <h3 className="font-medium text-slate-900">{trip.name}</h3>
                  <p className="text-sm text-slate-500">
                    {trip.startDate} – {trip.endDate}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
