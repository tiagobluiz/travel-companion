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
