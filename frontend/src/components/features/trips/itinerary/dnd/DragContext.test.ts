import { describe, expect, it } from 'vitest'
import { resolveMoveCommandFromDrag } from './dragResolver'

const itinerary = {
  days: [
    {
      dayNumber: 1,
      date: '2026-01-01',
      items: [
        { id: 'a', placeName: 'A', notes: '', latitude: 0, longitude: 0, dayNumber: 1 },
        { id: 'b', placeName: 'B', notes: '', latitude: 0, longitude: 0, dayNumber: 1 },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-01-02',
      items: [{ id: 'c', placeName: 'C', notes: '', latitude: 0, longitude: 0, dayNumber: 2 }],
    },
  ],
  placesToVisit: {
    label: 'Places To Visit',
    items: [{ id: 'p1', placeName: 'P1', notes: '', latitude: 0, longitude: 0, dayNumber: null }],
  },
}

describe('resolveMoveCommandFromDrag', () => {
  it('maps dragging onto another day item to beforeItemId payload', () => {
    const command = resolveMoveCommandFromDrag({
      itinerary,
      activeItemId: 'a',
      overId: 'c',
      overType: 'item',
      overContainerId: 'day:2',
    })

    expect(command).toEqual({
      itemId: 'a',
      payload: { targetDayNumber: 2, beforeItemId: 'c' },
    })
  })

  it('maps dropping on container surface to append payload', () => {
    const command = resolveMoveCommandFromDrag({
      itinerary,
      activeItemId: 'a',
      overId: 'places',
      overType: 'container',
      overContainerId: 'places',
    })

    expect(command).toEqual({
      itemId: 'a',
      payload: { afterItemId: 'p1' },
    })
  })

  it('returns null when drag does not change position', () => {
    const command = resolveMoveCommandFromDrag({
      itinerary,
      activeItemId: 'a',
      overId: 'a',
      overType: 'item',
      overContainerId: 'day:1',
    })

    expect(command).toBeNull()
  })
})
