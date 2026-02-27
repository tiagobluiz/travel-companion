import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Box, Button, Divider, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { DayContainer, MoveItineraryItemV2Request } from '../../../../api/itinerary'
import type { ItineraryQuickAddTarget } from '../detail/ItinerarySection'
import { ItemForm, type ItemFormCreatePayload, type ItemFormEditPayload } from './ItemForm'
import { ItineraryItemCard } from './ItineraryItemCard'
import { SortableItineraryItem } from './dnd/SortableItineraryItem'
import type { ItineraryContainerId } from './dnd/mappers'

interface DayColumnProps {
  containerId: ItineraryContainerId
  day: DayContainer
  dayIndex: number
  totalDays: number
  availableDayNumbers: number[]
  previousDayNumber?: number
  nextDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  isAddPending?: boolean
  addErrorMessage?: string
  tripStartDate: string
  tripEndDate: string
  onAdd?: (payload: ItemFormCreatePayload) => Promise<void> | void
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => Promise<void> | void
  onRemove: (itemId: string) => void
  onEditStateChange?: (itemId: string, isEditing: boolean) => void
  selectedItemId?: string | null
  onSelectItem?: (itemId: string) => void
  onSelectDay?: (dayNumber: number) => void
  onRequestQuickAdd?: (target: ItineraryQuickAddTarget) => void
}

const srOnlySx = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

function HoverInsertButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Box
      sx={{
        position: 'relative',
        height: 14,
        my: -0.15,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 8,
          right: 8,
          top: '50%',
          borderTop: '1px dashed rgba(148,163,184,0.45)',
          transform: 'translateY(-50%)',
          opacity: 0,
          transition: 'opacity 140ms ease',
        },
        '& .insert-cta': {
          opacity: 0,
          pointerEvents: 'none',
          transform: 'translateY(2px)',
          transition: 'opacity 140ms ease, transform 140ms ease',
        },
        '&:hover::before, &:focus-within::before': { opacity: 1 },
        '&:hover .insert-cta, &:focus-within .insert-cta': {
          opacity: 1,
          pointerEvents: 'auto',
          transform: 'translateY(0)',
        },
      }}
    >
      <Button
        className="insert-cta"
        type="button"
        onClick={onClick}
        size="small"
        startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
        variant="contained"
        aria-label={label}
        sx={{
          position: 'absolute',
          top: '50%',
          left: 8,
          transform: 'translateY(-50%)',
          minHeight: 26,
          px: 1,
          py: 0.25,
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 11,
          boxShadow: '0 6px 14px rgba(15,23,42,0.12)',
          textTransform: 'none',
        }}
      >
        Add
      </Button>
    </Box>
  )
}

function IconHandleButton({
  dragAttributes,
  dragListeners,
  disabled,
  placeName,
}: {
  dragAttributes: Record<string, unknown>
  dragListeners: Record<string, unknown> | undefined
  disabled: boolean
  placeName: string
}) {
  return (
    <IconButton
      {...dragAttributes}
      {...dragListeners}
      size="small"
      aria-label={`Drag ${placeName}`}
      disabled={disabled}
      sx={{
        border: 'none',
        borderRadius: 1.75,
        width: 28,
        height: 28,
        color: '#2459b8',
        bgcolor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'grab',
        '&:hover': { bgcolor: 'transparent' },
      }}
    >
      <DragIndicatorRoundedIcon sx={{ fontSize: 18 }} />
    </IconButton>
  )
}

export function DayColumn({
  containerId,
  day,
  dayIndex,
  totalDays,
  availableDayNumbers,
  previousDayNumber,
  nextDayNumber,
  canEditPlanning,
  isMovePending,
  isEditPending,
  isAddPending = false,
  addErrorMessage,
  tripStartDate,
  tripEndDate,
  onAdd,
  onMove,
  onEdit,
  onRemove,
  onEditStateChange,
  selectedItemId,
  onSelectItem,
  onSelectDay,
  onRequestQuickAdd,
}: DayColumnProps) {
  void dayIndex
  void totalDays
  void previousDayNumber
  void nextDayNumber
  const { setNodeRef } = useDroppable({
    id: containerId,
    data: { type: 'container', containerId },
  })
  const [menuAnchorByItem, setMenuAnchorByItem] = useState<Record<string, HTMLElement | null>>({})
  const [showInlineCreate, setShowInlineCreate] = useState(false)
  const isBusy = isMovePending || isEditPending

  function closeMenu(itemId: string) {
    setMenuAnchorByItem((prev) => ({ ...prev, [itemId]: null }))
  }

  function requestQuickAdd() {
    if (onAdd) {
      setShowInlineCreate(true)
      return
    }
    onRequestQuickAdd?.({ destinationType: 'DAY', dayNumber: day.dayNumber })
  }

  async function handleInlineCreate(payload: ItemFormCreatePayload) {
    try {
      await onAdd?.(payload)
      setShowInlineCreate(false)
    } catch {
      // Parent error state is surfaced via addErrorMessage.
    }
  }

  return (
    <Paper
      variant="outlined"
      onClick={() => onSelectDay?.(day.dayNumber)}
      sx={{
        p: { xs: 1.5, md: 1.75 },
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.98)',
        borderColor: 'rgba(15,23,42,0.08)',
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.2}>
            <Typography sx={{ fontWeight: 800, color: '#223046', fontSize: { xs: 17, md: 18 } }}>
              Day {day.dayNumber} ({day.date})
            </Typography>
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 700 }}>
              {day.items.length} {day.items.length === 1 ? 'activity' : 'activities'}
            </Typography>
          </Stack>
          {canEditPlanning ? (
            <Button onClick={requestQuickAdd} variant="text" size="small" startIcon={<AddRoundedIcon />} sx={{ fontWeight: 700 }}>
              Add activity
            </Button>
          ) : null}
        </Stack>

        <Divider sx={{ borderColor: 'rgba(15,23,42,0.05)' }} />

        {showInlineCreate ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.2,
              borderRadius: 2.25,
              borderColor: 'rgba(15,23,42,0.08)',
              bgcolor: 'rgba(248,250,252,0.78)',
            }}
          >
            <ItemForm
              mode="create"
              compact
              hideNotesField
              submitLabel="Add activity"
              lockedDestination={{ destinationType: 'DAY', dayNumber: day.dayNumber }}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              isPending={isAddPending}
              errorMessage={addErrorMessage}
              onCreate={handleInlineCreate}
              onCancel={() => setShowInlineCreate(false)}
            />
          </Paper>
        ) : null}

        {day.items.length === 0 ? (
          <Box
            ref={setNodeRef}
            sx={{
              minHeight: 84,
              borderRadius: 2,
              border: '1px dashed rgba(148,163,184,0.6)',
              bgcolor: 'rgba(248,250,252,0.8)',
              px: 1.25,
              py: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No items in this day.
            </Typography>
            {canEditPlanning ? (
              <Button size="small" variant="outlined" onClick={requestQuickAdd} startIcon={<AddRoundedIcon />}>
                Add
              </Button>
            ) : null}
          </Box>
        ) : (
          <SortableContext items={day.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <Stack ref={setNodeRef} component="ul" spacing={0.4} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {day.items.map((item, itemIndex) => (
                <Box key={item.id} component="li" sx={{ listStyle: 'none' }}>
                  {canEditPlanning && itemIndex > 0 ? (
                    <HoverInsertButton label={`Add activity between items in day ${day.dayNumber}`} onClick={requestQuickAdd} />
                  ) : null}
                  <SortableItineraryItem itemId={item.id} containerId={containerId}>
                    {({ dragAttributes, dragListeners, isDragging }) => (
                      <Box
                        sx={{
                          borderRadius: 2.5,
                          transition: 'transform 120ms ease, box-shadow 120ms ease',
                          ...(isDragging
                            ? {
                                boxShadow: '0 0 0 2px rgba(21,112,239,0.18)',
                                opacity: 0.7,
                              }
                            : {}),
                        }}
                      >
                        <ItineraryItemCard
                          item={item}
                          canEditPlanning={canEditPlanning}
                          isPending={isBusy}
                          onEdit={(payload) => onEdit(item.id, payload)}
                          onEditStateChange={(isEditing) => onEditStateChange?.(item.id, isEditing)}
                          onSelect={() => onSelectItem?.(item.id)}
                          isSelected={selectedItemId === item.id}
                          dragHandle={
                            <IconHandleButton
                              dragAttributes={dragAttributes as Record<string, unknown>}
                              dragListeners={dragListeners as Record<string, unknown> | undefined}
                              disabled={isBusy}
                              placeName={item.placeName}
                            />
                          }
                        >
                          <IconButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: event.currentTarget as HTMLElement }))
                            }}
                            disabled={isBusy}
                            size="small"
                            aria-label={`More actions for ${item.placeName}`}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.75,
                              border: '1px solid rgba(15,23,42,0.12)',
                              bgcolor: '#fff',
                            }}
                          >
                            <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>

                          <IconButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onRemove(item.id)
                            }}
                            disabled={isBusy}
                            aria-label={`Delete ${item.placeName}`}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.75,
                              border: '1px solid rgba(240,68,56,0.20)',
                              color: '#b42318',
                              bgcolor: 'rgba(240,68,56,0.03)',
                            }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>

                          <Box
                            component="button"
                            type="button"
                            onClick={() => {
                              if (isBusy) return
                              onMove(item.id, {
                                targetDayNumber: day.dayNumber,
                                beforeItemId: day.items[itemIndex - 1]?.id,
                              })
                            }}
                            disabled={itemIndex === 0 || isBusy}
                            aria-disabled={itemIndex === 0 || isBusy}
                            sx={srOnlySx}
                          >
                            Move up
                          </Box>
                          <Box
                            component="button"
                            type="button"
                            onClick={() => {
                              if (isBusy) return
                              onMove(item.id, {
                                targetDayNumber: day.dayNumber,
                                afterItemId: day.items[itemIndex + 1]?.id,
                              })
                            }}
                            disabled={itemIndex === day.items.length - 1 || isBusy}
                            aria-disabled={itemIndex === day.items.length - 1 || isBusy}
                            sx={srOnlySx}
                          >
                            Move down
                          </Box>
                          <Box
                            component="button"
                            type="button"
                            onClick={() => {
                              if (isBusy) return
                              onRemove(item.id)
                            }}
                            disabled={isBusy}
                            aria-disabled={isBusy}
                            sx={srOnlySx}
                          >
                            Remove
                          </Box>

                          <Menu
                            anchorEl={menuAnchorByItem[item.id] ?? null}
                            open={Boolean(menuAnchorByItem[item.id])}
                            onClose={() => closeMenu(item.id)}
                          >
                            <MenuItem
                              onClick={() => {
                                closeMenu(item.id)
                                onEdit(item.id, { notes: item.notes, dayNumber: item.dayNumber })
                              }}
                              disabled
                            >
                              Edit from card
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                closeMenu(item.id)
                                if (itemIndex > 0 && !isBusy) {
                                  onMove(item.id, {
                                    targetDayNumber: day.dayNumber,
                                    beforeItemId: day.items[itemIndex - 1]?.id,
                                  })
                                }
                              }}
                              disabled={itemIndex === 0 || isBusy}
                            >
                              Move up
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                closeMenu(item.id)
                                if (itemIndex < day.items.length - 1 && !isBusy) {
                                  onMove(item.id, {
                                    targetDayNumber: day.dayNumber,
                                    afterItemId: day.items[itemIndex + 1]?.id,
                                  })
                                }
                              }}
                              disabled={itemIndex === day.items.length - 1 || isBusy}
                            >
                              Move down
                            </MenuItem>
                            {availableDayNumbers
                              .filter((candidateDayNumber) => candidateDayNumber !== day.dayNumber)
                              .map((candidateDayNumber) => (
                                <MenuItem
                                  key={`move-to-day-${candidateDayNumber}`}
                                  onClick={() => {
                                    closeMenu(item.id)
                                    if (!isBusy) onMove(item.id, { targetDayNumber: candidateDayNumber })
                                  }}
                                  disabled={isBusy}
                                >
                                  Move to day {candidateDayNumber}
                                </MenuItem>
                              ))}
                            <MenuItem
                              onClick={() => {
                                closeMenu(item.id)
                                if (!isBusy) onMove(item.id, {})
                              }}
                              disabled={isBusy}
                            >
                              Move to Places To Visit
                            </MenuItem>
                            <Divider />
                            <MenuItem
                              onClick={() => {
                                closeMenu(item.id)
                                onRemove(item.id)
                              }}
                              disabled={isBusy}
                              sx={{ color: '#b42318' }}
                            >
                              Delete
                            </MenuItem>
                          </Menu>
                        </ItineraryItemCard>
                      </Box>
                    )}
                  </SortableItineraryItem>
                  {canEditPlanning && itemIndex === day.items.length - 1 ? (
                    <HoverInsertButton label={`Add activity after last item in day ${day.dayNumber}`} onClick={requestQuickAdd} />
                  ) : null}
                </Box>
              ))}
            </Stack>
          </SortableContext>
        )}
      </Stack>
    </Paper>
  )
}
