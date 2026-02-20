import type {
  MoveItineraryItemV2Request,
  PlacesToVisitContainer,
} from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'
import { ItineraryItemCard } from './ItineraryItemCard'

interface PlacesToVisitColumnProps {
  placesToVisit: PlacesToVisitContainer
  firstDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  tripStartDate: string
  tripEndDate: string
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => void
  onRemove: (itemId: string) => void
}

export function PlacesToVisitColumn({
  placesToVisit,
  firstDayNumber,
  canEditPlanning,
  isMovePending,
  isEditPending,
  tripStartDate,
  tripEndDate,
  onMove,
  onEdit,
  onRemove,
}: PlacesToVisitColumnProps) {
  return (
    <section className="p-4 bg-white rounded-lg border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-3">{placesToVisit.label}</h3>
      {placesToVisit.items.length === 0 ? (
        <p className="text-slate-500 text-sm">No places waiting to be scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {placesToVisit.items.map((item, itemIndex) => (
            <ItineraryItemCard
              key={item.id}
              item={item}
              canEditPlanning={canEditPlanning}
              isPending={isMovePending || isEditPending}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onEdit={(payload) => onEdit(item.id, payload)}
            >
              <button
                onClick={() =>
                  onMove(item.id, {
                    beforeItemId: placesToVisit.items[itemIndex - 1]?.id,
                  })
                }
                disabled={itemIndex === 0 || isMovePending}
                className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                Move up
              </button>
              <button
                onClick={() =>
                  onMove(item.id, {
                    afterItemId: placesToVisit.items[itemIndex + 1]?.id,
                  })
                }
                disabled={itemIndex === placesToVisit.items.length - 1 || isMovePending}
                className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                Move down
              </button>
              <button
                onClick={() => onMove(item.id, { targetDayNumber: firstDayNumber })}
                disabled={!firstDayNumber || isMovePending}
                className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                To day 1
              </button>
              <button
                  onClick={() => {
                    if (isMovePending || isEditPending) return
                    onRemove(item.id)
                  }}
                  disabled={isMovePending || isEditPending}
                  aria-disabled={isMovePending || isEditPending}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Remove
              </button>
            </ItineraryItemCard>
          ))}
        </ul>
      )}
    </section>
  )
}
