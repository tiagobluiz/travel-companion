import type { FormEvent } from 'react'
import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import type { Trip } from '../../../../api/trips'
import { ItineraryBoard } from '../itinerary/ItineraryBoard'

interface ItinerarySectionProps {
  trip: Trip
  itinerary: ItineraryV2Response
  isItineraryLoading: boolean
  canEditPlanning: boolean
  showItineraryForm: boolean
  itineraryLoadError: unknown
  itineraryError: string
  placeName: string
  itemDate: string
  itemNotes: string
  itemLatitude: string
  itemLongitude: string
  isAddPending: boolean
  isMovePending: boolean
  onShowForm: () => void
  onHideForm: () => void
  onPlaceNameChange: (value: string) => void
  onItemDateChange: (value: string) => void
  onItemNotesChange: (value: string) => void
  onItemLatitudeChange: (value: string) => void
  onItemLongitudeChange: (value: string) => void
  onAddItinerary: (e: FormEvent<HTMLFormElement>) => void
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onRemove: (itemId: string) => void
}

export function ItinerarySection({
  trip,
  itinerary,
  isItineraryLoading,
  canEditPlanning,
  showItineraryForm,
  itineraryLoadError,
  itineraryError,
  placeName,
  itemDate,
  itemNotes,
  itemLatitude,
  itemLongitude,
  isAddPending,
  isMovePending,
  onShowForm,
  onHideForm,
  onPlaceNameChange,
  onItemDateChange,
  onItemNotesChange,
  onItemLatitudeChange,
  onItemLongitudeChange,
  onAddItinerary,
  onMove,
  onRemove,
}: ItinerarySectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Itinerary</h2>
      {itineraryError && (
        <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">{itineraryError}</div>
      )}

      {canEditPlanning && showItineraryForm && (
        <form onSubmit={onAddItinerary} className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
          <input
            type="text"
            placeholder="Place or activity"
            value={placeName}
            onChange={(e) => onPlaceNameChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={itemDate}
              onChange={(e) => onItemDateChange(e.target.value)}
              min={trip.startDate}
              max={trip.endDate}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <input
            type="text"
            placeholder="Notes"
            value={itemNotes}
            onChange={(e) => onItemNotesChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={itemLatitude}
              onChange={(e) => onItemLatitudeChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={itemLongitude}
              onChange={(e) => onItemLongitudeChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isAddPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onHideForm}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {canEditPlanning && !showItineraryForm && (
        <button onClick={onShowForm} className="mb-4 text-sm text-primary-600 hover:underline">
          + Add place
        </button>
      )}
      {!canEditPlanning && (
        <p className="mb-4 text-sm text-slate-500">
          Read-only itinerary view. Only editors and owners can plan items.
        </p>
      )}

      <ItineraryBoard
        itinerary={itinerary}
        isLoading={isItineraryLoading}
        loadError={itineraryLoadError}
        canEditPlanning={canEditPlanning}
        isMovePending={isMovePending}
        onMove={onMove}
        onRemove={onRemove}
      />
    </section>
  )
}
