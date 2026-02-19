import { api } from './client'

export interface ItineraryItemV2 {
  id: string
  placeName: string
  notes: string
  latitude: number
  longitude: number
  dayNumber: number | null
}

export interface DayContainer {
  dayNumber: number
  date: string
  items: ItineraryItemV2[]
}

export interface PlacesToVisitContainer {
  label: string
  items: ItineraryItemV2[]
}

export interface ItineraryV2Response {
  days: DayContainer[]
  placesToVisit: PlacesToVisitContainer
}

export interface ItineraryItemV2Request {
  placeName: string
  notes?: string
  latitude: number
  longitude: number
  dayNumber?: number
}

export interface MoveItineraryItemV2Request {
  targetDayNumber?: number
  beforeItemId?: string
  afterItemId?: string
}

export async function fetchItineraryV2(tripId: string) {
  return api.get<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2`)
}

export async function addItineraryItem(tripId: string, data: ItineraryItemV2Request) {
  return api.post<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items`, data)
}

export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  data: ItineraryItemV2Request
) {
  return api.put<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}`, data)
}

export async function moveItineraryItem(
  tripId: string,
  itemId: string,
  data: MoveItineraryItemV2Request
) {
  return api.post<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}/move`, data)
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  return api.delete<ItineraryV2Response>(`/trips/${tripId}/itinerary/v2/items/${itemId}`)
}
