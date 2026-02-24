import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import { Avatar, Box, Button, Container, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
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
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
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
                <Button startIcon={<HomeRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
                  Home
                </Button>
                <Button startIcon={<TravelExploreRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
                  Discover
                </Button>
                <Button startIcon={<NotificationsNoneRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
                  Notifications
                </Button>
                <Button startIcon={<PersonRoundedIcon />} variant="text" sx={{ color: 'text.secondary' }}>
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Button
                component={Link}
                to="/"
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

            <Tabs
              value="itinerary"
              aria-label="Trip detail sections"
              sx={{
                minHeight: 42,
                '& .MuiTabs-indicator': { height: 3, borderRadius: 999 },
                '& .MuiTab-root': {
                  minHeight: 42,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: { xs: 1.25, md: 1.75 },
                  minWidth: 'auto',
                },
              }}
            >
              <Tab value="itinerary" label="Itinerary" />
              <Tab value="collaborators" label="Collaborators" />
              <Tab value="expenses" label="Expenses" />
              <Tab value="settings" label="Settings" />
            </Tabs>
          </Stack>
        </Stack>
      </Container>
    </Paper>
  )
}
