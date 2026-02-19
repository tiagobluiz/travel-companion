import { useQuery } from '@tanstack/react-query'
import { fetchItineraryV2 } from '../api/itinerary'
import { fetchTrip } from '../api/trips'

interface UseItineraryV2Options {
  tripId?: string
}

export function useItineraryV2({ tripId }: UseItineraryV2Options) {
  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: Boolean(tripId),
  })

  const itineraryQuery = useQuery({
    queryKey: ['itinerary-v2', tripId],
    queryFn: () => fetchItineraryV2(tripId!),
    enabled: Boolean(tripId),
  })

  return {
    trip: tripQuery.data,
    itinerary: itineraryQuery.data,
    isTripLoading: tripQuery.isLoading,
    isItineraryLoading: itineraryQuery.isLoading,
    tripLoadError: tripQuery.error,
    itineraryLoadError: itineraryQuery.error,
  }
}
