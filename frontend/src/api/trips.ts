import { api } from './client'

export interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  visibility: TripVisibility
  itineraryItems: ItineraryItem[]
  createdAt: string
}

export type TripVisibility = 'PUBLIC' | 'PRIVATE'

export interface ItineraryItem {
  placeName: string
  date: string
  notes: string
  latitude: number
  longitude: number
}

export interface CreateTripRequest {
  name: string
  startDate: string
  endDate: string
  visibility?: TripVisibility
}

export async function fetchTrips() {
  return api.get<Trip[]>('/trips')
}

export async function fetchTrip(id: string) {
  return api.get<Trip>(`/trips/${id}`)
}

export async function createTrip(data: CreateTripRequest) {
  return api.post<Trip>('/trips', data)
}

export type UpdateTripRequest = Partial<CreateTripRequest>

export async function updateTrip(id: string, data: UpdateTripRequest) {
  return api.put<Trip>(`/trips/${id}`, data)
}

export async function deleteTrip(id: string) {
  return api.delete(`/trips/${id}`)
}
