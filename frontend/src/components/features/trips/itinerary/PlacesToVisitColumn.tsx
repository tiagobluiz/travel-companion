import type {
  ItineraryItemV2,
  MoveItineraryItemV2Request,
  PlacesToVisitContainer,
} from '../../../../api/itinerary'

interface PlacesToVisitColumnProps {
  placesToVisit: PlacesToVisitContainer
  firstDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onRemove: (itemId: string) => void
}

export function PlacesToVisitColumn({
  placesToVisit,
  firstDayNumber,
  canEditPlanning,
  isMovePending,
  onMove,
  onRemove,
}: PlacesToVisitColumnProps) {
  return (
    <section className="p-4 bg-white rounded-lg border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-3">{placesToVisit.label}</h3>
      {placesToVisit.items.length === 0 ? (
        <p className="text-slate-500 text-sm">No places waiting to be scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {placesToVisit.items.map((item: ItineraryItemV2, itemIndex: number) => (
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
                    onClick={() => onRemove(item.id)}
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
