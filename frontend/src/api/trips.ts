import { api } from './client'

export interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  visibility: TripVisibility
  status: TripStatus
  itineraryItems: ItineraryItem[]
  createdAt: string
}

export type TripVisibility = 'PUBLIC' | 'PRIVATE'
export type TripStatus = 'ACTIVE' | 'ARCHIVED'
export type TripListStatusFilter = TripStatus | 'ALL'

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

function normalizeTripStatus(status: unknown): TripStatus {
  if (typeof status === 'string') {
    const normalized = status.toUpperCase()
    if (normalized === 'ACTIVE' || normalized === 'ARCHIVED') {
      return normalized
    }
  }
  return 'ACTIVE'
}

function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    status: normalizeTripStatus((trip as { status?: unknown }).status),
  }
}

export async function fetchTrips(status: TripListStatusFilter = 'ACTIVE') {
  const trips = await api.get<Trip[]>(`/trips?status=${status}`)
  const normalizedTrips = trips.map(normalizeTrip)
  if (status === 'ALL') return normalizedTrips
  // Fallback for backend instances that ignore the status query filter.
  return normalizedTrips.filter((trip) => trip.status === status)
}

export async function fetchTrip(id: string) {
  return normalizeTrip(await api.get<Trip>(`/trips/${id}`))
}

export async function createTrip(data: CreateTripRequest) {
  return normalizeTrip(await api.post<Trip>('/trips', data))
}

export type UpdateTripRequest = Partial<CreateTripRequest>

export async function updateTrip(id: string, data: UpdateTripRequest) {
  return normalizeTrip(await api.put<Trip>(`/trips/${id}`, data))
}

export async function deleteTrip(id: string) {
  return api.delete(`/trips/${id}`)
}

export async function archiveTrip(id: string) {
  return normalizeTrip(await api.post<Trip>(`/trips/${id}/archive`, {}))
}

export async function restoreTrip(id: string) {
  return normalizeTrip(await api.post<Trip>(`/trips/${id}/restore`, {}))
}
