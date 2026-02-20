import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../../api/itinerary'

export type ItineraryContainerId = `day:${number}` | 'places'

export type ItineraryDndContainers = Record<string, string[]>

interface MoveMappingInput {
  itemId: string
  targetContainerId: ItineraryContainerId
  targetIndex: number
  containers: ItineraryDndContainers
}

export function dayContainerId(dayNumber: number): ItineraryContainerId {
  return `day:${dayNumber}`
}

export function getTargetDayNumber(containerId: ItineraryContainerId): number | undefined {
  if (containerId === 'places') return undefined
  if (!containerId.startsWith('day:')) return undefined
  const rawDayNumber = containerId.slice(4)
  const parsedDayNumber = Number.parseInt(rawDayNumber, 10)
  if (!Number.isFinite(parsedDayNumber) || Number.isNaN(parsedDayNumber)) return undefined
  return parsedDayNumber
}

export function buildDndContainers(itinerary: ItineraryV2Response): ItineraryDndContainers {
  const dayContainers = itinerary.days.reduce(
    (acc, day) => {
      acc[dayContainerId(day.dayNumber)] = day.items.map((item) => item.id)
      return acc
    },
    {} as ItineraryDndContainers
  )

  return {
    ...dayContainers,
    places: itinerary.placesToVisit.items.map((item) => item.id),
  }
}

export function findItemContainerId(
  containers: ItineraryDndContainers,
  itemId: string
): ItineraryContainerId | undefined {
  const match = Object.entries(containers).find(([, ids]) => ids.includes(itemId))
  return match?.[0] as ItineraryContainerId | undefined
}

export function mapDragTargetToMovePayload({
  itemId,
  targetContainerId,
  targetIndex,
  containers,
}: MoveMappingInput): MoveItineraryItemV2Request {
  const targetDayNumber = getTargetDayNumber(targetContainerId)
  const targetItemsWithoutSource = (containers[targetContainerId] ?? []).filter((id) => id !== itemId)
  const normalizedTargetIndex = Math.max(0, Math.min(targetIndex, targetItemsWithoutSource.length))
  const beforeItemId = targetItemsWithoutSource[normalizedTargetIndex]
  const afterItemId =
    normalizedTargetIndex > 0 ? targetItemsWithoutSource[normalizedTargetIndex - 1] : undefined

  if (beforeItemId) {
    return {
      targetDayNumber,
      beforeItemId,
    }
  }

  if (afterItemId) {
    return {
      targetDayNumber,
      afterItemId,
    }
  }

  return targetDayNumber == null ? {} : { targetDayNumber }
}
