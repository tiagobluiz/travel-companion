import type { DayContainer, MoveItineraryItemV2Request } from '../../../../api/itinerary'

interface DayColumnProps {
  day: DayContainer
  dayIndex: number
  totalDays: number
  previousDayNumber?: number
  nextDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
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
  onMove,
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
            <li
              key={item.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between gap-3"
            >
              <div>
                <p className="font-medium">{item.placeName}</p>
                {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
              </div>
              {canEditPlanning && (
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    onClick={() =>
                      onMove(item.id, {
                        targetDayNumber: day.dayNumber,
                        beforeItemId: day.items[itemIndex - 1]?.id,
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
                        targetDayNumber: day.dayNumber,
                        afterItemId: day.items[itemIndex + 1]?.id,
                      })
                    }
                    disabled={itemIndex === day.items.length - 1 || isMovePending}
                    className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                  >
                    Move down
                  </button>
                  <button
                    onClick={() => onMove(item.id, {})}
                    disabled={isMovePending}
                    className="text-xs px-2 py-1 rounded border border-slate-300"
                  >
                    To places
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    disabled={isMovePending}
                    aria-disabled={isMovePending}
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                  {dayIndex > 0 && (
                    <button
                      onClick={() => onMove(item.id, { targetDayNumber: previousDayNumber })}
                      disabled={isMovePending}
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                    >
                      Prev day
                    </button>
                  )}
                  {dayIndex < totalDays - 1 && (
                    <button
                      onClick={() => onMove(item.id, { targetDayNumber: nextDayNumber })}
                      disabled={isMovePending}
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                    >
                      Next day
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
