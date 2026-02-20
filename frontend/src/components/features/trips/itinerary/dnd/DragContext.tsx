import type { ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../../api/itinerary'
import type { ItineraryContainerId } from './mappers'
import { resolveMoveCommandFromDrag } from './dragResolver'

interface DragContextProps {
  itinerary: ItineraryV2Response
  disabled: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  children: ReactNode
}

export function ItineraryDragContext({
  itinerary,
  disabled,
  onMove,
  children,
}: DragContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return
    if (!event.over) return

    const activeItemId = String(event.active.id)
    const overId = String(event.over.id)
    const overType = event.over.data.current?.type as string | undefined
    const overContainerId = event.over.data.current?.containerId as ItineraryContainerId | undefined

    const command = resolveMoveCommandFromDrag({
      itinerary,
      activeItemId,
      overId,
      overType,
      overContainerId,
    })
    if (!command) return

    onMove(command.itemId, command.payload)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  )
}
