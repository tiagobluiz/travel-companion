import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
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
  const collaboratorsLoadErrorText = getErrorMessage(collaboratorsLoadError, 'Failed to load collaborators.')

  return (
    <Box component="section" sx={{ mb: 4.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(15,23,42,0.06)',
          bgcolor: 'rgba(255,255,255,0.92)',
          p: { xs: 1.75, md: 2 },
        }}
      >
        <Stack spacing={1.75}>
          <Stack spacing={0.4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  bgcolor: 'rgba(21,112,239,0.10)',
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <GroupRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#223046' }}>
                Collaborators
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Invite members, manage roles, and handle pending invites in one place.
            </Typography>
          </Stack>

          {!isAuthenticated ? (
            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              Sign in to manage collaborators and invites.
            </Alert>
          ) : null}

          {isAuthenticated && Boolean(collaboratorsLoadError) ? (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {collaboratorsLoadErrorText}
            </Alert>
          ) : null}

          {isAuthenticated && collaboratorError ? (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {collaboratorError}
            </Alert>
          ) : null}

          {isAuthenticated && isCollaboratorsLoading ? (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography color="text.secondary">Loading collaborators...</Typography>
            </Paper>
          ) : null}

          {isAuthenticated && !isCollaboratorsLoading ? (
            <Stack spacing={1.25}>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2.5, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(255,255,255,0.96)' }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800, color: '#223046' }}>Members</Typography>
                  {!collaborators?.memberships.length ? (
                    <Typography variant="body2" color="text.secondary">
                      No collaborators yet.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {collaborators.memberships.map((member) => (
                        <Stack
                          key={member.userId}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ px: 1, py: 0.9, borderRadius: 2, bgcolor: 'rgba(248,250,252,0.9)', border: '1px solid rgba(15,23,42,0.06)' }}
                        >
                          <Typography variant="body2" sx={{ color: '#344054', fontWeight: 600 }}>
                            {member.displayName ?? member.userId}
                          </Typography>
                          <Box sx={{ px: 1, py: 0.35, borderRadius: 1.5, bgcolor: 'rgba(15,23,42,0.06)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#344054' }}>
                              {member.role}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2.5, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(255,255,255,0.96)' }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800, color: '#223046' }}>Invites</Typography>
                  {!collaborators?.invites.length ? (
                    <Typography variant="body2" color="text.secondary">
                      No invites yet.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {collaborators.invites.map((invite) => {
                        const isMyInvite = userEmail?.toLowerCase() === invite.email.toLowerCase() && invite.status === 'PENDING'
                        return (
                          <Stack
                            key={`${invite.email}-${invite.status}`}
                            spacing={0.9}
                            sx={{ px: 1, py: 0.9, borderRadius: 2, bgcolor: 'rgba(248,250,252,0.9)', border: '1px solid rgba(15,23,42,0.06)' }}
                          >
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} alignItems={{ sm: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#344054', fontWeight: 600 }}>
                                {invite.email}
                              </Typography>
                              <Box sx={{ px: 1, py: 0.25, borderRadius: 1.5, bgcolor: 'rgba(15,23,42,0.06)', width: 'fit-content' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#344054' }}>
                                  {invite.role}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1.5,
                                  bgcolor: invite.status === 'DECLINED' ? 'rgba(240,68,56,0.10)' : 'rgba(245,158,11,0.14)',
                                  color: invite.status === 'DECLINED' ? '#b42318' : '#92400e',
                                  width: 'fit-content',
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                  {invite.status}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.75}>
                              {isMyInvite ? (
                                <>
                                  <Button size="small" variant="outlined" onClick={onAcceptInvite} disabled={isRespondPending}>
                                    Accept
                                  </Button>
                                  <Button size="small" variant="outlined" onClick={onDeclineInvite} disabled={isRespondPending}>
                                    Decline
                                  </Button>
                                </>
                              ) : null}
                              {isOwner && (invite.status === 'PENDING' || invite.status === 'DECLINED') ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => onRevokeInvite(invite.email)}
                                  disabled={isRevokePending}
                                >
                                  Revoke
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        )
                      })}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {isOwner ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2.5, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(248,250,252,0.75)' }}
                >
                  <Stack component="form" onSubmit={onInviteSubmit} spacing={1.1}>
                    <Stack direction="row" spacing={0.9} alignItems="center">
                      <MailOutlineRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography sx={{ fontWeight: 800, color: '#223046' }}>Invite collaborator</Typography>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'stretch' }}>
                      <TextField
                        type="email"
                        label="Email"
                        value={inviteEmail}
                        onChange={(e) => onInviteEmailChange(e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      />
                      <TextField
                        select
                        label="Role"
                        value={inviteRole}
                        onChange={(e) => onInviteRoleChange(e.target.value as TripRole)}
                        sx={{ minWidth: { xs: '100%', md: 150 }, '& .MuiInputBase-root': { height: 40 } }}
                        size="small"
                      >
                        <MenuItem value="VIEWER">Viewer</MenuItem>
                        <MenuItem value="EDITOR">Editor</MenuItem>
                        <MenuItem value="OWNER">Owner</MenuItem>
                      </TextField>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isInvitePending}
                        sx={{ minWidth: 92, height: 40, alignSelf: { xs: 'stretch', md: 'auto' } }}
                      >
                        Invite
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : null}

              {isMember ? (
                <Box>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<PersonRemoveRoundedIcon />}
                    onClick={onLeaveTrip}
                    disabled={isLeavePending}
                  >
                    Leave trip
                  </Button>
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  )
}
