import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import {
  addItineraryItem,
  deleteItineraryItemV2,
  fetchItineraryV2,
  moveItineraryItemV2,
  updateItineraryItemV2,
} from './itinerary'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('itinerary api v2', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ token: null, user: null })
  })

  it('fetches v2 itinerary with auth header (happy path)', async () => {
    useAuthStore.setState({ token: 'token-1' })
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [{ dayNumber: 1, date: '2026-01-01', items: [] }],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchItineraryV2('trip-1')

    expect(result.days).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-1/itinerary/v2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
        }),
      })
    )
  })

  it('allows empty itinerary containers (empty state)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchItineraryV2('trip-1')

    expect(result.days).toEqual([])
    expect(result.placesToVisit.items).toEqual([])
  })

  it('omits auth header when user is anonymous (permission variant)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchItineraryV2('trip-2')

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    const headers = requestInit.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('throws backend validation message on add failure (validation failure)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ message: 'dayNumber must be >= 1' }, 400)
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      addItineraryItem('trip-1', {
        placeName: 'Museum',
        latitude: 1,
        longitude: 1,
        dayNumber: 0,
      })
    ).rejects.toThrow('dayNumber must be >= 1')
  })

  it('posts move payload with ordering anchors (edge case)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await moveItineraryItemV2('trip-5', 'item-2', {
      targetDayNumber: 3,
      beforeItemId: 'item-7',
      afterItemId: 'item-6',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-5/itinerary/v2/items/item-2/move',
      expect.objectContaining({
        method: 'POST',
      })
    )
    const payload = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as {
      targetDayNumber: number
      beforeItemId: string
      afterItemId: string
    }
    expect(payload.targetDayNumber).toBe(3)
    expect(payload.beforeItemId).toBe('item-7')
    expect(payload.afterItemId).toBe('item-6')
  })

  it('puts update payload to v2 item route', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await updateItineraryItemV2('trip-3', 'item-9', {
      placeName: 'Cafe',
      notes: 'Lunch',
      latitude: 48.85,
      longitude: 2.35,
      dayNumber: 2,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-3/itinerary/v2/items/item-9',
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  it('deletes by item id path (regression: no index route)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        days: [],
        placesToVisit: { label: 'Places To Visit', items: [] },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await deleteItineraryItemV2('trip-9', 'item-42')

    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-9/itinerary/v2/items/item-42',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('surfaces status text when backend returns non-json error (error state)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: 'Internal Server Error' })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(deleteItineraryItemV2('trip-1', 'item-1')).rejects.toThrow(
      'Internal Server Error'
    )
  })
})
