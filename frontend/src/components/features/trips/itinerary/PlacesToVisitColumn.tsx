import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Box, Divider, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { MoveItineraryItemV2Request, PlacesToVisitContainer } from '../../../../api/itinerary'
import type { ItemFormEditPayload } from './ItemForm'
import { ItineraryItemCard } from './ItineraryItemCard'
import { SortableItineraryItem } from './dnd/SortableItineraryItem'
import type { ItineraryContainerId } from './dnd/mappers'

interface PlacesToVisitColumnProps {
  containerId: ItineraryContainerId
  placesToVisit: PlacesToVisitContainer
  firstDayNumber?: number
  canEditPlanning: boolean
  isMovePending: boolean
  isEditPending: boolean
  tripStartDate: string
  tripEndDate: string
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onEdit: (itemId: string, payload: ItemFormEditPayload) => Promise<void> | void
  onRemove: (itemId: string) => void
}

function buttonSx(kind: 'neutral' | 'danger' | 'drag' = 'neutral') {
  if (kind === 'danger') {
    return { borderColor: 'rgba(240,68,56,0.20)', color: '#b42318', bgcolor: 'rgba(240,68,56,0.03)' }
  }
  if (kind === 'drag') {
    return { borderColor: 'rgba(21,112,239,0.22)', color: '#2459b8', bgcolor: 'rgba(21,112,239,0.04)' }
  }
  return { borderColor: 'rgba(15,23,42,0.10)', color: '#344054', bgcolor: '#fff' }
}

export function PlacesToVisitColumn({
  containerId,
  placesToVisit,
  firstDayNumber,
  canEditPlanning,
  isMovePending,
  isEditPending,
  tripStartDate,
  tripEndDate,
  onMove,
  onEdit,
  onRemove,
}: PlacesToVisitColumnProps) {
  const { setNodeRef } = useDroppable({
    id: containerId,
    data: {
      type: 'container',
      containerId,
    },
  })
  const [menuAnchorByItem, setMenuAnchorByItem] = useState<Record<string, HTMLElement | null>>({})
  const isBusy = isMovePending || isEditPending

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.96)',
        borderColor: 'rgba(15,23,42,0.08)',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Stack spacing={0.15}>
            <Typography sx={{ fontWeight: 800, color: '#223046' }}>{placesToVisit.label}</Typography>
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 600 }}>
              {placesToVisit.items.length} unscheduled {placesToVisit.items.length === 1 ? 'item' : 'items'}
            </Typography>
          </Stack>
          {canEditPlanning ? (
            <Typography variant="caption" sx={{ color: '#2459b8', fontWeight: 700 }}>
              + Add item
            </Typography>
          ) : null}
        </Stack>
        <Divider sx={{ borderColor: 'rgba(15,23,42,0.05)' }} />

        {placesToVisit.items.length === 0 ? (
          <Box
            ref={setNodeRef}
            sx={{
              minHeight: 62,
              borderRadius: 2,
              border: '1px dashed rgba(148,163,184,0.6)',
              bgcolor: 'rgba(248,250,252,0.8)',
              px: 1.25,
              py: 1.1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No places waiting to be scheduled.
            </Typography>
          </Box>
        ) : (
          <SortableContext items={placesToVisit.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <Stack ref={setNodeRef} component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {placesToVisit.items.map((item, itemIndex) => (
                <SortableItineraryItem key={item.id} itemId={item.id} containerId={containerId}>
                  {({ dragAttributes, dragListeners, isDragging }) => (
                    <Box sx={isDragging ? { borderRadius: 2.25, boxShadow: '0 0 0 2px rgba(21,112,239,0.18)' } : undefined}>
                      <ItineraryItemCard
                        item={item}
                        canEditPlanning={canEditPlanning}
                        isPending={isBusy}
                        tripStartDate={tripStartDate}
                        tripEndDate={tripEndDate}
                        onEdit={(payload) => onEdit(item.id, payload)}
                      >
                        <Box
                          component="button"
                          type="button"
                          {...dragAttributes}
                          {...dragListeners}
                          aria-label={`Drag ${item.placeName}`}
                          disabled={isBusy}
                          sx={{
                            px: 1.1,
                            py: 0.55,
                            borderRadius: 1.5,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'grab',
                            opacity: isBusy ? 0.5 : 1,
                            ...buttonSx('drag'),
                          }}
                        >
                          Drag
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => {
                            if (isBusy) return
                            onMove(item.id, { beforeItemId: placesToVisit.items[itemIndex - 1]?.id })
                          }}
                          disabled={itemIndex === 0 || isBusy}
                          aria-disabled={itemIndex === 0 || isBusy}
                          sx={{
                            px: 1.1,
                            py: 0.55,
                            borderRadius: 1.5,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: itemIndex === 0 || isBusy ? 'not-allowed' : 'pointer',
                            opacity: itemIndex === 0 || isBusy ? 0.45 : 1,
                            ...buttonSx(),
                          }}
                        >
                          Move up
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => {
                            if (isBusy) return
                            onMove(item.id, { afterItemId: placesToVisit.items[itemIndex + 1]?.id })
                          }}
                          disabled={itemIndex === placesToVisit.items.length - 1 || isBusy}
                          aria-disabled={itemIndex === placesToVisit.items.length - 1 || isBusy}
                          sx={{
                            px: 1.1,
                            py: 0.55,
                            borderRadius: 1.5,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              itemIndex === placesToVisit.items.length - 1 || isBusy ? 'not-allowed' : 'pointer',
                            opacity: itemIndex === placesToVisit.items.length - 1 || isBusy ? 0.45 : 1,
                            ...buttonSx(),
                          }}
                        >
                          Move down
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => {
                            if (isBusy) return
                            onMove(item.id, { targetDayNumber: firstDayNumber })
                          }}
                          disabled={!firstDayNumber || isBusy}
                          aria-disabled={!firstDayNumber || isBusy}
                          sx={{
                            px: 1.1,
                            py: 0.55,
                            borderRadius: 1.5,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: !firstDayNumber || isBusy ? 'not-allowed' : 'pointer',
                            opacity: !firstDayNumber || isBusy ? 0.45 : 1,
                            ...buttonSx(),
                          }}
                        >
                          {firstDayNumber ? `To day ${firstDayNumber}` : 'To first day'}
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => onRemove(item.id)}
                          disabled={isBusy}
                          aria-disabled={isBusy}
                          sx={{
                            px: 1.1,
                            py: 0.55,
                            borderRadius: 1.5,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            opacity: isBusy ? 0.5 : 1,
                            ...buttonSx('danger'),
                          }}
                        >
                          Remove
                        </Box>
                        <IconButton
                          size="small"
                          aria-label={`More actions for ${item.placeName}`}
                          onClick={(event) =>
                            setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: event.currentTarget }))
                          }
                          disabled={isBusy}
                          sx={{
                            border: '1px solid rgba(15,23,42,0.10)',
                            borderRadius: 1.5,
                            width: 30,
                            height: 30,
                            bgcolor: '#fff',
                          }}
                        >
                          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Menu
                          anchorEl={menuAnchorByItem[item.id] ?? null}
                          open={Boolean(menuAnchorByItem[item.id])}
                          onClose={() => setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: null }))}
                        >
                          <MenuItem
                            onClick={() => {
                              setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: null }))
                              if (!isBusy && itemIndex > 0) {
                                onMove(item.id, { beforeItemId: placesToVisit.items[itemIndex - 1]?.id })
                              }
                            }}
                            disabled={itemIndex === 0 || isBusy}
                          >
                            Move up
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: null }))
                              if (!isBusy && itemIndex < placesToVisit.items.length - 1) {
                                onMove(item.id, { afterItemId: placesToVisit.items[itemIndex + 1]?.id })
                              }
                            }}
                            disabled={itemIndex === placesToVisit.items.length - 1 || isBusy}
                          >
                            Move down
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: null }))
                              if (!isBusy) onMove(item.id, { targetDayNumber: firstDayNumber })
                            }}
                            disabled={!firstDayNumber || isBusy}
                          >
                            {firstDayNumber ? `Move to day ${firstDayNumber}` : 'Move to first day'}
                          </MenuItem>
                          <Divider />
                          <MenuItem
                            onClick={() => {
                              setMenuAnchorByItem((prev) => ({ ...prev, [item.id]: null }))
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
              ))}
            </Stack>
          </SortableContext>
        )}
      </Stack>
    </Paper>
  )
}
