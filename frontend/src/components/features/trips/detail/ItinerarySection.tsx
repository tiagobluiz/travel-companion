import type { FormEvent } from 'react'
import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import type { Trip } from '../../../../api/trips'

interface ItinerarySectionProps {
  trip: Trip
  itinerary: ItineraryV2Response
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
      {Boolean(itineraryLoadError) && (
        <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">Failed to load itinerary.</div>
      )}
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
          Read-only itinerary view. Editors/owners (and pending invitees) can plan items.
        </p>
      )}

      <div className="space-y-4">
        {itinerary.days.map((day, dayIndex) => (
          <section key={day.dayNumber} className="p-4 bg-white rounded-lg border border-slate-200">
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
                          className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                        >
                          Remove
                        </button>
                        {dayIndex > 0 && (
                          <button
                            onClick={() =>
                              onMove(item.id, {
                                targetDayNumber: itinerary.days[dayIndex - 1]?.dayNumber,
                              })
                            }
                            disabled={isMovePending}
                            className="text-xs px-2 py-1 rounded border border-slate-300"
                          >
                            Prev day
                          </button>
                        )}
                        {dayIndex < itinerary.days.length - 1 && (
                          <button
                            onClick={() =>
                              onMove(item.id, {
                                targetDayNumber: itinerary.days[dayIndex + 1]?.dayNumber,
                              })
                            }
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
        ))}

        <section className="p-4 bg-white rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">{itinerary.placesToVisit.label}</h3>
          {itinerary.placesToVisit.items.length === 0 ? (
            <p className="text-slate-500 text-sm">No places waiting to be scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {itinerary.placesToVisit.items.map((item, itemIndex) => (
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
                            beforeItemId: itinerary.placesToVisit.items[itemIndex - 1]?.id,
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
                            afterItemId: itinerary.placesToVisit.items[itemIndex + 1]?.id,
                          })
                        }
                        disabled={itemIndex === itinerary.placesToVisit.items.length - 1 || isMovePending}
                        className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        onClick={() => onMove(item.id, { targetDayNumber: itinerary.days[0]?.dayNumber })}
                        disabled={!itinerary.days.length || isMovePending}
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
      </div>
    </section>
  )
}
