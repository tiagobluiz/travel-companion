import MapRoundedIcon from '@mui/icons-material/MapRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import SatelliteAltRoundedIcon from '@mui/icons-material/SatelliteAltRounded'
import { Box, Button, Divider, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'
import { DayColumn } from './DayColumn'
import { PlacesToVisitColumn } from './PlacesToVisitColumn'
import { ItineraryDragContext } from './dnd/DragContext'
import { dayContainerId } from './dnd/mappers'

interface ItineraryBoardProps {
  itinerary?: ItineraryV2Response
  isLoading: boolean
  loadError: unknown
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  tripStartDate: string
  tripEndDate: string
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => Promise<void> | void
  onRemove: (itemId: string) => void
}

function ItineraryMapPreview({ itinerary }: { itinerary: ItineraryV2Response }) {
  const [mapMode, setMapMode] = useState<'MAP' | 'SATELLITE'>('MAP')
  const routeStops = useMemo(() => {
    const scheduled = itinerary.days.flatMap((day) =>
      day.items.map((item) => ({ id: item.id, label: item.placeName, dayNumber: day.dayNumber }))
    )
    const backlog = itinerary.placesToVisit.items.map((item) => ({
      id: item.id,
      label: item.placeName,
      dayNumber: null as number | null,
    }))
    return [...scheduled.slice(0, 8), ...backlog.slice(0, 3)]
  }, [itinerary])

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        borderColor: 'rgba(15,23,42,0.08)',
        bgcolor: 'rgba(255,255,255,0.95)',
      }}
    >
      <Stack spacing={0}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1.2 }}>
          <Typography sx={{ fontWeight: 800, color: '#223046' }}>Route map</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mapMode}
            onChange={(_e, value: 'MAP' | 'SATELLITE' | null) => {
              if (value) setMapMode(value)
            }}
            aria-label="Map mode"
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.1,
                py: 0.35,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 12,
              },
            }}
          >
            <ToggleButton value="MAP" aria-label="Map">
              <MapRoundedIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Map
            </ToggleButton>
            <ToggleButton value="SATELLITE" aria-label="Satellite">
              <SatelliteAltRoundedIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Satellite
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            minHeight: { xs: 220, lg: 420 },
            borderTop: '1px solid rgba(15,23,42,0.06)',
            background:
              mapMode === 'MAP'
                ? 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 50%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.14), transparent 45%), linear-gradient(180deg, #eef4ff 0%, #f8fbff 60%, #eef6ff 100%)'
                : 'radial-gradient(circle at 25% 25%, rgba(15,23,42,0.22), transparent 52%), radial-gradient(circle at 75% 20%, rgba(59,130,246,0.18), transparent 46%), linear-gradient(180deg, #dfe6ee 0%, #eef2f7 55%, #d7e1ea 100%)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.55,
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: '12% 10% 16% 10%',
              pointerEvents: 'none',
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M8,72 C20,60 23,40 38,42 C53,44 51,70 66,68 C80,66 82,42 92,34"
                fill="none"
                stroke="#2f6fe4"
                strokeWidth="2.2"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
              {[12, 27, 40, 55, 71, 86].map((x, idx) => (
                <circle key={x} cx={x} cy={[72, 58, 44, 61, 52, 37][idx]} r="2.3" fill="#2f6fe4" />
              ))}
            </svg>
          </Box>
          <Stack spacing={0.8} sx={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
            <Paper
              elevation={0}
              sx={{
                px: 1.2,
                py: 0.9,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(15,23,42,0.08)',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <RouteRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {itinerary.days.reduce((sum, day) => sum + day.items.length, 0)} scheduled stops
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: '#667085', fontWeight: 700 }}>
                  Preview
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>

        <Stack spacing={0.75} sx={{ p: 1.25 }}>
          {routeStops.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Add itinerary items to generate a route preview.
            </Typography>
          ) : (
            routeStops.slice(0, 6).map((stop, index) => (
              <Stack
                key={stop.id}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: 'rgba(248,250,252,0.9)',
                  border: '1px solid rgba(15,23,42,0.06)',
                }}
              >
                <Box
                  sx={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: 'rgba(21,112,239,0.10)',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11 }}>
                    {index + 1}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#223046', flex: 1, minWidth: 0 }}>
                  {`${index + 1}. ${stop.label}`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#667085', fontWeight: 700 }}>
                  {stop.dayNumber == null ? 'Backlog' : `Day ${stop.dayNumber}`}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

function OverviewRail({ itinerary }: { itinerary: ItineraryV2Response }) {
  const totalScheduled = itinerary.days.reduce((sum, day) => sum + day.items.length, 0)
  return (
    <Stack spacing={1.25}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 3,
          borderColor: 'rgba(15,23,42,0.08)',
          bgcolor: 'rgba(255,255,255,0.95)',
        }}
      >
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 800, color: '#223046' }}>Trip Overview</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Box sx={{ px: 1, py: 0.6, borderRadius: 1.75, bgcolor: 'rgba(21,112,239,0.08)', color: '#2459b8' }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {itinerary.days.length} days
              </Typography>
            </Box>
            <Box sx={{ px: 1, py: 0.6, borderRadius: 1.75, bgcolor: 'rgba(15,23,42,0.05)', color: '#344054' }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {totalScheduled} scheduled
              </Typography>
            </Box>
            <Box sx={{ px: 1, py: 0.6, borderRadius: 1.75, bgcolor: 'rgba(245,158,11,0.10)', color: '#92400e' }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {itinerary.placesToVisit.items.length} in backlog
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          borderRadius: 3,
          borderColor: 'rgba(15,23,42,0.08)',
          bgcolor: 'rgba(255,255,255,0.95)',
        }}
      >
        <Stack spacing={0.8}>
          {itinerary.days.map((day) => (
            <Box
              key={day.dayNumber}
              sx={{
                px: 1.1,
                py: 0.9,
                borderRadius: 2,
                border: '1px solid rgba(15,23,42,0.06)',
                bgcolor: 'rgba(246,248,252,0.9)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                <Stack spacing={0.15}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#223046' }}>
                    Day {day.dayNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#667085' }}>
                    {day.date}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#667085' }}>
                  {day.items.length}
                </Typography>
              </Stack>
            </Box>
          ))}
          <Divider sx={{ my: 0.25 }} />
          <Box
            sx={{
              px: 1.1,
              py: 0.9,
              borderRadius: 2,
              border: '1px solid rgba(15,23,42,0.06)',
              bgcolor: 'rgba(246,248,252,0.9)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
              <Stack direction="row" spacing={0.8} alignItems="center">
                <PlaceRoundedIcon sx={{ fontSize: 16, color: '#667085' }} />
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#223046' }}>
                  Backlog
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#667085' }}>
                {itinerary.placesToVisit.items.length}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}

export function ItineraryBoard({
  itinerary,
  isLoading,
  loadError,
  canEditPlanning,
  isMovePending,
  isEditPending,
  tripStartDate,
  tripEndDate,
  onMove,
  onEdit,
  onRemove,
}: ItineraryBoardProps) {
  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography color="text.secondary">Loading itinerary days...</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography color="text.secondary">Loading places to visit...</Typography>
        </Paper>
      </Stack>
    )
  }

  if (loadError) {
    return (
      <Stack spacing={1.5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(240,68,56,0.24)', bgcolor: 'rgba(254,242,242,0.7)' }}>
          <Typography sx={{ color: '#b42318' }}>Failed to load itinerary.</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(240,68,56,0.24)', bgcolor: 'rgba(254,242,242,0.7)' }}>
          <Typography sx={{ color: '#b42318' }}>Failed to load places to visit.</Typography>
        </Paper>
      </Stack>
    )
  }

  if (!itinerary) {
    return (
      <Stack spacing={1.5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography color="text.secondary">No itinerary data available.</Typography>
        </Paper>
      </Stack>
    )
  }

  return (
    <ItineraryDragContext
      itinerary={itinerary}
      disabled={!canEditPlanning || isMovePending || isEditPending}
      onMove={onMove}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 3,
              borderColor: 'rgba(15,23,42,0.08)',
              bgcolor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800, color: '#223046' }}>Trip planning workspace</Typography>
              <Typography variant="body2" color="text.secondary">
                Mobile uses list-first planning with action-menu move fallback and map preview entry.
              </Typography>
              <Button variant="outlined" startIcon={<MapRoundedIcon />} sx={{ alignSelf: 'flex-start' }}>
                Open map preview
              </Button>
            </Stack>
          </Paper>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              lg: '220px minmax(0, 1fr) 360px',
              xl: '240px minmax(0, 1fr) 390px',
            },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 88, alignSelf: 'start' }}>
            <OverviewRail itinerary={itinerary} />
          </Box>

          <Stack spacing={1.5}>
            {itinerary.days.map((day, dayIndex) => (
              <DayColumn
                key={day.dayNumber}
                containerId={dayContainerId(day.dayNumber)}
                day={day}
                dayIndex={dayIndex}
                totalDays={itinerary.days.length}
                previousDayNumber={itinerary.days[dayIndex - 1]?.dayNumber}
                nextDayNumber={itinerary.days[dayIndex + 1]?.dayNumber}
                canEditPlanning={canEditPlanning}
                isMovePending={isMovePending}
                isEditPending={isEditPending}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                onMove={onMove}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            ))}

            <PlacesToVisitColumn
              containerId="places"
              placesToVisit={itinerary.placesToVisit}
              firstDayNumber={itinerary.days[0]?.dayNumber}
              canEditPlanning={canEditPlanning}
              isMovePending={isMovePending}
              isEditPending={isEditPending}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onMove={onMove}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          </Stack>

          <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 88, alignSelf: 'start' }}>
            <ItineraryMapPreview itinerary={itinerary} />
          </Box>
        </Box>
      </Stack>
    </ItineraryDragContext>
  )
}
