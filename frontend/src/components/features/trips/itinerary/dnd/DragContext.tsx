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

  function readOverData(
    over: DragEndEvent['over']
  ): { overType: string | undefined; overContainerId: ItineraryContainerId | undefined } {
    const data = over?.data.current
    const overType = typeof data?.type === 'string' ? data.type : undefined
    const rawContainerId = data?.containerId
    const overContainerId =
      typeof rawContainerId === 'string' ? (rawContainerId as ItineraryContainerId) : undefined
    return { overType, overContainerId }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return
    if (!event.over) return

    if (typeof event.active.id !== 'string' && typeof event.active.id !== 'number') return
    if (typeof event.over.id !== 'string' && typeof event.over.id !== 'number') return

    const activeItemId = String(event.active.id)
    const overId = String(event.over.id)
    const { overType, overContainerId } = readOverData(event.over)

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
