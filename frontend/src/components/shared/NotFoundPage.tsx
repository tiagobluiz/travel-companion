import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { isJwtTokenExpired } from '../../utils/authToken'
import { AppTopNav } from './AppTopNav'

interface NotFoundPageProps {
  title?: string
  description?: string
  backTo?: string
  backLabel?: string
  homeTo?: string
}

export function NotFoundPage({
  title = 'Page not found',
  description = 'The page may have moved, expired, or you may no longer have access to it.',
  backTo,
  backLabel = 'Go back',
  homeTo,
}: NotFoundPageProps) {
  const token = useAuthStore((s) => s.token)
  const shouldUseDashboardHome = Boolean(token) && !isJwtTokenExpired(token)
  const resolvedHomeTo = homeTo ?? (shouldUseDashboardHome ? '/' : '/discover')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e7edf7' }}>
      <Box
        component="a"
        href="#not-found-content"
        sx={{
          position: 'absolute',
          left: -9999,
          '&:focus': {
            left: 16,
            top: 16,
            zIndex: 2000,
            bgcolor: 'primary.main',
            color: '#fff',
            px: 2,
            py: 1,
            borderRadius: 2,
          },
        }}
      >
        Skip to content
      </Box>

      <AppTopNav />

      <Container id="not-found-content" maxWidth="sm" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 3 },
            borderRadius: 3,
            border: '1px solid rgba(15,23,42,0.08)',
            bgcolor: 'rgba(255,255,255,0.92)',
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: 'rgba(21,112,239,0.10)',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid rgba(21,112,239,0.14)',
              }}
            >
              <SearchOffRoundedIcon sx={{ fontSize: 30 }} />
            </Box>

            <Stack spacing={0.75}>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', md: '1.75rem' }, fontWeight: 800, color: '#223046' }}>
                {title}
              </Typography>
              <Typography color="text.secondary">{description}</Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%', justifyContent: 'center' }}>
              <Button component={RouterLink} to={resolvedHomeTo} variant="contained" startIcon={<HomeRoundedIcon />}>
                Go to Home
              </Button>
              {backTo ? (
                <Button component={RouterLink} to={backTo} variant="outlined" startIcon={<ArrowBackRoundedIcon />}>
                  {backLabel}
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
