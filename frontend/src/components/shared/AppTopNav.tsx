import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import { Avatar, Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { isJwtTokenExpired } from '../../utils/authToken'

export function AppTopNav() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const isAuthenticated = Boolean(token)
  const displayName = user?.displayName?.trim() || (isAuthenticated ? 'Traveler' : 'Guest')
  const isValidAuthenticated = isAuthenticated && !isJwtTokenExpired(token)

  return (
    <Paper
      square
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid rgba(15,23,42,0.08)',
        bgcolor: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minHeight: 72 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <TravelExploreRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#24324a' }}>
              Travel Companion
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button component={RouterLink} to={isValidAuthenticated ? '/' : '/discover'} startIcon={<HomeRoundedIcon />} variant="text" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Home
            </Button>
            <Button component={RouterLink} to="/discover" startIcon={<TravelExploreRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
              Discover
            </Button>
            <Button startIcon={<NotificationsNoneRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }} disabled>
              Notifications
            </Button>
            <Button startIcon={<PersonRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }} disabled>
              Profile
            </Button>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(21,112,239,0.12)', color: 'primary.main', fontWeight: 700 }}>
              {displayName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Stack spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {displayName}
              </Typography>
              {isValidAuthenticated ? (
                <Button
                  onClick={() => {
                    logout()
                    navigate('/discover', { replace: true })
                  }}
                  variant="text"
                  size="small"
                  sx={{ minHeight: 'auto', p: 0, justifyContent: 'flex-start' }}
                >
                  Sign out
                </Button>
              ) : (
                <Button component={RouterLink} to="/?tab=signin" variant="text" size="small" sx={{ minHeight: 'auto', p: 0, justifyContent: 'flex-start' }}>
                  Sign in
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Paper>
  )
}
