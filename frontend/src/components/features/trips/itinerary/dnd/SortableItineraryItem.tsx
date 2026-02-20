import type { ReactNode } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import type { ItineraryContainerId } from './mappers'

interface SortableItineraryItemProps {
  itemId: string
  containerId: ItineraryContainerId
  children: (params: {
    dragAttributes: ReturnType<typeof useSortable>['attributes']
    dragListeners: ReturnType<typeof useSortable>['listeners']
    isDragging: boolean
  }) => ReactNode
}

export function SortableItineraryItem({
  itemId,
  containerId,
  children,
}: SortableItineraryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
    data: {
      type: 'item',
      containerId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-80' : undefined}>
      {children({ dragAttributes: attributes, dragListeners: listeners, isDragging })}
    </div>
  )
}
