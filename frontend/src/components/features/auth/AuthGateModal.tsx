import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Stack, Typography, useMediaQuery } from '@mui/material'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

interface AuthGateModalProps {
  open: boolean
  onClose: () => void
  returnTo: string
  title?: string
  description?: string
}

export default function AuthGateModal({
  open,
  onClose,
  returnTo,
  title = 'Sign in to continue',
  description = 'You can browse this public trip in read-only mode. Sign in or create an account to copy and edit it in your workspace.',
}: AuthGateModalProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })

  function goToAuth(tab: 'signin' | 'signup') {
    const encodedReturnTo = encodeURIComponent(returnTo)
    navigate(`/${tab === 'signin' ? 'login' : 'register'}?returnTo=${encodedReturnTo}`)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      aria-labelledby="auth-gate-title"
      aria-describedby="auth-gate-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="auth-gate-title">{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ContentCopyRoundedIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Copy public trips and start adapting the plan to your dates and collaborators.
            </Typography>
          </Stack>
          <Typography id="auth-gate-description" variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button onClick={onClose} variant="text" sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Maybe later
        </Button>
        <Button
          onClick={() => goToAuth('signup')}
          variant="outlined"
          startIcon={<PersonAddAlt1RoundedIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Create account
        </Button>
        <Button
          onClick={() => goToAuth('signin')}
          variant="contained"
          startIcon={<LoginRoundedIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Sign in
        </Button>
      </DialogActions>
    </Dialog>
  )
}
