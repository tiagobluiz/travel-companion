import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputBase,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTrip, fetchTrips, type CreateTripRequest, type Trip } from '../../../api/trips'
import { useAuthStore } from '../../../stores/authStore'
import { ApiError } from '../../../api/client'
import { keyframes } from '@mui/system'

type SortOption = 'RECENT' | 'START_ASC' | 'DURATION_DESC'
type StatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED'
type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE'

const createTripSchema = z
  .object({
    name: z.string().min(2, 'Trip name must be at least 2 characters').max(80, 'Trip name is too long'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })

type CreateTripFormValues = z.infer<typeof createTripSchema>

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
]

const PENDING_INVITE_PREVIEW = [
  {
    id: 'invite-1',
    tripName: 'Family Vacation in Portugal',
    role: 'Editor',
    invitedBy: 'Marta',
    invitedByProfilePath: '/profile/marta',
  },
  {
    id: 'invite-2',
    tripName: 'Japan Highlights',
    role: 'Viewer',
    invitedBy: 'Kenji',
    invitedByProfilePath: '/profile/kenji',
  },
]

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endText = end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${startText} - ${endText}`
}

function tripDurationDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  return Math.max(diff, 1)
}

function formatRelativeDate(isoString: string) {
  const created = new Date(isoString).getTime()
  const now = Date.now()
  const days = Math.max(0, Math.floor((now - created) / 86_400_000))
  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  return `Updated ${days} days ago`
}

function startOfDayTimestamp(dateString: string) {
  return new Date(`${dateString}T00:00:00`).getTime()
}

function getTimingState(startDate: string, endDate: string): 'ONGOING' | 'UPCOMING' | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const start = startOfDayTimestamp(startDate)
  const end = startOfDayTimestamp(endDate)
  if (today >= start && today <= end) return 'ONGOING'
  const daysUntilStart = Math.floor((start - today) / 86_400_000)
  if (daysUntilStart >= 0 && daysUntilStart < 7) return 'UPCOMING'
  return null
}

function getOngoingProgress(startDate: string, endDate: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const start = startOfDayTimestamp(startDate)
  const end = startOfDayTimestamp(endDate)
  const totalDays = Math.max(1, Math.floor((end - start) / 86_400_000) + 1)
  const elapsedDays = Math.min(totalDays, Math.max(1, Math.floor((today - start) / 86_400_000) + 1))
  const percent = Math.round((elapsedDays / totalDays) * 100)
  return { elapsedDays, totalDays, percent }
}

function sortTrips(trips: Trip[], sort: SortOption) {
  return [...trips].sort((a, b) => {
    if (sort === 'START_ASC') return Date.parse(a.startDate) - Date.parse(b.startDate)
    if (sort === 'DURATION_DESC') {
      return tripDurationDays(b.startDate, b.endDate) - tripDurationDays(a.startDate, a.endDate)
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
}

function statusLabel(status: Trip['status']) {
  return status === 'ARCHIVED' ? 'Archived' : 'Active'
}

function visibilityLabel(visibility: Trip['visibility']) {
  return visibility === 'PUBLIC' ? 'Public' : 'Private'
}

function timingLabel(state: 'ONGOING' | 'UPCOMING') {
  return state === 'ONGOING' ? 'Ongoing' : 'Upcoming'
}

const partyHornWiggle = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  18% { transform: rotate(-10deg) scale(1.03); }
  36% { transform: rotate(8deg) scale(1.04); }
  54% { transform: rotate(-6deg) scale(1.02); }
  72% { transform: rotate(5deg) scale(1.03); }
  100% { transform: rotate(0deg) scale(1); }
`

function MetaBadge({
  label,
  icon,
  tone = 'neutral',
}: {
  label: string
  icon?: ReactNode
  tone?: 'neutral' | 'archived' | 'ongoing' | 'upcoming'
}) {
  const isArchived = tone === 'archived'
  const isOngoing = tone === 'ongoing'
  const isUpcoming = tone === 'upcoming'
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: 1.25,
        border: '1px solid',
        borderColor: isArchived
          ? 'rgba(99, 115, 129, 0.20)'
          : isOngoing
            ? 'rgba(2, 132, 199, 0.20)'
            : isUpcoming
              ? 'rgba(245, 158, 11, 0.25)'
              : 'rgba(15,23,42,0.08)',
        bgcolor: isArchived
          ? 'rgba(99,115,129,0.08)'
          : isOngoing
            ? 'rgba(2,132,199,0.08)'
            : isUpcoming
              ? 'rgba(245,158,11,0.10)'
              : 'rgba(255,255,255,0.85)',
        color: isArchived ? '#475467' : isOngoing ? '#0c4a6e' : isUpcoming ? '#92400e' : '#344054',
        animation: 'none',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
        {label}
      </Typography>
      {icon ? (
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            '& svg': { fontSize: 14 },
            ...(isUpcoming
              ? {
                  fontSize: 14,
                  lineHeight: 1,
                  transformOrigin: '70% 50%',
                  animation: `${partyHornWiggle} 1.8s ease-in-out infinite`,
                }
              : {}),
          }}
        >
          {icon}
        </Box>
      ) : null}
    </Box>
  )
}

function ActiveFilterPill({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.1,
        py: 0.55,
        borderRadius: 1.5,
        border: '1px solid rgba(21,112,239,0.14)',
        bgcolor: 'rgba(21,112,239,0.06)',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#2459b8' }}>
        {label}
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 18,
          height: 18,
          borderRadius: 0.75,
          border: 'none',
          bgcolor: 'rgba(21,112,239,0.10)',
          color: '#2459b8',
          cursor: 'pointer',
          p: 0,
          '&:hover': { bgcolor: 'rgba(21,112,239,0.18)' },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [sort, setSort] = useState<SortOption>('RECENT')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  const createForm = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
    mode: 'onBlur',
  })

  const { data: trips = [], isLoading, isError, error } = useQuery({
    queryKey: ['trips', 'ALL'],
    queryFn: () => fetchTrips('ALL'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTripRequest) => createTrip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setShowCreateDialog(false)
      createForm.reset()
    },
  })

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trips.filter((trip) => {
      const matchesSearch =
        q.length === 0 ||
        trip.name.toLowerCase().includes(q) ||
        trip.itineraryItems.some((item) => item.placeName.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter
      const matchesVisibility = visibilityFilter === 'ALL' || trip.visibility === visibilityFilter
      return matchesSearch && matchesStatus && matchesVisibility
    })
  }, [search, statusFilter, trips, visibilityFilter])
  const sortedTrips = useMemo(() => sortTrips(filteredTrips, sort), [filteredTrips, sort])
  const activeTrips = sortedTrips.filter((trip) => trip.status === 'ACTIVE')
  const archivedTrips = sortedTrips.filter((trip) => trip.status === 'ARCHIVED')

  const greetingName = user?.displayName?.trim() || 'traveler'
  const tripsQueryAuthError =
    isError && error instanceof ApiError && (error.status === 401 || error.status === 403)
  const createAuthError =
    createMutation.isError && createMutation.error instanceof ApiError && (createMutation.error.status === 401 || createMutation.error.status === 403)

  useEffect(() => {
    if (!tripsQueryAuthError && !createAuthError) return
    logout()
    queryClient.removeQueries({ queryKey: ['trips'] })
    navigate('/?tab=signin&returnTo=%2F', { replace: true })
  }, [createAuthError, logout, navigate, queryClient, tripsQueryAuthError])

  function openCreateDialog() {
    createMutation.reset()
    setShowCreateDialog(true)
  }

  function closeCreateDialog() {
    if (createMutation.isPending) return
    setShowCreateDialog(false)
  }

  function onSubmit(values: CreateTripFormValues) {
    createMutation.mutate(values)
  }

  const activeFilterItems = [
    search.trim()
      ? {
          key: 'search',
          label: `Search: ${search.trim()}`,
          onRemove: () => setSearch(''),
        }
      : null,
    statusFilter !== 'ALL'
      ? {
          key: 'status',
          label: `Status: ${statusFilter === 'ACTIVE' ? 'Active' : 'Archived'}`,
          onRemove: () => setStatusFilter('ALL'),
        }
      : null,
    visibilityFilter !== 'ALL'
      ? {
          key: 'visibility',
          label: `Visibility: ${visibilityFilter === 'PUBLIC' ? 'Public' : 'Private'}`,
          onRemove: () => setVisibilityFilter('ALL'),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>
  const hasActiveFilters = activeFilterItems.length > 0

  function renderTripCard(trip: Trip, indexSeed: number) {
    const days = tripDurationDays(trip.startDate, trip.endDate)
    const coverImage = HERO_IMAGES[indexSeed % HERO_IMAGES.length]
    const timingState = getTimingState(trip.startDate, trip.endDate)
    const ongoingProgress = timingState === 'ONGOING' ? getOngoingProgress(trip.startDate, trip.endDate) : null

    return (
      <Card
        key={trip.id}
        component={RouterLink}
        to={`/trips/${trip.id}`}
        sx={{
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(15,23,42,0.06)',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(15, 23, 42, 0.10)' },
        }}
      >
        <CardMedia component="img" image={coverImage} alt={trip.name} sx={{ height: { xs: 156, md: 184 } }} />
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#2b3852' }}>
                {trip.name}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {timingState ? (
                  <MetaBadge
                    label={timingLabel(timingState)}
                    icon={timingState === 'UPCOMING' ? <span aria-hidden="true">🥳</span> : undefined}
                    tone={timingState === 'ONGOING' ? 'ongoing' : 'upcoming'}
                  />
                ) : null}
                {trip.status === 'ARCHIVED' ? <MetaBadge label={statusLabel(trip.status)} tone="archived" /> : null}
                <MetaBadge
                  icon={trip.visibility === 'PUBLIC' ? <PublicRoundedIcon /> : <LockRoundedIcon />}
                  label={visibilityLabel(trip.visibility)}
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ color: 'text.secondary' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">{formatDateRange(trip.startDate, trip.endDate)}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <ScheduleRoundedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {days} {days === 1 ? 'day' : 'days'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <PlaceRoundedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {trip.itineraryItems.length} {trip.itineraryItems.length === 1 ? 'item' : 'items'}
                </Typography>
              </Stack>
            </Stack>

            {ongoingProgress ? (
              <Stack spacing={0.6}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#0c4a6e', fontWeight: 700 }}>
                    Day {ongoingProgress.elapsedDays} of {ongoingProgress.totalDays}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {ongoingProgress.percent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={ongoingProgress.percent}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: 'rgba(2,132,199,0.10)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, #38bdf8 0%, #1570ef 100%)',
                    },
                  }}
                />
              </Stack>
            ) : (
              <Divider />
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {formatRelativeDate(trip.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  Open Trip
                  <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  function renderArchivedSeparator() {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Divider sx={{ flex: 1, borderColor: 'rgba(99,115,129,0.28)' }} />
        <Typography
          variant="caption"
          sx={{
            color: '#667085',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Archived Trips
        </Typography>
        <Divider sx={{ flex: 1, borderColor: 'rgba(99,115,129,0.28)' }} />
      </Stack>
    )
  }

  if (tripsQueryAuthError || createAuthError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#e7edf7' }}>
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
            Your session expired. Redirecting to sign in...
          </Alert>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e7edf7' }}>
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

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button startIcon={<HomeRoundedIcon />} variant="text" sx={{ color: 'primary.main', fontWeight: 700 }}>
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

            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(21,112,239,0.12)', color: 'primary.main', fontWeight: 700 }}>
                {greetingName.slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack spacing={0}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {greetingName}
                </Typography>
                <Button onClick={logout} variant="text" size="small" sx={{ minHeight: 'auto', p: 0, justifyContent: 'flex-start' }}>
                  Sign out
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(15,23,42,0.06)',
              bgcolor: 'rgba(255,255,255,0.92)',
              p: { xs: 2, md: 2.5 },
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' }, fontWeight: 800, color: '#2a3650' }}>
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {greetingName}
                </Typography>
                <Typography color="text.secondary">
                  Your trips live in one place. Filter by status or visibility, then jump back into planning.
                </Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2, borderColor: 'rgba(15,23,42,0.06)' }} />

            <Stack spacing={1.25}>
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
                    inputProps={{ 'aria-label': 'Search trips or places' }}
                    sx={{ flex: 1, fontSize: 15 }}
                  />
                </Stack>

                <Divider
                  orientation="vertical"
                  sx={{ display: { xs: 'none', md: 'block' }, alignSelf: 'center', height: 24 }}
                />

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: { md: 'auto' } }}>
                  <Typography variant="body2" sx={{ color: '#475467', whiteSpace: 'nowrap' }}>
                    Sort by:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 190 }}>
                    <Select
                      value={sort}
                      onChange={(event: SelectChangeEvent<SortOption>) => setSort(event.target.value as SortOption)}
                      variant="standard"
                      disableUnderline
                      inputProps={{ 'aria-label': 'Sort trips' }}
                      sx={{
                        fontWeight: 600,
                        color: '#344054',
                        '& .MuiSelect-select': { py: 0.5, pr: '24px !important' },
                      }}
                    >
                      <MenuItem value="RECENT">Recently updated</MenuItem>
                      <MenuItem value="START_ASC">Start date (soonest)</MenuItem>
                      <MenuItem value="DURATION_DESC">Longest trip first</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider
                    orientation="vertical"
                    sx={{ display: { xs: 'none', md: 'block' }, alignSelf: 'center', height: 24 }}
                  />

                  <Button
                    type="button"
                    onClick={() => setShowFiltersPanel((prev) => !prev)}
                    variant="text"
                    startIcon={<TuneRoundedIcon />}
                    sx={{ color: '#475467', fontWeight: 700 }}
                  >
                    Filters
                  </Button>
                </Stack>
              </Paper>

              {activeFilterItems.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {activeFilterItems.map((item) => (
                    <ActiveFilterPill key={item.key} label={item.label} onRemove={item.onRemove} />
                  ))}
                </Stack>
              ) : null}

              {showFiltersPanel ? (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                    <InputLabel id="dashboard-status-filter-label">Status</InputLabel>
                    <Select
                      labelId="dashboard-status-filter-label"
                      value={statusFilter}
                      label="Status"
                      onChange={(event: SelectChangeEvent<StatusFilter>) => setStatusFilter(event.target.value as StatusFilter)}
                    >
                      <MenuItem value="ALL">All statuses</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
                    <InputLabel id="dashboard-visibility-filter-label">Visibility</InputLabel>
                    <Select
                      labelId="dashboard-visibility-filter-label"
                      value={visibilityFilter}
                      label="Visibility"
                      onChange={(event: SelectChangeEvent<VisibilityFilter>) =>
                        setVisibilityFilter(event.target.value as VisibilityFilter)
                      }
                    >
                      <MenuItem value="ALL">All visibility</MenuItem>
                      <MenuItem value="PRIVATE">Private</MenuItem>
                      <MenuItem value="PUBLIC">Public</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              ) : null}
            </Stack>
          </Paper>

          {isError ? (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {error instanceof Error ? error.message : 'Unable to load trips right now.'}
            </Alert>
          ) : null}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' } }}>
            <Stack spacing={2}>
              {isLoading ? (
                <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                  <Typography color="text.secondary">Loading trips...</Typography>
                </Paper>
              ) : sortedTrips.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Stack spacing={1.5} alignItems="center">
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(21,112,239,0.08)', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
                      <FlightTakeoffRoundedIcon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {hasActiveFilters ? 'No trips match your filters' : 'No trips yet'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
                      {hasActiveFilters
                        ? 'Try clearing or adjusting filters to see your trips.'
                        : 'Create your first trip to start planning dates, places, and collaborators in one workspace.'}
                    </Typography>
                    {hasActiveFilters ? null : (
                      <Button variant="contained" onClick={openCreateDialog} startIcon={<AddRoundedIcon />}>
                        Create trip
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {statusFilter !== 'ARCHIVED' ? (
                    activeTrips.length > 0 ? (
                      activeTrips.map((trip, index) => renderTripCard(trip, index))
                    ) : statusFilter === 'ACTIVE' ? (
                      <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                        <Typography variant="body2" color="text.secondary">
                          No active trips match the current filters.
                        </Typography>
                      </Paper>
                    ) : null
                  ) : null}

                  {statusFilter !== 'ACTIVE' ? (
                    archivedTrips.length > 0 ? (
                      <Stack spacing={1.5}>
                        {renderArchivedSeparator()}
                        {archivedTrips.map((trip, index) => renderTripCard(trip, activeTrips.length + index))}
                      </Stack>
                    ) : statusFilter === 'ARCHIVED' ? (
                      <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                        <Typography variant="body2" color="text.secondary">
                          No archived trips match the current filters.
                        </Typography>
                      </Paper>
                    ) : null
                  ) : null}
                </Stack>
              )}
            </Stack>

            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid rgba(15,23,42,0.06)',
                  bgcolor: 'rgba(255,255,255,0.92)',
                  p: 2,
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2b3852' }}>
                    Create a new trip
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 2.5,
                      p: 2,
                      background: 'linear-gradient(180deg, rgba(21,112,239,0.10), rgba(21,112,239,0.03))',
                      border: '1px solid rgba(21,112,239,0.10)',
                    }}
                  >
                    <Stack spacing={1.25} alignItems="flex-start">
                      <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
                        <FlightTakeoffRoundedIcon />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#4a5875' }}>
                        Start with dates and a name. You can add destinations, collaborators, and details inside the trip.
                      </Typography>
                      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateDialog} fullWidth>
                        Create trip
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid rgba(15,23,42,0.06)',
                  bgcolor: 'rgba(255,255,255,0.92)',
                  p: 2,
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2b3852' }}>
                      Pending invites
                    </Typography>
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        px: 0.75,
                        borderRadius: 1.25,
                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                        color: '#b42318',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>
                        {PENDING_INVITE_PREVIEW.length}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={1}>
                    {PENDING_INVITE_PREVIEW.map((invite) => (
                      <Box
                        key={invite.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          border: '1px solid rgba(15,23,42,0.06)',
                          bgcolor: 'rgba(246,248,252,0.95)',
                        }}
                      >
                        <Stack spacing={0.35}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2b3852' }}>
                            {invite.tripName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Invited by{' '}
                            <Link
                              component={RouterLink}
                              to={invite.invitedByProfilePath}
                              underline="hover"
                              color="inherit"
                              sx={{ fontWeight: 700 }}
                            >
                              {invite.invitedBy}
                            </Link>{' '}
                            · {invite.role}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>

                  <Divider />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Invite list is a preview in this UI pass and will be wired to a dedicated API.
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    View invites
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Container>

      <Dialog
        open={showCreateDialog}
        onClose={closeCreateDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="create-trip-dialog-title"
      >
        <DialogTitle id="create-trip-dialog-title">Create a new trip</DialogTitle>
        <DialogContent>
          <Box component="form" id="create-trip-form" onSubmit={createForm.handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <Stack spacing={2}>
              {createMutation.isError ? (
                <Alert severity="error">
                  {createMutation.error instanceof Error ? createMutation.error.message : 'Unable to create trip right now.'}
                </Alert>
              ) : null}
              <TextField
                label="Trip name"
                autoFocus
                {...createForm.register('name')}
                error={!!createForm.formState.errors.name}
                helperText={createForm.formState.errors.name?.message}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                  {...createForm.register('startDate')}
                  error={!!createForm.formState.errors.startDate}
                  helperText={createForm.formState.errors.startDate?.message}
                />
                <TextField
                  label="End date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                  {...createForm.register('endDate')}
                  error={!!createForm.formState.errors.endDate}
                  helperText={createForm.formState.errors.endDate?.message}
                />
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeCreateDialog} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-trip-form" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create trip'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
