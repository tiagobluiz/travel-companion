import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useItineraryV2 } from './useItineraryV2'

const mockFetchTrip = vi.fn()
const mockFetchItineraryV2 = vi.fn()

vi.mock('../api/trips', () => ({
  fetchTrip: (...args: unknown[]) => mockFetchTrip(...args),
}))

vi.mock('../api/itinerary', () => ({
  fetchItineraryV2: (...args: unknown[]) => mockFetchItineraryV2(...args),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useItineraryV2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not run queries when tripId is missing (enabled condition)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderHook(() => useItineraryV2({ tripId: undefined }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mockFetchTrip).not.toHaveBeenCalled()
      expect(mockFetchItineraryV2).not.toHaveBeenCalled()
    })
  })

  it('uses trip and itinerary query keys for the provided id', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockFetchTrip.mockResolvedValue({ id: 'trip-1', name: 'Paris' })
    mockFetchItineraryV2.mockResolvedValue({
      days: [],
      placesToVisit: { label: 'Places To Visit', items: [] },
    })

    const { result } = renderHook(() => useItineraryV2({ tripId: 'trip-1' }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.trip?.id).toBe('trip-1')
      expect(result.current.itinerary?.placesToVisit.label).toBe('Places To Visit')
    })

    expect(mockFetchTrip).toHaveBeenCalledWith('trip-1')
    expect(mockFetchItineraryV2).toHaveBeenCalledWith('trip-1')
    expect(queryClient.getQueryData(['trip', 'trip-1'])).toBeTruthy()
    expect(queryClient.getQueryData(['itinerary-v2', 'trip-1'])).toBeTruthy()
  })

  it('exposes deterministic error states when queries fail', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockFetchTrip.mockRejectedValue(new Error('Trip fetch failed'))
    mockFetchItineraryV2.mockRejectedValue(new Error('Itinerary fetch failed'))

    const { result } = renderHook(() => useItineraryV2({ tripId: 'trip-2' }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.tripLoadError).toBeInstanceOf(Error)
      expect(result.current.itineraryLoadError).toBeInstanceOf(Error)
    })

    expect((result.current.tripLoadError as Error).message).toBe('Trip fetch failed')
    expect((result.current.itineraryLoadError as Error).message).toBe('Itinerary fetch failed')
  })
})
