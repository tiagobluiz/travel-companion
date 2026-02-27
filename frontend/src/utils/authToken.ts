export function isJwtTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true
  const parts = token.split('.')
  if (parts.length < 2) return false

  try {
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof payload.exp !== 'number') return false
    const nowSeconds = Math.floor(Date.now() / 1000)
    return payload.exp <= nowSeconds
  } catch {
    return false
  }
}
