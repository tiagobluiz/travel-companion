import { useQuery } from '@tanstack/react-query'
import { fetchExpenses } from '../api/expenses'
import { fetchCollaborators } from '../api/collaborators'
import { useItineraryV2 } from './useItineraryV2'

interface UseTripDetailDataOptions {
  id?: string
  isAuthenticated: boolean
}

export function useTripDetailData({ id, isAuthenticated }: UseTripDetailDataOptions) {
  const {
    trip,
    itinerary,
    isTripLoading,
    isItineraryLoading,
    tripLoadError,
    itineraryLoadError,
  } = useItineraryV2({ tripId: id })

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
    trip,
    isTripLoading,
    tripLoadError,
    itinerary,
    isItineraryLoading,
    itineraryLoadError,
    expenses: expensesQuery.data ?? [],
    expensesLoadError: expensesQuery.error,
    collaborators: collaboratorsQuery.data,
    isCollaboratorsLoading: collaboratorsQuery.isLoading,
    collaboratorsLoadError: collaboratorsQuery.error,
  }
}
