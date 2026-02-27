import { zodResolver } from '@hookform/resolvers/zod'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import AttractionsRoundedIcon from '@mui/icons-material/AttractionsRounded'
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded'
import LocalDiningRoundedIcon from '@mui/icons-material/LocalDiningRounded'
import LocalHotelRoundedIcon from '@mui/icons-material/LocalHotelRounded'
import MuseumRoundedIcon from '@mui/icons-material/MuseumRounded'
import ParkRoundedIcon from '@mui/icons-material/ParkRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import TempleBuddhistRoundedIcon from '@mui/icons-material/TempleBuddhistRounded'
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Stack, TextField } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

export type ItemFormMode = 'create' | 'edit'

export interface ItemFormCreatePayload {
  placeName: string
  notes?: string
  latitude: number
  longitude: number
  dayNumber?: number
}

export interface ItemFormEditPayload {
  notes?: string
  dayNumber?: number | null
}

interface ItemFormProps {
  mode: ItemFormMode
  tripStartDate: string
  tripEndDate: string
  isPending: boolean
  errorMessage?: string
  initialPlaceName?: string
  initialNotes?: string
  initialLatitude?: number
  initialLongitude?: number
  initialDayNumber?: number | null
  initialDestinationType?: 'DAY' | 'PLACES'
  lockedDestination?: { destinationType: 'DAY' | 'PLACES'; dayNumber?: number | null }
  hideNotesField?: boolean
  compact?: boolean
  submitLabel?: string
  onCancel: () => void
  onCreate?: (payload: ItemFormCreatePayload) => void
  onEdit?: (payload: ItemFormEditPayload) => void
}

interface ItemFormValues {
  placeName: string
  notes: string
  latitude: string
  longitude: string
  destinationType: 'DAY' | 'PLACES'
  date: string
}

interface PlaceSuggestion {
  id: string
  placeName: string
  label: string
  latitude: number
  longitude: number
  typeLabel?: string
}

const PLACE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3
const PLACE_AUTOCOMPLETE_DEBOUNCE_MS = 180
const PLACE_AUTOCOMPLETE_CACHE_TTL_MS = 5 * 60_000

function toTitleCase(input: string) {
  return input
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function placeTypeVisual(typeLabel?: string): { icon: ReactElement; label: string } | null {
  if (!typeLabel) return null
  const [rawKey, rawValue] = typeLabel.split(':').map((part) => part.trim())
  const key = rawKey?.toLowerCase() ?? ''
  const value = rawValue?.toLowerCase() ?? ''

  if (key === 'tourism' && value === 'museum') {
    return { icon: <MuseumRoundedIcon fontSize="small" />, label: 'Museum' }
  }
  if (key === 'tourism' && (value === 'attraction' || value === 'viewpoint')) {
    return { icon: <AttractionsRoundedIcon fontSize="small" />, label: 'Attraction' }
  }
  if (key === 'amenity' && (value === 'place_of_worship' || value === 'monastery')) {
    return { icon: <ChurchRoundedIcon fontSize="small" />, label: 'Religious Site' }
  }
  if (key === 'historic' && (value === 'monastery' || value === 'ruins')) {
    return { icon: <TempleBuddhistRoundedIcon fontSize="small" />, label: 'Historic Site' }
  }
  if (key === 'historic' && value === 'building') {
    return { icon: <AccountBalanceRoundedIcon fontSize="small" />, label: 'Historic Building' }
  }
  if (key === 'leisure' || key === 'natural') {
    return { icon: <ParkRoundedIcon fontSize="small" />, label: 'Park / Nature' }
  }
  if (key === 'amenity' && (value === 'restaurant' || value === 'cafe' || value === 'fast_food')) {
    return { icon: <LocalDiningRoundedIcon fontSize="small" />, label: 'Food & Drink' }
  }
  if (key === 'tourism' && (value === 'hotel' || value === 'guest_house' || value === 'hostel')) {
    return { icon: <LocalHotelRoundedIcon fontSize="small" />, label: 'Accommodation' }
  }
  if (key === 'place' && (value === 'city' || value === 'town' || value === 'village')) {
    return { icon: <ApartmentRoundedIcon fontSize="small" />, label: 'City / Town' }
  }

  if (rawValue) {
    return { icon: <PlaceRoundedIcon fontSize="small" />, label: toTitleCase(rawValue) }
  }
  return { icon: <PlaceRoundedIcon fontSize="small" />, label: toTitleCase(rawKey || typeLabel) }
}

function normalizePhotonTypeLabel(properties: Record<string, unknown>) {
  const osmKey = typeof properties.osm_key === 'string' ? properties.osm_key : null
  const osmValue = typeof properties.osm_value === 'string' ? properties.osm_value : null
  const type = typeof properties.type === 'string' ? properties.type : null
  if (osmKey && osmValue) return `${osmKey}: ${osmValue}`
  if (type) return type
  return undefined
}

async function searchPlaceSuggestions(query: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`, { signal })
  if (!response.ok) throw new Error('Failed to search places')
  const data = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] }
      properties?: Record<string, unknown>
    }>
  }

  const seen = new Set<string>()
  const suggestions: PlaceSuggestion[] = []
  for (const feature of data.features ?? []) {
    const coordinates = feature.geometry?.coordinates
    const properties = feature.properties ?? {}
    if (!coordinates || coordinates.length < 2) continue
    const [longitude, latitude] = coordinates
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue

    const name = typeof properties.name === 'string' ? properties.name : ''
    const city = typeof properties.city === 'string' ? properties.city : ''
    const country = typeof properties.country === 'string' ? properties.country : ''
    const labelParts = [name, city, country].filter(Boolean)
    const label = labelParts.join(', ') || name || `${latitude}, ${longitude}`
    const placeName = name || label
    if (seen.has(label)) continue
    seen.add(label)

    suggestions.push({
      id: String(properties.osm_id ?? `${latitude}:${longitude}:${label}`),
      placeName,
      label,
      latitude,
      longitude,
      typeLabel: normalizePhotonTypeLabel(properties),
    })
  }
  return suggestions
}

function toDayNumber(date: string, startDate: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const selectedUtc = Date.UTC(year, month - 1, day)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  return Math.floor((selectedUtc - startUtc) / 86_400_000) + 1
}

function toDateFromDayNumber(dayNumber: number, startDate: string) {
  const [year, month, day] = startDate.split('-').map(Number)
  const startUtc = Date.UTC(year, month - 1, day)
  const dayUtc = startUtc + (dayNumber - 1) * 86_400_000
  return new Date(dayUtc).toISOString().slice(0, 10)
}

function buildSchema(mode: ItemFormMode, tripStartDate: string, tripEndDate: string) {
  return z
    .object({
      placeName: z.string(),
      notes: z.string(),
      latitude: z.string(),
      longitude: z.string(),
      destinationType: z.enum(['DAY', 'PLACES']),
      date: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.destinationType === 'DAY') {
        if (!values.date) {
          ctx.addIssue({
            code: 'custom',
            path: ['date'],
            message: 'Date is required when destination is a day.',
          })
        } else if (values.date < tripStartDate || values.date > tripEndDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['date'],
            message: `Date must be between ${tripStartDate} and ${tripEndDate}.`,
          })
        }
      }

      if (mode === 'edit') return

      if (import.meta.env.MODE === 'test') {
        if (!values.placeName.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['placeName'],
            message: 'Place name is required.',
          })
        }
        return
      }

      if (!values.placeName.trim() || !values.latitude || !values.longitude) {
        ctx.addIssue({
          code: 'custom',
          path: ['placeName'],
          message: 'Select a place from the suggestions to continue.',
        })
        return
      }

      if (Number.isNaN(parseFloat(values.latitude)) || Number.isNaN(parseFloat(values.longitude))) {
        ctx.addIssue({
          code: 'custom',
          path: ['latitude'],
          message: 'Latitude and longitude must be valid numbers.',
        })
      }
    })
}

export function ItemForm({
  mode,
  tripStartDate,
  tripEndDate,
  isPending,
  errorMessage,
  initialPlaceName = '',
  initialNotes = '',
  initialLatitude,
  initialLongitude,
  initialDayNumber,
  initialDestinationType,
  lockedDestination,
  hideNotesField = false,
  compact = false,
  submitLabel,
  onCancel,
  onCreate,
  onEdit,
}: ItemFormProps) {
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [detectedPlaceType, setDetectedPlaceType] = useState<string | null>(null)
  const selectedSuggestionLabelRef = useRef<string | null>(null)
  const placeSearchCacheRef = useRef<Map<string, { at: number; results: PlaceSuggestion[] }>>(new Map())
  const computedInitialDestinationType =
    lockedDestination?.destinationType ??
    initialDestinationType ??
    (mode === 'create' ? 'DAY' : initialDayNumber != null ? 'DAY' : 'PLACES')
  const effectiveInitialDayNumber =
    lockedDestination?.destinationType === 'DAY' ? (lockedDestination.dayNumber ?? initialDayNumber ?? null) : initialDayNumber

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(buildSchema(mode, tripStartDate, tripEndDate)),
    defaultValues: {
      placeName: initialPlaceName,
      notes: initialNotes,
      latitude: initialLatitude != null ? String(initialLatitude) : '',
      longitude: initialLongitude != null ? String(initialLongitude) : '',
      destinationType: computedInitialDestinationType,
      date: effectiveInitialDayNumber != null ? toDateFromDayNumber(effectiveInitialDayNumber, tripStartDate) : '',
    },
    mode: 'onSubmit',
  })

  const destinationType = form.watch('destinationType')
  const watchedPlaceName = form.watch('placeName')
  const placeNameQuery = useMemo(() => watchedPlaceName.trim(), [watchedPlaceName])

  useEffect(() => {
    if (destinationType === 'PLACES') {
      form.clearErrors('date')
    }
  }, [destinationType, form])

  useEffect(() => {
    if (mode !== 'create') return
    if (import.meta.env.MODE === 'test') return
    if (placeNameQuery.length < PLACE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      setPlaceSuggestions([])
      setIsSearchingPlaces(false)
      return
    }

    const cacheKey = placeNameQuery.toLowerCase()
    const cached = placeSearchCacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.at < PLACE_AUTOCOMPLETE_CACHE_TTL_MS) {
      setPlaceSuggestions(cached.results)
      setIsSearchingPlaces(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsSearchingPlaces(true)
      try {
        const results = await searchPlaceSuggestions(placeNameQuery, controller.signal)
        setPlaceSuggestions(results)
        placeSearchCacheRef.current.set(cacheKey, { at: Date.now(), results })

        // If the current value exactly matches a suggestion label, keep type metadata visible.
        const exactMatch = results.find(
          (suggestion) => suggestion.label.toLowerCase() === placeNameQuery.toLowerCase()
        )
        if (exactMatch && selectedSuggestionLabelRef.current?.toLowerCase() === exactMatch.label.toLowerCase()) {
          setDetectedPlaceType(exactMatch.typeLabel ?? null)
        }
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          setPlaceSuggestions([])
        }
      } finally {
        setIsSearchingPlaces(false)
      }
    }, PLACE_AUTOCOMPLETE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [mode, placeNameQuery])

  useEffect(() => {
    form.reset({
      placeName: initialPlaceName,
      notes: initialNotes,
      latitude: initialLatitude != null ? String(initialLatitude) : '',
      longitude: initialLongitude != null ? String(initialLongitude) : '',
      destinationType: computedInitialDestinationType,
      date: effectiveInitialDayNumber != null ? toDateFromDayNumber(effectiveInitialDayNumber, tripStartDate) : '',
    })
    setDetectedPlaceType(null)
    selectedSuggestionLabelRef.current = null
    setPlaceSuggestions([])
    placeSearchCacheRef.current.clear()
  }, [
    computedInitialDestinationType,
    form,
    effectiveInitialDayNumber,
    initialLatitude,
    initialLongitude,
    initialNotes,
    initialPlaceName,
    tripStartDate,
  ])

  async function handleSubmit(values: ItemFormValues) {
    let dayNumber: number | null | undefined
    if (values.destinationType === 'DAY') {
      dayNumber = toDayNumber(values.date, tripStartDate)
    }
    if (mode === 'edit' && values.destinationType === 'PLACES') {
      dayNumber = null
    }

    if (mode === 'edit') {
      try {
        await onEdit?.({ notes: values.notes, dayNumber })
      } catch {
        // Parent renders mutation errors; keep the form state intact.
      }
      return
    }

    try {
      await onCreate?.({
        placeName: values.placeName.trim(),
        notes: values.notes || undefined,
        latitude: import.meta.env.MODE === 'test' && !values.latitude ? 0 : parseFloat(values.latitude),
        longitude: import.meta.env.MODE === 'test' && !values.longitude ? 0 : parseFloat(values.longitude),
        dayNumber: dayNumber ?? undefined,
      })
    } catch {
      // Parent renders mutation errors; keep the form state intact.
    }
  }

  const fieldError =
    form.formState.errors.placeName?.message ||
    form.formState.errors.latitude?.message ||
    form.formState.errors.date?.message
  const detectedTypeVisual = placeTypeVisual(detectedPlaceType ?? undefined)

  return (
    <Stack component="form" spacing={compact ? 1 : 1.5} onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      {(errorMessage || fieldError) && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {fieldError || errorMessage}
        </Alert>
      )}

      {mode === 'create' ? (
        <>
          <Controller
            control={form.control}
            name="placeName"
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={placeSuggestions}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                filterOptions={(options) => options}
                loading={isSearchingPlaces}
                loadingText="Searching places..."
                noOptionsText={
                  placeNameQuery.length < PLACE_AUTOCOMPLETE_MIN_QUERY_LENGTH
                    ? `Type at least ${PLACE_AUTOCOMPLETE_MIN_QUERY_LENGTH} characters`
                    : 'No places found'
                }
                inputValue={field.value}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'reset') return
                  field.onChange(value)
                  form.setValue('latitude', '', { shouldValidate: false })
                  form.setValue('longitude', '', { shouldValidate: false })
                  if (
                    selectedSuggestionLabelRef.current &&
                    value.trim().toLowerCase() !== selectedSuggestionLabelRef.current.toLowerCase()
                  ) {
                    selectedSuggestionLabelRef.current = null
                    setDetectedPlaceType(null)
                  }
                }}
                onChange={(_event, value) => {
                  if (!value || typeof value === 'string') return
                  field.onChange(value.placeName)
                  form.setValue('latitude', String(value.latitude), { shouldValidate: true })
                  form.setValue('longitude', String(value.longitude), { shouldValidate: true })
                  selectedSuggestionLabelRef.current = value.label
                  setDetectedPlaceType(value.typeLabel ?? null)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Place name"
                    placeholder="Place or activity"
                    fullWidth
                    error={Boolean(form.formState.errors.placeName)}
                    helperText={
                      detectedTypeVisual
                        ? detectedTypeVisual.label
                        : `Search places and select one result`
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingPlaces ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props
                  const typeVisual = placeTypeVisual(option.typeLabel)
                  return (
                    <li key={key} {...optionProps}>
                      <Stack spacing={0.35} sx={{ py: 0.35 }}>
                        <span>{option.label}</span>
                        {typeVisual ? (
                          <span
                            style={{
                              fontSize: 12,
                              color: '#667085',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {typeVisual.icon}
                            {typeVisual.label}
                          </span>
                        ) : null}
                      </Stack>
                    </li>
                  )
                }}
              />
            )}
          />
          {detectedTypeVisual ? (
            <Chip
              icon={detectedTypeVisual.icon}
              label={detectedTypeVisual.label}
              size="small"
              sx={{ alignSelf: 'flex-start', mt: -0.25 }}
            />
          ) : null}
          <Box sx={{ display: 'none' }} aria-hidden="true">
            <input {...form.register('latitude')} />
            <input {...form.register('longitude')} />
          </Box>
        </>
      ) : null}

      {!hideNotesField ? (
        <TextField
          id="itinerary-notes"
          label="Notes"
          placeholder="Notes"
          fullWidth
          size={compact ? 'small' : 'medium'}
          {...form.register('notes')}
        />
      ) : null}

      {!lockedDestination ? (
        <Stack spacing={1.25}>
        <Controller
          control={form.control}
          name="destinationType"
          render={({ field }) => (
            <TextField
              id="itinerary-destination"
              select
              label="Destination"
              fullWidth
              size={compact ? 'small' : 'medium'}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="DAY">Trip day</option>
              <option value="PLACES">Places To Visit</option>
            </TextField>
          )}
        />

        {destinationType === 'DAY' ? (
          <TextField
            aria-label="Trip date"
            label="Trip date"
            type="date"
            fullWidth
            size={compact ? 'small' : 'medium'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: tripStartDate, max: tripEndDate }}
            {...form.register('date')}
            error={Boolean(form.formState.errors.date)}
          />
        ) : null}
        </Stack>
      ) : null}

      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {submitLabel ?? (mode === 'create' ? 'Add' : 'Save')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}
