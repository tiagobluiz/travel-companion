import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './getErrorMessage'

describe('getErrorMessage', () => {
  it('returns error message from Error instance', () => {
    expect(getErrorMessage(new Error('Boom'), 'Fallback')).toBe('Boom')
  })

  it('returns string error directly', () => {
    expect(getErrorMessage('Backend failure', 'Fallback')).toBe('Backend failure')
  })

  it('returns fallback for unsupported error payloads', () => {
    expect(getErrorMessage({ message: 'Nope' }, 'Fallback')).toBe('Fallback')
  })
})
