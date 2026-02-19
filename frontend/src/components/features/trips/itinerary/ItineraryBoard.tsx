import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import { DayColumn } from './DayColumn'
import { PlacesToVisitColumn } from './PlacesToVisitColumn'

interface ItineraryBoardProps {
  itinerary?: ItineraryV2Response
  isLoading: boolean
  loadError: unknown
  canEditPlanning: boolean
  isMovePending: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onRemove: (itemId: string) => void
}

export function ItineraryBoard({
  itinerary,
  isLoading,
  loadError,
  canEditPlanning,
  isMovePending,
  onMove,
  onRemove,
}: ItineraryBoardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <section className="p-4 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 text-sm">Loading itinerary days...</p>
        </section>
        <section className="p-4 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 text-sm">Loading places to visit...</p>
        </section>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <section className="p-4 bg-white rounded-lg border border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">Failed to load itinerary.</p>
        </section>
        <section className="p-4 bg-white rounded-lg border border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">Failed to load places to visit.</p>
        </section>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="space-y-4">
        <section className="p-4 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 text-sm">No itinerary data available.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {itinerary.days.map((day, dayIndex) => (
        <DayColumn
          key={day.dayNumber}
          day={day}
          dayIndex={dayIndex}
          totalDays={itinerary.days.length}
          previousDayNumber={itinerary.days[dayIndex - 1]?.dayNumber}
          nextDayNumber={itinerary.days[dayIndex + 1]?.dayNumber}
          canEditPlanning={canEditPlanning}
          isMovePending={isMovePending}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}

      <PlacesToVisitColumn
        placesToVisit={itinerary.placesToVisit}
        firstDayNumber={itinerary.days[0]?.dayNumber}
        canEditPlanning={canEditPlanning}
        isMovePending={isMovePending}
        onMove={onMove}
        onRemove={onRemove}
      />
    </div>
  )
}
