import { useState, type FormEvent } from 'react'

export type ItemFormMode = 'create' | 'edit'

export interface ItemFormCreatePayload {
  placeName: string
  notes?: string
  latitude: number
  longitude: number
  dayNumber?: number
}

export interface ItemFormEditPayload {
  notes?: string
  dayNumber?: number
}

interface ItemFormProps {
  mode: ItemFormMode
  tripStartDate: string
  tripEndDate: string
  isPending: boolean
  errorMessage?: string
  initialPlaceName?: string
  initialNotes?: string
  initialLatitude?: number
  initialLongitude?: number
  initialDayNumber?: number | null
  onCancel: () => void
  onCreate?: (payload: ItemFormCreatePayload) => void
  onEdit?: (payload: ItemFormEditPayload) => void
}

function toDayNumber(date: string, startDate: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const selectedUtc = Date.UTC(year, month - 1, day)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  return Math.floor((selectedUtc - startUtc) / 86_400_000) + 1
}

function toDateFromDayNumber(dayNumber: number, startDate: string) {
  const [year, month, day] = startDate.split('-').map(Number)
  const startUtc = Date.UTC(year, month - 1, day)
  const dayUtc = startUtc + (dayNumber - 1) * 86_400_000
  return new Date(dayUtc).toISOString().slice(0, 10)
}

export function ItemForm({
  mode,
  tripStartDate,
  tripEndDate,
  isPending,
  errorMessage,
  initialPlaceName = '',
  initialNotes = '',
  initialLatitude,
  initialLongitude,
  initialDayNumber,
  onCancel,
  onCreate,
  onEdit,
}: ItemFormProps) {
  const [placeName, setPlaceName] = useState(initialPlaceName)
  const [notes, setNotes] = useState(initialNotes)
  const [latitude, setLatitude] = useState(
    initialLatitude != null ? String(initialLatitude) : ''
  )
  const [longitude, setLongitude] = useState(
    initialLongitude != null ? String(initialLongitude) : ''
  )
  const [destinationType, setDestinationType] = useState<'DAY' | 'PLACES'>(
    mode === 'create' ? 'DAY' : initialDayNumber != null ? 'DAY' : 'PLACES'
  )
  const [date, setDate] = useState(
    initialDayNumber != null ? toDateFromDayNumber(initialDayNumber, tripStartDate) : ''
  )
  const [validationError, setValidationError] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidationError('')

    let dayNumber: number | undefined
    if (destinationType === 'DAY') {
      if (!date) {
        setValidationError('Date is required when destination is a day.')
        return
      }
      if (date < tripStartDate || date > tripEndDate) {
        setValidationError(`Date must be between ${tripStartDate} and ${tripEndDate}.`)
        return
      }
      dayNumber = toDayNumber(date, tripStartDate)
    }

    if (mode === 'edit') {
      onEdit?.({ notes: notes || undefined, dayNumber })
      return
    }

    if (!placeName.trim() || !latitude || !longitude) {
      setValidationError('Place name, latitude, and longitude are required.')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setValidationError('Latitude and longitude must be valid numbers.')
      return
    }

    onCreate?.({
      placeName: placeName.trim(),
      notes: notes || undefined,
      latitude: lat,
      longitude: lng,
      dayNumber,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {(errorMessage || validationError) && (
        <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">
          {validationError || errorMessage}
        </div>
      )}

      {mode === 'create' && (
        <>
          <input
            type="text"
            placeholder="Place or activity"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <label htmlFor="itinerary-notes" className="block text-xs text-slate-500">
          Notes
        </label>
        <input
          id="itinerary-notes"
          type="text"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="itinerary-destination" className="block text-xs text-slate-500">
          Destination
        </label>
        <select
          id="itinerary-destination"
          value={destinationType}
          onChange={(e) => setDestinationType(e.target.value as 'DAY' | 'PLACES')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
        >
          <option value="DAY">Trip day</option>
          <option value="PLACES">Places To Visit</option>
        </select>
        {destinationType === 'DAY' && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={tripStartDate}
            max={tripEndDate}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {mode === 'create' ? 'Add' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
