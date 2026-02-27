import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent } from 'react'
import type { Trip, TripVisibility } from '../../../../api/trips'

interface TripDetailsSectionProps {
  trip: Trip
  tripDetailsError: string
  canEditTripDetails: boolean
  canEditPrivacy: boolean
  tripName: string
  tripStartDate: string
  tripEndDate: string
  tripVisibility: TripVisibility
  isSaving: boolean
  onTripNameChange: (value: string) => void
  onTripStartDateChange: (value: string) => void
  onTripEndDateChange: (value: string) => void
  onTripVisibilityChange: (value: TripVisibility) => void
  onSubmit: (e: FormEvent<HTMLFormElement>, canEditPrivacy: boolean) => void
}

export function TripDetailsSection({
  trip,
  tripDetailsError,
  canEditTripDetails,
  canEditPrivacy,
  tripName,
  tripStartDate,
  tripEndDate,
  tripVisibility,
  isSaving,
  onTripNameChange,
  onTripStartDateChange,
  onTripEndDateChange,
  onTripVisibilityChange,
  onSubmit,
}: TripDetailsSectionProps) {
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
                <SettingsRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#223046' }}>
                Trip details
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Configure core trip information, dates, and visibility settings.
            </Typography>
          </Stack>

          {tripDetailsError ? (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {tripDetailsError}
            </Alert>
          ) : null}

          {canEditTripDetails ? (
            <Stack component="form" onSubmit={(e) => onSubmit(e, canEditPrivacy)} spacing={1.25}>
              <TextField
                label="Trip name"
                value={tripName}
                onChange={(e) => onTripNameChange(e.target.value)}
                required
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  type="date"
                  label="Start date"
                  value={tripStartDate}
                  onChange={(e) => onTripStartDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <TextField
                  type="date"
                  label="End date"
                  value={tripEndDate}
                  onChange={(e) => onTripEndDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Stack>

              <TextField
                select
                id="trip-visibility"
                label="Privacy"
                value={tripVisibility}
                onChange={(e) => onTripVisibilityChange(e.target.value as TripVisibility)}
                disabled={!canEditPrivacy}
                SelectProps={{ native: true }}
                sx={{ maxWidth: 220 }}
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </TextField>

              {!canEditPrivacy ? (
                <Typography variant="caption" color="text.secondary">
                  Only owners can change privacy.
                </Typography>
              ) : null}

              <Box>
                <Button type="submit" variant="contained" disabled={isSaving}>
                  Save details
                </Button>
              </Box>
            </Stack>
          ) : (
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2.5, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(255,255,255,0.96)' }}
            >
              <Stack spacing={0.45}>
                <Typography sx={{ fontWeight: 700, color: '#223046' }}>{trip.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {trip.startDate} - {trip.endDate}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Privacy: {trip.visibility ?? 'PRIVATE'}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
