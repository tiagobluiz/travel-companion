import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import type {
  ItineraryV2Response,
  MoveItineraryItemV2Request,
  ItineraryItemV2,
} from '../../../../api/itinerary'
import type { Trip } from '../../../../api/trips'
import { ItineraryBoard } from '../itinerary/ItineraryBoard'
import { ItemForm, type ItemFormCreatePayload, type ItemFormEditPayload } from '../itinerary/ItemForm'

export interface ItineraryQuickAddTarget {
  destinationType: 'DAY' | 'PLACES'
  dayNumber?: number | null
}

interface ItinerarySectionProps {
  trip: Trip
  itinerary: ItineraryV2Response
  isItineraryLoading: boolean
  canEditPlanning: boolean
  showItineraryForm: boolean
  itineraryLoadError: unknown
  itineraryError: string
  isAddPending: boolean
  isMovePending: boolean
  isEditPending: boolean
  onShowForm: () => void
  onRequestQuickAdd: (target: ItineraryQuickAddTarget) => void
  onHideForm: () => void
  createFormPrefill?: ItineraryQuickAddTarget
  onAddItinerary: (payload: ItemFormCreatePayload) => Promise<void> | void
  onEditItinerary: (item: ItineraryItemV2, payload: ItemFormEditPayload) => Promise<void> | void
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onRemove: (itemId: string) => void
}

export function ItinerarySection({
  trip,
  itinerary,
  isItineraryLoading,
  canEditPlanning,
  showItineraryForm,
  itineraryLoadError,
  itineraryError,
  isAddPending,
  isMovePending,
  isEditPending,
  onShowForm,
  onRequestQuickAdd,
  onHideForm,
  createFormPrefill,
  onAddItinerary,
  onEditItinerary,
  onMove,
  onRemove,
}: ItinerarySectionProps) {
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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
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
                  <RouteRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#223046' }}>
                  Itinerary
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Plan by day and keep unscheduled ideas in Places To Visit. Drag items or use move actions for mobile-safe reordering.
              </Typography>
            </Stack>

            {canEditPlanning ? (
              <Button
                onClick={showItineraryForm ? onHideForm : onShowForm}
                variant={showItineraryForm ? 'outlined' : 'contained'}
                startIcon={<AddRoundedIcon />}
              >
                {showItineraryForm ? 'Close form' : '+ Add place'}
              </Button>
            ) : null}
          </Stack>

          {itineraryError ? (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {itineraryError}
            </Alert>
          ) : null}

          {!canEditPlanning ? (
            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              Read-only itinerary view. Only editors and owners can plan items.
            </Alert>
          ) : null}

          {canEditPlanning && showItineraryForm ? (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.5, md: 1.75 },
                borderRadius: 2.5,
                borderColor: 'rgba(15,23,42,0.08)',
                bgcolor: 'rgba(248,250,252,0.75)',
              }}
            >
              <ItemForm
                mode="create"
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
                isPending={isAddPending}
                errorMessage={itineraryError}
                initialDestinationType={createFormPrefill?.destinationType}
                initialDayNumber={createFormPrefill?.destinationType === 'DAY' ? createFormPrefill.dayNumber : null}
                onCreate={onAddItinerary}
                onCancel={onHideForm}
              />
            </Paper>
          ) : null}

          <ItineraryBoard
            itinerary={itinerary}
            isLoading={isItineraryLoading}
            loadError={itineraryLoadError}
            canEditPlanning={canEditPlanning}
            isAddPending={isAddPending}
            isMovePending={isMovePending}
            isEditPending={isEditPending}
            itineraryError={itineraryError}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            onAdd={onAddItinerary}
            onMove={onMove}
            onRequestQuickAdd={canEditPlanning ? onRequestQuickAdd : undefined}
            onEdit={(itemId, payload) => {
              const item =
                itinerary.days.flatMap((day) => day.items).find((dayItem) => dayItem.id === itemId) ??
                itinerary.placesToVisit.items.find((placeItem) => placeItem.id === itemId)
              if (!item) return Promise.resolve()
              return onEditItinerary(item, payload)
            }}
            onRemove={onRemove}
          />
        </Stack>
      </Paper>
    </Box>
  )
}
