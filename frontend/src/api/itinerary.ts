import { api } from './client'
import type { Trip } from './trips'

export interface ItineraryItemRequest {
  placeName: string
  date: string
  notes?: string
  latitude: number
  longitude: number
}

export async function addItineraryItem(tripId: string, data: ItineraryItemRequest) {
  return api.post<Trip>(`/trips/${tripId}/itinerary`, data)
}

export async function updateItineraryItem(
  tripId: string,
  index: number,
  data: ItineraryItemRequest
) {
  return api.put<Trip>(`/trips/${tripId}/itinerary/${index}`, data)
}

export async function deleteItineraryItem(tripId: string, index: number) {
  return api.delete<Trip>(`/trips/${tripId}/itinerary/${index}`)
}
