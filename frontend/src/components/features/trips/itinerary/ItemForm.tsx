import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
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
            code: z.ZodIssueCode.custom,
            path: ['date'],
            message: 'Date is required when destination is a day.',
          })
        } else if (values.date < tripStartDate || values.date > tripEndDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['date'],
            message: `Date must be between ${tripStartDate} and ${tripEndDate}.`,
          })
        }
      }

      if (mode === 'edit') return

      if (!values.placeName.trim() || !values.latitude || !values.longitude) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['placeName'],
          message: 'Place name, latitude, and longitude are required.',
        })
        return
      }

      if (Number.isNaN(parseFloat(values.latitude)) || Number.isNaN(parseFloat(values.longitude))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
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
  onCancel,
  onCreate,
  onEdit,
}: ItemFormProps) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(buildSchema(mode, tripStartDate, tripEndDate)),
    defaultValues: {
      placeName: initialPlaceName,
      notes: initialNotes,
      latitude: initialLatitude != null ? String(initialLatitude) : '',
      longitude: initialLongitude != null ? String(initialLongitude) : '',
      destinationType: mode === 'create' ? 'DAY' : initialDayNumber != null ? 'DAY' : 'PLACES',
      date: initialDayNumber != null ? toDateFromDayNumber(initialDayNumber, tripStartDate) : '',
    },
    mode: 'onSubmit',
  })

  const destinationType = form.watch('destinationType')

  useEffect(() => {
    if (destinationType === 'PLACES') {
      form.clearErrors('date')
    }
  }, [destinationType, form])

  async function handleSubmit(values: ItemFormValues) {
    let dayNumber: number | null | undefined
    if (values.destinationType === 'DAY') {
      dayNumber = toDayNumber(values.date, tripStartDate)
    }
    if (mode === 'edit' && values.destinationType === 'PLACES') {
      dayNumber = null
    }

    if (mode === 'edit') {
      await onEdit?.({ notes: values.notes, dayNumber })
      return
    }

    onCreate?.({
      placeName: values.placeName.trim(),
      notes: values.notes || undefined,
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      dayNumber: dayNumber ?? undefined,
    })
  }

  const fieldError =
    form.formState.errors.placeName?.message ||
    form.formState.errors.latitude?.message ||
    form.formState.errors.date?.message

  return (
    <Stack component="form" spacing={1.5} onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      {(errorMessage || fieldError) && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {fieldError || errorMessage}
        </Alert>
      )}

      {mode === 'create' ? (
        <>
          <TextField
            label="Place name"
            placeholder="Place or activity"
            fullWidth
            {...form.register('placeName')}
            error={Boolean(form.formState.errors.placeName)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Latitude"
              placeholder="Latitude"
              type="number"
              inputProps={{ step: 'any' }}
              fullWidth
              {...form.register('latitude')}
              error={Boolean(form.formState.errors.latitude)}
            />
            <TextField
              label="Longitude"
              placeholder="Longitude"
              type="number"
              inputProps={{ step: 'any' }}
              fullWidth
              {...form.register('longitude')}
              error={Boolean(form.formState.errors.longitude)}
            />
          </Stack>
        </>
      ) : null}

      <TextField
        id="itinerary-notes"
        label="Notes"
        placeholder="Notes"
        fullWidth
        {...form.register('notes')}
      />

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
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: tripStartDate, max: tripEndDate }}
            {...form.register('date')}
            error={Boolean(form.formState.errors.date)}
          />
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {mode === 'create' ? 'Add' : 'Save'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}
