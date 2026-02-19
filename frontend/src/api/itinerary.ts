import { api } from './client'
import type {
  ItineraryItemV2Request,
  ItineraryV2Response,
  MoveItineraryItemV2Request,
} from './types/itinerary'

export type {
  DayContainer,
  ItineraryItemV2,
  ItineraryItemV2Request,
  ItineraryV2Response,
  MoveItineraryItemV2Request,
  PlacesToVisitContainer,
} from './types/itinerary'

export async function fetchItineraryV2(tripId: string) {
  return api.get<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2`)
}

export async function addItineraryItem(tripId: string, data: ItineraryItemV2Request) {
  return api.post<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items`, data)
}

export async function updateItineraryItemV2(
  tripId: string,
  itemId: string,
  data: ItineraryItemV2Request
) {
  return api.put<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}`, data)
}

export async function moveItineraryItemV2(
  tripId: string,
  itemId: string,
  data: MoveItineraryItemV2Request
) {
  return api.post<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}/move`, data)
}

export async function deleteItineraryItemV2(tripId: string, itemId: string) {
  return api.delete<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}`)
}

export const updateItineraryItem = updateItineraryItemV2
export const moveItineraryItem = moveItineraryItemV2
export const deleteItineraryItem = deleteItineraryItemV2
