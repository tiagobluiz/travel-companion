import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import {
  changeInviteRole,
  fetchCollaborators,
  inviteMember,
  leaveTrip,
  removeInvite,
} from './collaborators'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('collaborators api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ token: null, user: null })
  })

  it('fetches collaborators with auth token (happy path)', async () => {
    useAuthStore.setState({ token: 'token-2' })
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        memberships: [{ userId: 'user-1', role: 'OWNER' }],
        invites: [{ email: 'viewer@example.com', role: 'VIEWER', status: 'PENDING' }],
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCollaborators('trip-1')

    expect(result.memberships[0]?.role).toBe('OWNER')
    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-1/collaborators',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-2',
        }),
      })
    )
  })

  it('accepts empty memberships and invites (empty state)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ memberships: [], invites: [] })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCollaborators('trip-empty')

    expect(result.memberships).toEqual([])
    expect(result.invites).toEqual([])
  })

  it('omits auth header for anonymous caller (permission variant)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ error: 'Unauthorized' }, 401)
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCollaborators('trip-1')).rejects.toThrow('Unauthorized')

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    const headers = requestInit.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('throws API validation message when invite payload is invalid (validation failure)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ message: 'Email must be valid' }, 400)
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      inviteMember('trip-1', { email: 'bad-email', role: 'VIEWER' })
    ).rejects.toThrow('Email must be valid')
  })

  it('encodes email query string on invite role changes (edge case)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ memberships: [], invites: [] })
    )
    vi.stubGlobal('fetch', fetchMock)

    await changeInviteRole('trip-1', 'test+one@example.com', { role: 'EDITOR' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-1/invites/role?email=test%2Bone%40example.com',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('uses successor query parameter only when provided (regression)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ memberships: [], invites: [] }))
      .mockResolvedValueOnce(jsonResponse({ memberships: [], invites: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await leaveTrip('trip-1')
    await leaveTrip('trip-1', 'user-2')

    expect(fetchMock.mock.calls[0][0]).toBe('/trips/trip-1/members/me')
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/trips/trip-1/members/me?successorOwnerUserId=user-2'
    )
  })

  it('encodes remove-invite email and propagates backend failures (error state)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ error: 'Only owners can manage invites' }, 403)
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(removeInvite('trip-7', 'member+old@example.com')).rejects.toThrow(
      'Only owners can manage invites'
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/trips/trip-7/invites?email=member%2Bold%40example.com',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
