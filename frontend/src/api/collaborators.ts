import { api } from './client'

export type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER'
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED'

export interface Membership {
  userId: string
  role: TripRole
  displayName?: string
}

export interface Invite {
  email: string
  role: TripRole
  status: InviteStatus
}

export interface CollaboratorsResponse {
  memberships: Membership[]
  invites: Invite[]
}

export interface InviteMemberRequest {
  email: string
  role?: TripRole
}

export interface InviteResponseRequest {
  accept: boolean
}

export interface ChangeRoleRequest {
  role: TripRole
}

export async function fetchCollaborators(tripId: string) {
  return api.get<CollaboratorsResponse>(`/trips/${tripId}/collaborators`)
}

export async function inviteMember(tripId: string, data: InviteMemberRequest) {
  return api.post<CollaboratorsResponse>(`/trips/${tripId}/invites`, data)
}

export async function respondInvite(tripId: string, data: InviteResponseRequest) {
  return api.post<CollaboratorsResponse>(`/trips/${tripId}/invites/respond`, data)
}

export async function removeInvite(tripId: string, email: string) {
  const encodedEmail = encodeURIComponent(email)
  return api.delete<CollaboratorsResponse>(`/trips/${tripId}/invites?email=${encodedEmail}`)
}

export async function changeMemberRole(
  tripId: string,
  memberId: string,
  data: ChangeRoleRequest
) {
  return api.patch<CollaboratorsResponse>(`/trips/${tripId}/members/${memberId}/role`, data)
}

export async function changeInviteRole(
  tripId: string,
  email: string,
  data: ChangeRoleRequest
) {
  const encodedEmail = encodeURIComponent(email)
  return api.patch<CollaboratorsResponse>(`/trips/${tripId}/invites/role?email=${encodedEmail}`, data)
}

export async function removeMember(tripId: string, memberId: string) {
  return api.delete<CollaboratorsResponse>(`/trips/${tripId}/members/${memberId}`)
}

export async function leaveTrip(tripId: string, successorOwnerUserId?: string) {
  if (!successorOwnerUserId) {
    return api.delete<CollaboratorsResponse>(`/trips/${tripId}/members/me`)
  }
  const encodedSuccessor = encodeURIComponent(successorOwnerUserId)
  return api.delete<CollaboratorsResponse>(
    `/trips/${tripId}/members/me?successorOwnerUserId=${encodedSuccessor}`
  )
}
