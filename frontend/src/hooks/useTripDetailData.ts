import { useQuery } from '@tanstack/react-query'
import { fetchTrip } from '../api/trips'
import { fetchItineraryV2 } from '../api/itinerary'
import { fetchExpenses } from '../api/expenses'
import { fetchCollaborators } from '../api/collaborators'

interface UseTripDetailDataOptions {
  id?: string
  isAuthenticated: boolean
}

export function useTripDetailData({ id, isAuthenticated }: UseTripDetailDataOptions) {
  const tripQuery = useQuery({
    queryKey: ['trip', id],
    queryFn: () => fetchTrip(id!),
    enabled: Boolean(id),
  })

  const itineraryQuery = useQuery({
    queryKey: ['itinerary-v2', id],
    queryFn: () => fetchItineraryV2(id!),
    enabled: Boolean(id),
  })

  const expensesQuery = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => fetchExpenses(id!),
    enabled: Boolean(id),
  })

  const collaboratorsQuery = useQuery({
    queryKey: ['collaborators', id],
    queryFn: () => fetchCollaborators(id!),
    enabled: Boolean(id) && isAuthenticated,
  })

  return {
    trip: tripQuery.data,
    isTripLoading: tripQuery.isLoading,
    itinerary: itineraryQuery.data,
    isItineraryLoading: itineraryQuery.isLoading,
    itineraryLoadError: itineraryQuery.error,
    expenses: expensesQuery.data ?? [],
    collaborators: collaboratorsQuery.data,
    isCollaboratorsLoading: collaboratorsQuery.isLoading,
    collaboratorsLoadError: collaboratorsQuery.error,
  }
}
