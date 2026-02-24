import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import type { ItineraryItemV2 } from '../../../../api/itinerary'
import { ItemForm, type ItemFormEditPayload } from './ItemForm'

interface ItineraryItemCardProps {
  item: ItineraryItemV2
  canEditPlanning: boolean
  isPending: boolean
  tripStartDate: string
  tripEndDate: string
  onEdit: (payload: ItemFormEditPayload) => Promise<void> | void
  children?: ReactNode
}

export function ItineraryItemCard({
  item,
  canEditPlanning,
  isPending,
  tripStartDate,
  tripEndDate,
  onEdit,
  children,
}: ItineraryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <Paper
        component="li"
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: 'rgba(248,250,252,0.9)',
          listStyle: 'none',
        }}
      >
        <ItemForm
          mode="edit"
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          isPending={isPending}
          initialNotes={item.notes}
          initialDayNumber={item.dayNumber}
          onEdit={async (payload) => {
            try {
              await onEdit(payload)
              setIsEditing(false)
            } catch {
              // Keep the form open so users can retry after the parent shows the error.
            }
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Paper>
    )
  }

  return (
    <Paper
      component="li"
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2.25,
        bgcolor: 'rgba(255,255,255,0.96)',
        borderColor: 'rgba(15,23,42,0.08)',
        listStyle: 'none',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: 'rgba(21,112,239,0.08)',
            color: 'primary.main',
            display: 'grid',
            placeItems: 'center',
            mt: 0.15,
            flexShrink: 0,
          }}
        >
          <PlaceRoundedIcon sx={{ fontSize: 16 }} />
        </Box>

        <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, color: '#223046', lineHeight: 1.2 }}>
            {item.placeName}
          </Typography>
          {item.notes ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.25 }}>
              {item.notes}
            </Typography>
          ) : null}
          {item.dayNumber == null ? (
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 600 }}>
              Places To Visit backlog
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 600 }}>
              Scheduled for day {item.dayNumber}
            </Typography>
          )}
        </Stack>

        {canEditPlanning ? (
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            justifyContent="flex-end"
            sx={{ flexShrink: 0, maxWidth: { xs: 160, sm: 420 } }}
          >
            {children}
            <Box
              component="button"
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              sx={{
                px: 1.1,
                py: 0.55,
                borderRadius: 1.5,
                border: '1px solid rgba(15,23,42,0.12)',
                bgcolor: '#fff',
                color: '#344054',
                fontSize: 12,
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              Edit
            </Box>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}
