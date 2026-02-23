import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  FormControl,
  InputBase,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { login, register } from '../../../api/auth'

type ShellTab = 'discover' | 'signin' | 'signup'
type DiscoverySort = 'POPULAR' | 'LATEST' | 'DURATION_ASC'
type DiscoveryTagFilter = 'ALL' | 'EUROPE' | 'ASIA' | 'FAMILY' | 'ADVENTURE'

interface DiscoveryPreviewTrip {
  id: string
  name: string
  city: string
  country: string
  region: 'EUROPE' | 'AMERICAS' | 'ASIA' | 'AFRICA'
  days: number
  travelers: number
  theme: string
  highlight: string
  createdAt: string
  popularity: number
  imageUrl: string
  saves: number
  views: number
}

const DISCOVERY_TRIPS: DiscoveryPreviewTrip[] = [
  {
    id: '859342e0-9b3a-466a-ad4a-c1e99d2ec216',
    name: 'Paris Getaway',
    city: 'Paris',
    country: 'France',
    region: 'EUROPE',
    days: 5,
    travelers: 2,
    theme: 'City + culture',
    highlight: 'Landmark route with museum pacing and neighborhood food stops.',
    createdAt: '2026-01-10T10:00:00Z',
    popularity: 98,
    imageUrl: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1400&q=80',
    saves: 192,
    views: 1270,
  },
  {
    id: '0cc0ef46-2e56-4318-8193-1189d05fbf0a',
    name: 'Japan Highlights',
    city: 'Kyoto',
    country: 'Japan',
    region: 'ASIA',
    days: 8,
    travelers: 3,
    theme: 'Culture + family',
    highlight: 'Temple clusters and transit-friendly planning with family-friendly pacing.',
    createdAt: '2026-01-26T12:00:00Z',
    popularity: 94,
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80',
    saves: 245,
    views: 1820,
  },
  {
    id: '77bcf9af-6e8c-49ac-a296-a4f5f76e9342',
    name: 'Road Trip Through Italy',
    city: 'Cinque Terre',
    country: 'Italy',
    region: 'EUROPE',
    days: 10,
    travelers: 4,
    theme: 'Adventure + coast',
    highlight: 'Scenic coast sequencing with flexible driving legs and overnight anchors.',
    createdAt: '2026-02-12T09:00:00Z',
    popularity: 91,
    imageUrl: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1400&q=80',
    saves: 321,
    views: 2210,
  },
  {
    id: 'b643f1df-08f6-4e9d-86f8-66775cc5ac55',
    name: 'New York Weekend',
    city: 'New York',
    country: 'United States',
    region: 'AMERICAS',
    days: 3,
    travelers: 2,
    theme: 'City break',
    highlight: 'Fast-paced long-weekend route with optimized neighborhood transitions.',
    createdAt: '2025-12-22T17:00:00Z',
    popularity: 88,
    imageUrl: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1400&q=80',
    saves: 168,
    views: 980,
  },
  {
    id: '61598fb0-e27c-4d11-a9f1-4eb0ece8150c',
    name: 'Exploring Thailand',
    city: 'Krabi',
    country: 'Thailand',
    region: 'ASIA',
    days: 9,
    travelers: 2,
    theme: 'Adventure + islands',
    highlight: 'Island hopping and beach days with lighter logistics and flexible slots.',
    createdAt: '2026-02-03T09:00:00Z',
    popularity: 90,
    imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1400&q=80',
    saves: 210,
    views: 1460,
  },
  {
    id: 'c3ffec53-1f32-4f1f-8d95-1108e6ff1b3b',
    name: 'Iceland Adventure',
    city: 'South Coast',
    country: 'Iceland',
    region: 'EUROPE',
    days: 6,
    travelers: 2,
    theme: 'Adventure + nature',
    highlight: 'Waterfalls, glaciers, and weather-aware route planning across the ring road edge.',
    createdAt: '2026-01-18T09:00:00Z',
    popularity: 89,
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
    saves: 275,
    views: 1690,
  },
]

const FILTER_CHIPS: Array<{ value: DiscoveryTagFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'EUROPE', label: 'Europe' },
  { value: 'ASIA', label: 'Asia' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'ADVENTURE', label: 'Adventure' },
]

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  displayName: z.string().min(2, 'Display name must have at least 2 characters').max(60, 'Display name is too long'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

function parseTab(raw: string | null): ShellTab {
  return raw === 'signin' || raw === 'signup' ? raw : 'discover'
}

function matchesFilter(trip: DiscoveryPreviewTrip, filter: DiscoveryTagFilter) {
  if (filter === 'ALL') return true
  const theme = trip.theme.toLowerCase()
  if (filter === 'EUROPE') return trip.region === 'EUROPE'
  if (filter === 'ASIA') return trip.region === 'ASIA'
  if (filter === 'FAMILY') return theme.includes('family') || trip.travelers >= 3
  if (filter === 'ADVENTURE') {
    return (
      theme.includes('adventure') ||
      theme.includes('nature') ||
      theme.includes('road') ||
      theme.includes('islands')
    )
  }
  return true
}

export default function DiscoveryAuthShellPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<DiscoverySort>('POPULAR')
  const [tagFilter, setTagFilter] = useState<DiscoveryTagFilter>('ALL')
  const [showFiltersHint, setShowFiltersHint] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const currentTab = parseTab(searchParams.get('tab'))
  const returnTo = searchParams.get('returnTo') ?? '/'

  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' }, mode: 'onBlur' })
  const registerForm = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues: { displayName: '', email: '', password: '' }, mode: 'onBlur' })

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase()
    let trips = DISCOVERY_TRIPS.filter((trip) => {
      const matchesSearch =
        q.length === 0 ||
        trip.name.toLowerCase().includes(q) ||
        trip.city.toLowerCase().includes(q) ||
        trip.country.toLowerCase().includes(q) ||
        trip.theme.toLowerCase().includes(q)
      return matchesSearch && matchesFilter(trip, tagFilter)
    })

    trips = [...trips].sort((a, b) => {
      if (sort === 'POPULAR') return b.popularity - a.popularity
      if (sort === 'LATEST') return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      return a.days - b.days
    })

    return trips
  }, [search, sort, tagFilter])

  function setTab(tab: ShellTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (tab === 'discover') next.delete('tab')
      else next.set('tab', tab)
      return next
    })
  }

  async function onLoginSubmit(values: LoginFormValues) {
    setLoginError('')
    setIsLoggingIn(true)
    try {
      await login(values.email, values.password)
      navigate(returnTo)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function onRegisterSubmit(values: RegisterFormValues) {
    setRegisterError('')
    setIsRegistering(true)
    try {
      await register(values.email, values.password, values.displayName)
      navigate(returnTo)
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Unable to create account.')
    } finally {
      setIsRegistering(false)
    }
  }

  function renderDiscoverPanel() {
    return (
      <Box role="tabpanel" aria-label="Discover" id="discovery-main">
        <Stack spacing={2.25}>
          <Stack spacing={0.75} alignItems="center" textAlign="center" sx={{ pt: { xs: 1, md: 2 } }}>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.65rem', md: '2.2rem' }, color: '#2b3852', fontWeight: 800 }}>
              Discover amazing public trips <Box component="span" sx={{ color: '#4b5565', fontWeight: 500 }}>from around the world</Box>
            </Typography>
            <Typography color="text.secondary">
              Browse itineraries and make them your own in just a click.
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 0.75,
              borderRadius: 3,
              border: '1px solid rgba(15,23,42,0.08)',
              bgcolor: '#fff',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 240 }}>
              <SearchRoundedIcon sx={{ color: '#94a3b8' }} />
              <InputBase
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search trips..."
                inputProps={{ 'aria-label': 'Search destinations or themes' }}
                sx={{ flex: 1, fontSize: 15 }}
              />
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { md: 'auto' } }}>
              <Typography variant="body2" sx={{ color: '#475467', whiteSpace: 'nowrap' }}>
                Sort by:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  value={sort}
                  onChange={(event: SelectChangeEvent<DiscoverySort>) => setSort(event.target.value as DiscoverySort)}
                  variant="standard"
                  disableUnderline
                  sx={{ fontWeight: 600, color: '#344054', '& .MuiSelect-select': { py: 0.5, pr: '24px !important' } }}
                >
                  <MenuItem value="POPULAR">Most Popular</MenuItem>
                  <MenuItem value="LATEST">Latest</MenuItem>
                  <MenuItem value="DURATION_ASC">Shortest first</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {FILTER_CHIPS.map((chip) => (
              <Chip
                key={chip.value}
                clickable
                label={chip.label}
                onClick={() => setTagFilter(chip.value)}
                color={tagFilter === chip.value ? 'primary' : 'default'}
                variant={tagFilter === chip.value ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: tagFilter === chip.value ? 'primary.main' : '#fff',
                  fontWeight: 600,
                }}
              />
            ))}
            <Chip
              clickable
              icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
              label="Filters"
              onClick={() => setShowFiltersHint((v) => !v)}
              variant={showFiltersHint ? 'filled' : 'outlined'}
              color={showFiltersHint ? 'primary' : 'default'}
              sx={{ borderRadius: 2.5, bgcolor: showFiltersHint ? 'primary.main' : '#fff', fontWeight: 600 }}
            />
          </Stack>

          {showFiltersHint && (
            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              Advanced filters will be backed by the public discovery API (`#117`) and wired in FE issue `#118`.
            </Alert>
          )}

          {filteredTrips.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#fff' }}>
              <Typography variant="h6">No trips match this filter</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>Try another query or switch chips.</Typography>
              <Button sx={{ mt: 2 }} onClick={() => { setSearch(''); setTagFilter('ALL'); setSort('POPULAR') }} variant="outlined">Reset filters</Button>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  component={RouterLink}
                  to={`/trips/${trip.id}`}
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    bgcolor: '#fff',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 16px 28px rgba(15, 23, 42, 0.12)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia component="img" image={trip.imageUrl} alt={trip.name} sx={{ height: 164 }} />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 'auto 0 0 0',
                        px: 1,
                        py: 0.75,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(180deg, transparent, rgba(15,23,42,0.72))',
                        color: '#fff',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{trip.city}</Typography>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Stack direction="row" spacing={0.4} alignItems="center"><FavoriteRoundedIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{trip.saves}</Typography></Stack>
                        <Stack direction="row" spacing={0.4} alignItems="center"><VisibilityRoundedIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{Math.round(trip.views / 10)}</Typography></Stack>
                      </Stack>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 1.5, flex: 1, display: 'flex' }}>
                    <Stack spacing={1} sx={{ height: '100%', width: '100%' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: '#24324a',
                          lineHeight: 1.15,
                          minHeight: '2.3em',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {trip.name}
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 0.75,
                          minHeight: 20,
                        }}
                      >
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {trip.days} days
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <FavoriteRoundedIcon sx={{ fontSize: 15, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {trip.saves} likes
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <GroupsRoundedIcon sx={{ fontSize: 15, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {trip.travelers} travelers
                          </Typography>
                        </Stack>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          minHeight: '2.6em',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {trip.highlight}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
                        <Chip size="small" label={trip.theme} variant="outlined" sx={{ borderRadius: 2 }} />
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'primary.main' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Open trip
                          </Typography>
                          <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    )
  }

  function renderSignInPanel() {
    return (
      <Box role="tabpanel" aria-label="Sign in">
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 } }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
            <Stack spacing={2}>
              <Stack spacing={0.5} textAlign="center" alignItems="center">
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <LoginRoundedIcon />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Sign in</Typography>
                <Typography color="text.secondary">Access your trips and collaboration workspace.</Typography>
              </Stack>

              <Stack component="form" spacing={1.5} onSubmit={loginForm.handleSubmit(onLoginSubmit)} noValidate>
                {loginError && <Alert severity="error">{loginError}</Alert>}
                <TextField label="Email" type="email" autoComplete="email" fullWidth {...loginForm.register('email')} error={Boolean(loginForm.formState.errors.email)} helperText={loginForm.formState.errors.email?.message} />
                <TextField label="Password" type="password" autoComplete="current-password" fullWidth {...loginForm.register('password')} error={Boolean(loginForm.formState.errors.password)} helperText={loginForm.formState.errors.password?.message} />
                <Button type="submit" variant="contained" startIcon={<LoginRoundedIcon />} disabled={isLoggingIn}>
                  {isLoggingIn ? 'Signing in...' : 'Sign in'}
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Need an account?{' '}
                  <Link component="button" type="button" underline="hover" onClick={() => setTab('signup')}>Create one</Link>
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    )
  }

  function renderSignUpPanel() {
    return (
      <Box role="tabpanel" aria-label="Sign up">
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 } }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
            <Stack spacing={2}>
              <Stack spacing={0.5} textAlign="center" alignItems="center">
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <PersonAddAlt1RoundedIcon />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Create account</Typography>
                <Typography color="text.secondary">Start planning and collaborating on trips in minutes.</Typography>
              </Stack>

              <Stack component="form" spacing={1.5} onSubmit={registerForm.handleSubmit(onRegisterSubmit)} noValidate>
                {registerError && <Alert severity="error">{registerError}</Alert>}
                <TextField label="Display name" autoComplete="name" fullWidth {...registerForm.register('displayName')} error={Boolean(registerForm.formState.errors.displayName)} helperText={registerForm.formState.errors.displayName?.message} />
                <TextField label="Email" type="email" autoComplete="email" fullWidth {...registerForm.register('email')} error={Boolean(registerForm.formState.errors.email)} helperText={registerForm.formState.errors.email?.message} />
                <TextField label="Password" type="password" autoComplete="new-password" fullWidth {...registerForm.register('password')} error={Boolean(registerForm.formState.errors.password)} helperText={registerForm.formState.errors.password?.message ?? 'Minimum 8 characters'} />
                <Button type="submit" variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} disabled={isRegistering}>
                  {isRegistering ? 'Creating account...' : 'Create account'}
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Already have an account?{' '}
                  <Link component="button" type="button" underline="hover" onClick={() => setTab('signin')}>Sign in</Link>
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e6edf7' }}>
      <Box component="a" href="#main-content" sx={{ position: 'absolute', left: -9999, '&:focus': { left: 16, top: 16, zIndex: 2000, bgcolor: 'primary.main', color: '#fff', px: 2, py: 1, borderRadius: 2 } }}>
        Skip to content
      </Box>

      <Paper square elevation={0} sx={{ borderBottom: '1px solid rgba(15,23,42,0.08)', bgcolor: 'rgba(255,255,255,0.92)' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minHeight: 72 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <TravelExploreRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#24324a' }}>
                Travel Companion
              </Typography>
            </Stack>

            <Tabs
              value={currentTab}
              onChange={(_event, value: ShellTab) => setTab(value)}
              aria-label="Anonymous shell tabs"
              sx={{
                minHeight: 48,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 999,
                  display: currentTab === 'signup' ? 'none' : 'block',
                },
                '& .MuiTab-root': { minHeight: 48, px: { xs: 1.5, md: 2.25 } },
              }}
            >
              <Tab value="discover" label="Discover" />
              <Tab value="signin" label="Sign in" />
              <Tab
                value="signup"
                label="Sign up"
                sx={{
                  border: '1px solid rgba(15,23,42,0.10)',
                  borderRadius: 999,
                  mx: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(21,112,239,0.10)',
                    borderColor: 'rgba(21,112,239,0.22)',
                  },
                }}
              />
            </Tabs>
          </Stack>
        </Container>
      </Paper>

      <Container id="main-content" maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 } }}>
        {currentTab === 'discover' && renderDiscoverPanel()}
        {currentTab === 'signin' && renderSignInPanel()}
        {currentTab === 'signup' && renderSignUpPanel()}
      </Container>
    </Box>
  )
}
