import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import { Avatar, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

interface TripDetailHeaderProps {
  tripName: string
  userDisplayName: string
  isAuthenticated: boolean
  onLogout: () => void
}

export function TripDetailHeader({
  tripName,
  userDisplayName,
  isAuthenticated,
  onLogout,
}: TripDetailHeaderProps) {
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
      <Box sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
        <Stack spacing={1.25} sx={{ py: 1.25 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: { xs: 'none', sm: 'grid' },
                  placeItems: 'center',
                }}
              >
                <TravelExploreRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: '#24324a', display: { xs: 'none', md: 'block' } }}
              >
                Travel Companion
              </Typography>

              <Box sx={{ width: 1, height: 18, bgcolor: 'rgba(15,23,42,0.08)', display: { xs: 'none', md: 'block' } }} />

              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button component={Link} to={isAuthenticated ? '/' : '/discover'} startIcon={<HomeRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
                  Home
                </Button>
                <Button component={Link} to="/discover" startIcon={<TravelExploreRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
                  Discover
                </Button>
                <Button startIcon={<NotificationsNoneRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }} disabled>
                  Notifications
                </Button>
                <Button startIcon={<PersonRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }} disabled>
                  Profile
                </Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.25} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'rgba(21,112,239,0.12)',
                    color: 'primary.main',
                    fontWeight: 700,
                  }}
                >
                  {(userDisplayName || 'G').slice(0, 1).toUpperCase()}
                </Avatar>
                <Stack spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                    {userDisplayName}
                  </Typography>
                  {isAuthenticated ? (
                    <Button
                      onClick={onLogout}
                      variant="text"
                      size="small"
                      sx={{ minHeight: 'auto', p: 0, justifyContent: 'flex-start' }}
                    >
                      Sign out
                    </Button>
                  ) : null}
                </Stack>
                <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: '#667085', display: { xs: 'none', sm: 'block' } }} />
              </Stack>
            </Stack>
          </Stack>

          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid rgba(15,23,42,0.06)',
              background:
                'linear-gradient(135deg, rgba(34,103,214,0.92) 0%, rgba(48,126,233,0.86) 32%, rgba(107,193,246,0.72) 68%, rgba(255,255,255,0.88) 100%)',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.18,
                backgroundImage:
                  'radial-gradient(circle at 14% 20%, #fff 0, transparent 28%), radial-gradient(circle at 72% 30%, #fff 0, transparent 24%), radial-gradient(circle at 48% 80%, #fff 0, transparent 30%)',
              }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              justifyContent="space-between"
              sx={{ position: 'relative', px: { xs: 1.5, md: 2 }, py: { xs: 1.5, md: 2 }, minHeight: 92 }}
            >
              <Stack spacing={0.25}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 800, letterSpacing: 0.4 }}>
                  TRIP COVER
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', lineHeight: 1.05 }}>
                  {tripName}
                </Typography>
              </Stack>
              <Box
                sx={{
                  px: 1.1,
                  py: 0.55,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.26)',
                  color: '#fff',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  Image support (API pending)
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Button
                component={Link}
                to={isAuthenticated ? '/' : '/discover'}
                startIcon={<ArrowBackRoundedIcon />}
                variant="text"
                sx={{ px: 0.5, minWidth: 0 }}
              >
                Back
              </Button>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#223046', lineHeight: 1.1 }}>
                {tripName}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  )
}
