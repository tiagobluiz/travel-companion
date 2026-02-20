import type {
  ItineraryV2Response,
  MoveItineraryItemV2Request,
  ItineraryItemV2,
} from '../../../../api/itinerary'
import type { Trip } from '../../../../api/trips'
import { ItineraryBoard } from '../itinerary/ItineraryBoard'
import {
  ItemForm,
  type ItemFormCreatePayload,
  type ItemFormEditPayload,
} from '../itinerary/ItemForm'

interface ItinerarySectionProps {
  trip: Trip
  itinerary: ItineraryV2Response
  isItineraryLoading: boolean
  canEditPlanning: boolean
  showItineraryForm: boolean
  itineraryLoadError: unknown
  itineraryError: string
  isAddPending: boolean
  isMovePending: boolean
  isEditPending: boolean
  onShowForm: () => void
  onHideForm: () => void
  onAddItinerary: (payload: ItemFormCreatePayload) => void
  onEditItinerary: (item: ItineraryItemV2, payload: ItemFormEditPayload) => Promise<void> | void
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
  isAddPending,
  isMovePending,
  isEditPending,
  onShowForm,
  onHideForm,
  onAddItinerary,
  onEditItinerary,
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
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
          <ItemForm
            mode="create"
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            isPending={isAddPending}
            errorMessage={itineraryError}
            onCreate={onAddItinerary}
            onCancel={onHideForm}
          />
        </div>
      )}

      {canEditPlanning && !showItineraryForm && (
        <button onClick={onShowForm} className="mb-4 text-sm text-primary-600 hover:underline">
          + Add place
        </button>
      )}
      {!canEditPlanning && (
        <p className="mb-4 text-sm text-slate-500">
          Read-only itinerary view. Editors/owners (and pending invitees) can plan items.
        </p>
      )}

      <ItineraryBoard
        itinerary={itinerary}
        isLoading={isItineraryLoading}
        loadError={itineraryLoadError}
        canEditPlanning={canEditPlanning}
        isMovePending={isMovePending}
        isEditPending={isEditPending}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        onMove={onMove}
        onEdit={(itemId, payload) => {
          const item =
            itinerary.days.flatMap((day) => day.items).find((dayItem) => dayItem.id === itemId) ??
            itinerary.placesToVisit.items.find((placeItem) => placeItem.id === itemId)
          if (!item) return Promise.resolve()
          return onEditItinerary(item, payload)
        }}
        onRemove={onRemove}
      />
    </section>
  )
}
