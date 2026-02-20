import type {
  ItineraryItemV2,
  MoveItineraryItemV2Request,
  PlacesToVisitContainer,
} from '../../../../api/itinerary'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItineraryItem } from './dnd/SortableItineraryItem'
import type { ItineraryContainerId } from './dnd/mappers'

interface PlacesToVisitColumnProps {
  containerId: ItineraryContainerId
  placesToVisit: PlacesToVisitContainer
  firstDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onRemove: (itemId: string) => void
}

export function PlacesToVisitColumn({
  containerId,
  placesToVisit,
  firstDayNumber,
  canEditPlanning,
  isMovePending,
  onMove,
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
            {placesToVisit.items.map((item: ItineraryItemV2, itemIndex: number) => (
              <SortableItineraryItem
                key={item.id}
                itemId={item.id}
                containerId={containerId}
              >
                {({ dragAttributes, dragListeners, isDragging }) => (
                  <li
                    className={`p-3 rounded-lg border flex justify-between gap-3 ${
                      isDragging ? 'bg-primary-50 border-primary-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{item.placeName}</p>
                      {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
                    </div>
                    {canEditPlanning && (
                      <div className="flex flex-wrap items-start gap-2">
                        <button
                          {...dragAttributes}
                          {...dragListeners}
                          aria-label={`Drag ${item.placeName}`}
                          disabled={isMovePending}
                          className="text-xs px-2 py-1 rounded border border-primary-300 text-primary-700 disabled:opacity-40 cursor-grab active:cursor-grabbing"
                        >
                          Drag
                        </button>
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
                          {firstDayNumber ? `To day ${firstDayNumber}` : 'To first day'}
                        </button>
                        <button
                          onClick={() => onRemove(item.id)}
                          disabled={isMovePending}
                          aria-disabled={isMovePending}
                          className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </li>
                )}
              </SortableItineraryItem>
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  )
}
