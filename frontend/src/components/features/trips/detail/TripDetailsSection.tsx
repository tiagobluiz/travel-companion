import type { FormEvent } from 'react'
import type { Trip, TripVisibility } from '../../../../api/trips'

interface TripDetailsSectionProps {
  trip: Trip
  tripDetailsError: string
  canEditTripDetails: boolean
  canEditPrivacy: boolean
  tripName: string
  tripStartDate: string
  tripEndDate: string
  tripVisibility: TripVisibility
  isSaving: boolean
  onTripNameChange: (value: string) => void
  onTripStartDateChange: (value: string) => void
  onTripEndDateChange: (value: string) => void
  onTripVisibilityChange: (value: TripVisibility) => void
  onSubmit: (e: FormEvent<HTMLFormElement>, canEditPrivacy: boolean) => void
}

export function TripDetailsSection({
  trip,
  tripDetailsError,
  canEditTripDetails,
  canEditPrivacy,
  tripName,
  tripStartDate,
  tripEndDate,
  tripVisibility,
  isSaving,
  onTripNameChange,
  onTripStartDateChange,
  onTripEndDateChange,
  onTripVisibilityChange,
  onSubmit,
}: TripDetailsSectionProps) {
  return (
    <section className="mb-8 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Trip details</h2>
      {tripDetailsError && (
        <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">{tripDetailsError}</div>
      )}
      {canEditTripDetails ? (
        <form onSubmit={(e) => onSubmit(e, canEditPrivacy)} className="space-y-3">
          <input
            type="text"
            placeholder="Trip name"
            value={tripName}
            onChange={(e) => onTripNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={tripStartDate}
              onChange={(e) => onTripStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              required
            />
            <input
              type="date"
              value={tripEndDate}
              onChange={(e) => onTripEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="trip-visibility" className="block text-xs text-slate-500">
              Privacy
            </label>
            <select
              id="trip-visibility"
              value={tripVisibility}
              onChange={(e) => onTripVisibilityChange(e.target.value as TripVisibility)}
              disabled={!canEditPrivacy}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:opacity-60"
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
            </select>
            {!canEditPrivacy && <p className="text-xs text-slate-500">Only owners can change privacy.</p>}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Save details
          </button>
        </form>
      ) : (
        <div className="text-sm text-slate-600 space-y-1">
          <p>{trip.name}</p>
          <p>
            {trip.startDate} - {trip.endDate}
          </p>
          <p>Privacy: {trip.visibility ?? 'PRIVATE'}</p>
        </div>
      )}
    </section>
  )
}
