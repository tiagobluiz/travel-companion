import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { MoveItineraryItemV2Request, PlacesToVisitContainer } from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'
import { ItineraryItemCard } from './ItineraryItemCard'
import { SortableItineraryItem } from './dnd/SortableItineraryItem'
import type { ItineraryContainerId } from './dnd/mappers'

interface PlacesToVisitColumnProps {
  containerId: ItineraryContainerId
  placesToVisit: PlacesToVisitContainer
  firstDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  tripStartDate: string
  tripEndDate: string
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => Promise<void> | void
  onRemove: (itemId: string) => void
}

export function PlacesToVisitColumn({
  containerId,
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
  const { setNodeRef } = useDroppable({
    id: containerId,
    data: {
      type: 'container',
      containerId,
    },
  })

  return (
    <section className="p-4 bg-white rounded-lg border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-3">{placesToVisit.label}</h3>
      {placesToVisit.items.length === 0 ? (
        <div ref={setNodeRef} className="min-h-10 rounded-md border border-dashed border-slate-300 p-3">
          <p className="text-slate-500 text-sm">No places waiting to be scheduled.</p>
        </div>
      ) : (
        <SortableContext
          items={placesToVisit.items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul ref={setNodeRef} className="space-y-2">
            {placesToVisit.items.map((item, itemIndex) => (
              <SortableItineraryItem key={item.id} itemId={item.id} containerId={containerId}>
                {({ dragAttributes, dragListeners, isDragging }) => (
                  <div className={isDragging ? 'rounded-lg ring-1 ring-primary-300' : undefined}>
                    <ItineraryItemCard
                      item={item}
                      canEditPlanning={canEditPlanning}
                      isPending={isMovePending || isEditPending}
                      tripStartDate={tripStartDate}
                      tripEndDate={tripEndDate}
                      onEdit={(payload) => onEdit(item.id, payload)}
                    >
                      <button
                        {...dragAttributes}
                        {...dragListeners}
                        aria-label={`Drag ${item.placeName}`}
                        disabled={isMovePending || isEditPending}
                        className="text-xs px-2 py-1 rounded border border-primary-300 text-primary-700 disabled:opacity-40 cursor-grab active:cursor-grabbing"
                      >
                        Drag
                      </button>
                      <button
                        onClick={() => {
                          if (isMovePending || isEditPending) return
                          onMove(item.id, {
                            beforeItemId: placesToVisit.items[itemIndex - 1]?.id,
                          })
                        }}
                        disabled={itemIndex === 0 || isMovePending || isEditPending}
                        aria-disabled={itemIndex === 0 || isMovePending || isEditPending}
                        className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => {
                          if (isMovePending || isEditPending) return
                          onMove(item.id, {
                            afterItemId: placesToVisit.items[itemIndex + 1]?.id,
                          })
                        }}
                        disabled={itemIndex === placesToVisit.items.length - 1 || isMovePending || isEditPending}
                        aria-disabled={itemIndex === placesToVisit.items.length - 1 || isMovePending || isEditPending}
                        className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        onClick={() => {
                          if (isMovePending || isEditPending) return
                          onMove(item.id, { targetDayNumber: firstDayNumber })
                        }}
                        disabled={!firstDayNumber || isMovePending || isEditPending}
                        aria-disabled={!firstDayNumber || isMovePending || isEditPending}
                        className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                      >
                        {firstDayNumber ? `To day ${firstDayNumber}` : 'To first day'}
                      </button>
                      <button
                        onClick={() => onRemove(item.id)}
                        disabled={isMovePending || isEditPending}
                        aria-disabled={isMovePending || isEditPending}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </ItineraryItemCard>
                  </div>
                )}
              </SortableItineraryItem>
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  )
}
