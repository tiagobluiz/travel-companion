import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ItineraryItemV2 } from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'

interface ItineraryItemCardProps {
  item: ItineraryItemV2
  canEditPlanning: boolean
  isPending: boolean
  onEdit: (payload: ItemFormEditPayload) => Promise<void> | void
  dragHandle?: ReactNode
  onEditStateChange?: (isEditing: boolean) => void
  onSelect?: () => void
  isSelected?: boolean
  children?: ReactNode
}

export function ItineraryItemCard({
  item,
  canEditPlanning,
  isPending,
  onEdit,
  dragHandle,
  onEditStateChange,
  onSelect,
  isSelected = false,
  children,
}: ItineraryItemCardProps) {
  const [draftNotes, setDraftNotes] = useState(item.notes)
  const [notesSaveError, setNotesSaveError] = useState(false)
  const lastSubmittedNotesRef = useRef<string | null>(null)
  const lastFailedNotesRef = useRef<string | null>(null)

  useEffect(() => {
    onEditStateChange?.(Boolean(isSelected && canEditPlanning))
  }, [isSelected, canEditPlanning, onEditStateChange])

  useEffect(() => {
    setDraftNotes(item.notes)
    if (lastSubmittedNotesRef.current === item.notes) {
      lastSubmittedNotesRef.current = null
      lastFailedNotesRef.current = null
      setNotesSaveError(false)
    }
  }, [item.notes])

  useEffect(() => {
    if (!canEditPlanning || !isSelected) return
    if (isPending) return
    if (draftNotes === item.notes) return
    if (draftNotes === lastSubmittedNotesRef.current) return
    if (draftNotes === lastFailedNotesRef.current) return

    const timeout = window.setTimeout(async () => {
      lastSubmittedNotesRef.current = draftNotes
      try {
        await onEdit({ notes: draftNotes, dayNumber: item.dayNumber })
        lastFailedNotesRef.current = null
        setNotesSaveError(false)
      } catch {
        lastFailedNotesRef.current = draftNotes
        setNotesSaveError(true)
        if (lastSubmittedNotesRef.current === draftNotes) {
          lastSubmittedNotesRef.current = null
        }
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [canEditPlanning, draftNotes, isPending, isSelected, item.dayNumber, item.notes, onEdit])

  return (
    <Paper
      component="div"
      variant="outlined"
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
      sx={{
        p: { xs: 1.35, md: 1.5 },
        borderRadius: 2.5,
        bgcolor: 'rgba(255,255,255,0.96)',
        borderColor: isSelected ? 'rgba(21,112,239,0.38)' : 'rgba(15,23,42,0.08)',
        listStyle: 'none',
        minHeight: 88,
        cursor: onSelect ? 'pointer' : 'default',
        boxShadow: isSelected ? '0 0 0 2px rgba(21,112,239,0.10)' : 'none',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        {canEditPlanning && dragHandle ? (
          <Box sx={{ display: 'grid', placeItems: 'center', mt: 0.2, flexShrink: 0 }}>{dragHandle}</Box>
        ) : null}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: 'rgba(21,112,239,0.08)',
            color: 'primary.main',
            display: 'grid',
            placeItems: 'center',
            mt: 0.15,
            flexShrink: 0,
          }}
        >
          <PlaceRoundedIcon sx={{ fontSize: 18 }} />
        </Box>

        <Stack spacing={0.45} sx={{ minWidth: 0, flex: 1, pt: 0.15 }}>
          <Typography sx={{ fontWeight: 800, color: '#223046', lineHeight: 1.2, fontSize: { xs: 15, md: 16 } }}>
            {item.placeName}
          </Typography>
          {!isSelected && item.notes ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
              {item.notes}
            </Typography>
          ) : null}
          {item.dayNumber == null ? (
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 600 }}>
              Places To Visit backlog
            </Typography>
          ) : null}
        </Stack>

        {canEditPlanning ? (
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ flexShrink: 0, maxWidth: { xs: 190, sm: 420 } }}
          >
            {children}
          </Stack>
        ) : null}
      </Stack>

      {isSelected && canEditPlanning ? (
        <Box sx={{ mt: 1.1, pl: canEditPlanning && dragHandle ? 5.9 : 0 }} onClick={(event) => event.stopPropagation()}>
          <TextField
            fullWidth
            size="small"
            label="Notes"
            placeholder="Add notes here"
            value={draftNotes}
            onChange={(event) => {
              lastFailedNotesRef.current = null
              setNotesSaveError(false)
              setDraftNotes(event.target.value)
            }}
            disabled={isPending}
            helperText={isPending ? 'Saving...' : notesSaveError ? 'Failed to save. Retrying on next edit.' : ' '}
          />
        </Box>
      ) : null}
    </Paper>
  )
}
