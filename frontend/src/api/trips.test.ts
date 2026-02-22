import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import { fetchTrip, fetchTrips } from './trips'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('trips api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ token: null, user: null })
  })

  it('normalizes trip status from backend response (lowercase/missing -> uppercase ACTIVE)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'trip-1',
          name: 'Paris',
          startDate: '2026-01-01',
          endDate: '2026-01-03',
          visibility: 'PRIVATE',
          status: 'active',
          itineraryItems: [],
          createdAt: '2026-01-01T00:00:00Z',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'trip-2',
          name: 'Rome',
          startDate: '2026-02-01',
          endDate: '2026-02-03',
          visibility: 'PRIVATE',
          itineraryItems: [],
          createdAt: '2026-02-01T00:00:00Z',
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const lowercaseStatusTrip = await fetchTrip('trip-1')
    const missingStatusTrip = await fetchTrip('trip-2')

    expect(lowercaseStatusTrip.status).toBe('ACTIVE')
    expect(missingStatusTrip.status).toBe('ACTIVE')
  })

  it('applies client-side status fallback filtering if backend ignores query param', async () => {
    const tripsPayload = [
      {
        id: 'trip-a',
        name: 'Active Trip',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        itineraryItems: [],
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'trip-b',
        name: 'Archived Trip',
        startDate: '2026-01-03',
        endDate: '2026-01-04',
        visibility: 'PRIVATE',
        status: 'ARCHIVED',
        itineraryItems: [],
        createdAt: '2026-01-03T00:00:00Z',
      },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(tripsPayload))
      .mockResolvedValueOnce(jsonResponse(tripsPayload))
      .mockResolvedValueOnce(jsonResponse(tripsPayload))
    vi.stubGlobal('fetch', fetchMock)

    const archivedTrips = await fetchTrips('ARCHIVED')
    const activeTrips = await fetchTrips('ACTIVE')
    const allTrips = await fetchTrips('ALL')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/trips?status=ARCHIVED',
      expect.objectContaining({ method: 'GET' })
    )
    expect(archivedTrips.map((trip) => trip.id)).toEqual(['trip-b'])
    expect(activeTrips.map((trip) => trip.id)).toEqual(['trip-a'])
    expect(allTrips.map((trip) => trip.id)).toEqual(['trip-a', 'trip-b'])
  })
})
