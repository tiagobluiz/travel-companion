import type { FormEvent } from 'react'
import type { CollaboratorsResponse, TripRole } from '../../../../api/collaborators'
import { getErrorMessage } from '../../../../utils/getErrorMessage'

interface CollaboratorsSectionProps {
  isAuthenticated: boolean
  collaborators?: CollaboratorsResponse
  collaboratorsLoadError: unknown
  collaboratorError: string
  isCollaboratorsLoading: boolean
  isOwner: boolean
  isMember: boolean
  userEmail?: string
  inviteEmail: string
  inviteRole: TripRole
  isInvitePending: boolean
  isRespondPending: boolean
  isRevokePending: boolean
  isLeavePending: boolean
  onInviteEmailChange: (value: string) => void
  onInviteRoleChange: (value: TripRole) => void
  onInviteSubmit: (e: FormEvent<HTMLFormElement>) => void
  onAcceptInvite: () => void
  onDeclineInvite: () => void
  onRevokeInvite: (email: string) => void
  onLeaveTrip: () => void
}

export function CollaboratorsSection({
  isAuthenticated,
  collaborators,
  collaboratorsLoadError,
  collaboratorError,
  isCollaboratorsLoading,
  isOwner,
  isMember,
  userEmail,
  inviteEmail,
  inviteRole,
  isInvitePending,
  isRespondPending,
  isRevokePending,
  isLeavePending,
  onInviteEmailChange,
  onInviteRoleChange,
  onInviteSubmit,
  onAcceptInvite,
  onDeclineInvite,
  onRevokeInvite,
  onLeaveTrip,
}: CollaboratorsSectionProps) {
  const collaboratorsLoadErrorText = getErrorMessage(
    collaboratorsLoadError,
    'Failed to load collaborators.'
  )

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Collaborators</h2>
      {isAuthenticated ? (
        <>
          {Boolean(collaboratorsLoadError) && (
            <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">
              {collaboratorsLoadErrorText}
            </div>
          )}
          {collaboratorError && (
            <div className="mb-4 p-2 rounded-md bg-red-50 text-red-700 text-sm">{collaboratorError}</div>
          )}
          {isCollaboratorsLoading ? (
            <p className="text-slate-500 text-sm">Loading collaborators...</p>
          ) : (
            <>
              <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Members</h3>
                {!collaborators?.memberships.length ? (
                  <p className="text-slate-500 text-sm">No collaborators yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {collaborators.memberships.map((member) => (
                      <li
                        key={member.userId}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-50"
                      >
                        <span className="text-sm text-slate-700">{member.userId}</span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Invites</h3>
                {!collaborators?.invites.length ? (
                  <p className="text-slate-500 text-sm">No invites yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {collaborators.invites.map((invite) => {
                      const isMyInvite =
                        userEmail?.toLowerCase() === invite.email.toLowerCase() && invite.status === 'PENDING'
                      return (
                        <li
                          key={`${invite.email}-${invite.status}`}
                          className="p-2 rounded-md bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700">{invite.email}</span>
                            <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                              {invite.role}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                invite.status === 'DECLINED'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {invite.status}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {isMyInvite && (
                              <>
                                <button
                                  onClick={onAcceptInvite}
                                  disabled={isRespondPending}
                                  className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={onDeclineInvite}
                                  disabled={isRespondPending}
                                  className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {isOwner && (invite.status === 'PENDING' || invite.status === 'DECLINED') && (
                              <button
                                onClick={() => onRevokeInvite(invite.email)}
                                disabled={isRevokePending}
                                className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 disabled:opacity-50"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {isOwner && (
                <form onSubmit={onInviteSubmit} className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                  <h3 className="font-semibold text-slate-900">Invite collaborator</h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={inviteEmail}
                      onChange={(e) => onInviteEmailChange(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => onInviteRoleChange(e.target.value as TripRole)}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isInvitePending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      Invite
                    </button>
                  </div>
                </form>
              )}

              {isMember && (
                <button
                  onClick={onLeaveTrip}
                  disabled={isLeavePending}
                  className="text-sm px-3 py-2 rounded border border-red-300 text-red-700 disabled:opacity-50"
                >
                  Leave trip
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-slate-500 text-sm">Sign in to manage collaborators and invites.</p>
      )}
    </section>
  )
}
