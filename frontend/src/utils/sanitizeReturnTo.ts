export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'

  try {
    const parsed = new URL(value, 'http://local')
    if (parsed.origin !== 'http://local') return '/'
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
  } catch {
    return '/'
  }
}
