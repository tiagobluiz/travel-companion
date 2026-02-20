import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../../api/itinerary'
import {
  type ItineraryContainerId,
  buildDndContainers,
  findItemContainerId,
  mapDragTargetToMovePayload,
} from './mappers'

interface DragMoveCommand {
  itemId: string
  payload: MoveItineraryItemV2Request
}

interface ResolveMoveInput {
  itinerary: ItineraryV2Response
  activeItemId: string
  overId: string
  overType?: string
  overContainerId?: ItineraryContainerId
}

export function resolveMoveCommandFromDrag({
  itinerary,
  activeItemId,
  overId,
  overType,
  overContainerId,
}: ResolveMoveInput): DragMoveCommand | null {
  const containers = buildDndContainers(itinerary)
  const sourceContainerId = findItemContainerId(containers, activeItemId)
  if (!sourceContainerId) return null

  const targetContainerId = overType === 'container'
    ? overContainerId
    : overContainerId ?? findItemContainerId(containers, overId)
  if (!targetContainerId) return null

  const sourceItems = containers[sourceContainerId] ?? []
  const targetItems = containers[targetContainerId] ?? []
  const activeIndex = sourceItems.indexOf(activeItemId)
  if (activeIndex < 0) return null

  const targetIndex = overType === 'container'
    ? targetItems.length
    : targetItems.indexOf(overId)
  if (targetIndex < 0) return null

  if (sourceContainerId === targetContainerId && targetIndex === activeIndex) {
    return null
  }

  const payload = mapDragTargetToMovePayload({
    itemId: activeItemId,
    targetContainerId,
    targetIndex,
    containers,
  })

  return {
    itemId: activeItemId,
    payload,
  }
}

