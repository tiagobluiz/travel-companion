import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTripMutations } from './useTripMutations'

const mockAddItineraryItem = vi.fn()
const mockUpdateItineraryItem = vi.fn()
const mockMoveItineraryItem = vi.fn()
const mockDeleteItineraryItem = vi.fn()
const mockDeleteTrip = vi.fn()
const mockUpdateTrip = vi.fn()

vi.mock('../api/itinerary', () => ({
  addItineraryItem: (...args: unknown[]) => mockAddItineraryItem(...args),
  updateItineraryItem: (...args: unknown[]) => mockUpdateItineraryItem(...args),
  moveItineraryItem: (...args: unknown[]) => mockMoveItineraryItem(...args),
  deleteItineraryItem: (...args: unknown[]) => mockDeleteItineraryItem(...args),
}))

vi.mock('../api/trips', () => ({
  deleteTrip: (...args: unknown[]) => mockDeleteTrip(...args),
  updateTrip: (...args: unknown[]) => mockUpdateTrip(...args),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTripMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates trip and itinerary queries after add/move/remove', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    mockAddItineraryItem.mockResolvedValue({})
    mockMoveItineraryItem.mockResolvedValue({})
    mockDeleteItineraryItem.mockResolvedValue({})

    const { result } = renderHook(() => useTripMutations({ tripId: 'trip-1' }), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.addItineraryMutation.mutateAsync({
        placeName: 'Louvre',
        latitude: 1,
        longitude: 1,
        dayNumber: 1,
      })
      await result.current.moveItineraryMutation.mutateAsync({
        itemId: 'item-1',
        payload: { targetDayNumber: 2 },
      })
      await result.current.removeItineraryMutation.mutateAsync('item-1')
    })

    expect(mockAddItineraryItem).toHaveBeenCalledWith('trip-1', expect.any(Object))
    expect(mockMoveItineraryItem).toHaveBeenCalledWith('trip-1', 'item-1', { targetDayNumber: 2 })
    expect(mockDeleteItineraryItem).toHaveBeenCalledWith('trip-1', 'item-1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trip', 'trip-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['itinerary-v2', 'trip-1'] })
  })

  it('invalidates trip and itinerary queries after itinerary edit mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    mockUpdateItineraryItem.mockResolvedValue({})

    const { result } = renderHook(() => useTripMutations({ tripId: 'trip-1' }), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.updateItineraryMutation.mutateAsync({
        itemId: 'item-1',
        data: {
          placeName: 'Louvre',
          latitude: 1,
          longitude: 1,
          notes: 'Updated',
          dayNumber: undefined,
        },
      })
    })

    expect(mockUpdateItineraryItem).toHaveBeenCalledWith('trip-1', 'item-1', {
      placeName: 'Louvre',
      latitude: 1,
      longitude: 1,
      notes: 'Updated',
      dayNumber: undefined,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trip', 'trip-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['itinerary-v2', 'trip-1'] })
  })

  it('invalidates trip, itinerary, and trips queries after update mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    mockUpdateTrip.mockResolvedValue({})

    const { result } = renderHook(() => useTripMutations({ tripId: 'trip-1' }), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.updateTripMutation.mutateAsync({
        name: 'Updated',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
    })

    expect(mockUpdateTrip).toHaveBeenCalledWith('trip-1', {
      name: 'Updated',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trip', 'trip-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['itinerary-v2', 'trip-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trips'] })
  })

  it('invalidates trips and calls callback after delete', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onTripDeleted = vi.fn()
    mockDeleteTrip.mockResolvedValue({})

    const { result } = renderHook(
      () => useTripMutations({ tripId: 'trip-2', onTripDeleted }),
      { wrapper: createWrapper(queryClient) }
    )

    await act(async () => {
      await result.current.deleteTripMutation.mutateAsync()
    })

    expect(mockDeleteTrip).toHaveBeenCalledWith('trip-2')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trips'] })
    expect(onTripDeleted).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate when itinerary mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    mockAddItineraryItem.mockRejectedValue(new Error('Add failed'))

    const { result } = renderHook(() => useTripMutations({ tripId: 'trip-3' }), {
      wrapper: createWrapper(queryClient),
    })

    await expect(
      result.current.addItineraryMutation.mutateAsync({
        placeName: 'Museum',
        latitude: 1,
        longitude: 1,
      })
    ).rejects.toThrow('Add failed')

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['trip', 'trip-3'] })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['itinerary-v2', 'trip-3'] })
  })

  it('fails fast with clear error when tripId is missing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useTripMutations({ tripId: undefined }), {
      wrapper: createWrapper(queryClient),
    })

    await expect(result.current.deleteTripMutation.mutateAsync()).rejects.toThrow(
      'tripId is required to perform trip mutations'
    )
    await expect(
      result.current.addItineraryMutation.mutateAsync({
        placeName: 'Museum',
        latitude: 1,
        longitude: 1,
      })
    ).rejects.toThrow('tripId is required to perform trip mutations')

    expect(mockDeleteTrip).not.toHaveBeenCalled()
    expect(mockAddItineraryItem).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['trip', undefined] })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['itinerary-v2', undefined] })
  })
})
