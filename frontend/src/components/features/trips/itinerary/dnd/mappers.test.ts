import { describe, expect, it } from 'vitest'
import { getTargetDayNumber, mapDragTargetToMovePayload } from './mappers'

const containers = {
  'day:1': ['a', 'b', 'c'],
  'day:2': ['d'],
  places: ['p1', 'p2'],
}

describe('mapDragTargetToMovePayload', () => {
  it('returns undefined target day for malformed day container id', () => {
    expect(getTargetDayNumber('day:not-a-number' as never)).toBeUndefined()
  })

  it('maps same-list move to top using beforeItemId', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'b',
      targetContainerId: 'day:1',
      targetIndex: 0,
      containers: { ...containers },
    })

    expect(payload).toEqual({ targetDayNumber: 1, beforeItemId: 'a' })
  })

  it('maps same-list move to middle with deterministic anchor', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'a',
      targetContainerId: 'day:1',
      targetIndex: 1,
      containers: { ...containers },
    })

    expect(payload).toEqual({ targetDayNumber: 1, beforeItemId: 'c' })
  })

  it('maps same-list move to bottom using afterItemId', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'a',
      targetContainerId: 'day:1',
      targetIndex: 99,
      containers: { ...containers },
    })

    expect(payload).toEqual({ targetDayNumber: 1, afterItemId: 'c' })
  })

  it('maps cross-list move into a day container', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'p1',
      targetContainerId: 'day:2',
      targetIndex: 0,
      containers: { ...containers },
    })

    expect(payload).toEqual({ targetDayNumber: 2, beforeItemId: 'd' })
  })

  it('maps cross-list move into places container', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'a',
      targetContainerId: 'places',
      targetIndex: 1,
      containers: { ...containers },
    })

    expect(payload).toEqual({ beforeItemId: 'p2' })
  })

  it('maps drop into empty target container without anchors', () => {
    const payload = mapDragTargetToMovePayload({
      itemId: 'a',
      targetContainerId: 'day:3',
      targetIndex: 0,
      containers: {
        ...containers,
        'day:3': [],
      },
    })

    expect(payload).toEqual({ targetDayNumber: 3 })
  })
})
