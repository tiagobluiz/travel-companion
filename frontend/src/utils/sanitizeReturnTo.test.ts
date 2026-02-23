import { describe, expect, it } from 'vitest'
import { sanitizeReturnTo } from './sanitizeReturnTo'

describe('sanitizeReturnTo', () => {
  it('allows in-app paths', () => {
    expect(sanitizeReturnTo('/trips/123?tab=active#section')).toBe('/trips/123?tab=active#section')
  })

  it('rejects empty and external values', () => {
    expect(sanitizeReturnTo(null)).toBe('/')
    expect(sanitizeReturnTo('')).toBe('/')
    expect(sanitizeReturnTo('https://evil.example')).toBe('/')
    expect(sanitizeReturnTo('//evil.example/path')).toBe('/')
  })
})
