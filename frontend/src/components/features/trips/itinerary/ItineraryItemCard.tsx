import { useState, type ReactNode } from 'react'
import type { ItineraryItemV2 } from '../../../../api/itinerary'
import { ItemForm, type ItemFormEditPayload } from './ItemForm'

interface ItineraryItemCardProps {
  item: ItineraryItemV2
  canEditPlanning: boolean
  isPending: boolean
  tripStartDate: string
  tripEndDate: string
  onEdit: (payload: ItemFormEditPayload) => void
  children?: ReactNode
}

export function ItineraryItemCard({
  item,
  canEditPlanning,
  isPending,
  tripStartDate,
  tripEndDate,
  onEdit,
  children,
}: ItineraryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <li className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <ItemForm
          mode="edit"
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          isPending={isPending}
          initialNotes={item.notes}
          initialDayNumber={item.dayNumber}
          onEdit={(payload) => {
            onEdit(payload)
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between gap-3">
      <div>
        <p className="font-medium">{item.placeName}</p>
        {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
      </div>
      {canEditPlanning && (
        <div className="flex flex-wrap items-start gap-2">
          {children}
          <button
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      )}
    </li>
  )
}
