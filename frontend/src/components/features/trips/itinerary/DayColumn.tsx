import type { DayContainer, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'
import { ItineraryItemCard } from './ItineraryItemCard'

interface DayColumnProps {
  day: DayContainer
  dayIndex: number
  totalDays: number
  previousDayNumber?: number
  nextDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  tripStartDate: string
  tripEndDate: string
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => Promise<void> | void
  onRemove: (itemId: string) => void
}

export function DayColumn({
  day,
  dayIndex,
  totalDays,
  previousDayNumber,
  nextDayNumber,
  canEditPlanning,
  isMovePending,
  isEditPending,
  tripStartDate,
  tripEndDate,
  onMove,
  onEdit,
  onRemove,
}: DayColumnProps) {
  return (
    <section className="p-4 bg-white rounded-lg border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-3">
        Day {day.dayNumber} ({day.date})
      </h3>
      {day.items.length === 0 ? (
        <p className="text-slate-500 text-sm">No items in this day.</p>
      ) : (
        <ul className="space-y-2">
          {day.items.map((item, itemIndex) => (
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
                onClick={() => {
                  if (isMovePending || isEditPending) return
                  onMove(item.id, {
                    targetDayNumber: day.dayNumber,
                    beforeItemId: day.items[itemIndex - 1]?.id,
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
                    targetDayNumber: day.dayNumber,
                    afterItemId: day.items[itemIndex + 1]?.id,
                  })
                }}
                disabled={itemIndex === day.items.length - 1 || isMovePending || isEditPending}
                aria-disabled={itemIndex === day.items.length - 1 || isMovePending || isEditPending}
                className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                Move down
              </button>
              <button
                onClick={() => {
                  if (isMovePending || isEditPending) return
                  onMove(item.id, {})
                }}
                disabled={isMovePending || isEditPending}
                aria-disabled={isMovePending || isEditPending}
                className="text-xs px-2 py-1 rounded border border-slate-300"
              >
                To places
              </button>
              <button
                onClick={() => onRemove(item.id)}
                disabled={isMovePending || isEditPending}
                aria-disabled={isMovePending || isEditPending}
                className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
              {dayIndex > 0 && (
                <button
                  onClick={() => {
                    if (isMovePending || isEditPending) return
                    onMove(item.id, { targetDayNumber: previousDayNumber })
                  }}
                  disabled={isMovePending || isEditPending}
                  aria-disabled={isMovePending || isEditPending}
                  className="text-xs px-2 py-1 rounded border border-slate-300"
                >
                  Prev day
                </button>
              )}
              {dayIndex < totalDays - 1 && (
                <button
                  onClick={() => {
                    if (isMovePending || isEditPending) return
                    onMove(item.id, { targetDayNumber: nextDayNumber })
                  }}
                  disabled={isMovePending || isEditPending}
                  aria-disabled={isMovePending || isEditPending}
                  className="text-xs px-2 py-1 rounded border border-slate-300"
                >
                  Next day
                </button>
              )}
            </ItineraryItemCard>
          ))}
        </ul>
      )}
    </section>
  )
}
