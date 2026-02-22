import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addItineraryItem,
  deleteItineraryItem,
  moveItineraryItem,
  updateItineraryItem,
  type ItineraryItemV2Request,
  type MoveItineraryItemV2Request,
} from '../api/itinerary'
import { archiveTrip, deleteTrip, restoreTrip, updateTrip, type TripVisibility } from '../api/trips'

interface UseTripMutationsOptions {
  tripId?: string
  onTripDeleted?: () => void
  onTripArchived?: () => void
  onTripRestored?: () => void
}

export function useTripMutations({
  tripId,
  onTripDeleted,
  onTripArchived,
  onTripRestored,
}: UseTripMutationsOptions) {
  const queryClient = useQueryClient()

  function requireTripId() {
    if (!tripId) {
      throw new Error('tripId is required to perform trip mutations')
    }
    return tripId
  }

  function invalidateTripAndItinerary() {
    if (!tripId) return Promise.resolve()
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] }),
      queryClient.invalidateQueries({ queryKey: ['itinerary-v2', tripId] }),
    ])
  }

  const deleteTripMutation = useMutation({
    mutationFn: () => deleteTrip(requireTripId()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      onTripDeleted?.()
    },
  })

  const archiveTripMutation = useMutation({
    mutationFn: () => archiveTrip(requireTripId()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      onTripArchived?.()
    },
  })

  const restoreTripMutation = useMutation({
    mutationFn: () => restoreTrip(requireTripId()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      onTripRestored?.()
    },
  })

  const updateTripMutation = useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string; visibility?: TripVisibility }) =>
      updateTrip(requireTripId(), data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
    },
  })

  const addItineraryMutation = useMutation({
    mutationFn: (data: ItineraryItemV2Request) => addItineraryItem(requireTripId(), data),
    onSuccess: invalidateTripAndItinerary,
  })

  const updateItineraryMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: ItineraryItemV2Request }) =>
      updateItineraryItem(requireTripId(), itemId, data),
    onSuccess: invalidateTripAndItinerary,
  })

  const moveItineraryMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: MoveItineraryItemV2Request }) =>
      moveItineraryItem(requireTripId(), itemId, payload),
    onSuccess: invalidateTripAndItinerary,
  })

  const removeItineraryMutation = useMutation({
    mutationFn: (itemId: string) => deleteItineraryItem(requireTripId(), itemId),
    onSuccess: invalidateTripAndItinerary,
  })

  return {
    deleteTripMutation,
    archiveTripMutation,
    restoreTripMutation,
    updateTripMutation,
    addItineraryMutation,
    updateItineraryMutation,
    moveItineraryMutation,
    removeItineraryMutation,
  }
}
