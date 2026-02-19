import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addItineraryItem,
  deleteItineraryItem,
  moveItineraryItem,
  type ItineraryItemV2Request,
  type MoveItineraryItemV2Request,
} from '../api/itinerary'
import { deleteTrip, updateTrip, type TripVisibility } from '../api/trips'

interface UseTripMutationsOptions {
  tripId?: string
  onTripDeleted?: () => void
}

export function useTripMutations({ tripId, onTripDeleted }: UseTripMutationsOptions) {
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
      onTripDeleted?.()
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
    updateTripMutation,
    addItineraryMutation,
    moveItineraryMutation,
    removeItineraryMutation,
  }
}
