import type { ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import type { ItineraryV2Response, MoveItineraryItemV2Request } from '../../../../../api/itinerary'
import type { ItineraryContainerId } from './mappers'
import { resolveMoveCommandFromDrag } from './dragResolver'

interface DragContextProps {
  itinerary: ItineraryV2Response
  disabled: boolean
  onMove: (itemId: string, payload: MoveItineraryItemV2Request) => void
  onActiveDragItemChange?: (itemId: string | null) => void
  children: ReactNode
}

export function ItineraryDragContext({
  itinerary,
  disabled,
  onMove,
  onActiveDragItemChange,
  children,
}: DragContextProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor)
  )
  const activeItem = useMemo(() => {
    if (!activeItemId) return null
    const dayItem = itinerary.days.flatMap((day) => day.items).find((item) => item.id === activeItemId)
    if (dayItem) return dayItem
    return itinerary.placesToVisit.items.find((item) => item.id === activeItemId) ?? null
  }, [activeItemId, itinerary])

  function readOverData(
    over: DragEndEvent['over']
  ): { overType: string | undefined; overContainerId: ItineraryContainerId | undefined } {
    const data = over?.data.current
    const overType = typeof data?.type === 'string' ? data.type : undefined
    const rawContainerId = data?.containerId
    const overContainerId =
      typeof rawContainerId === 'string' ? (rawContainerId as ItineraryContainerId) : undefined
    return { overType, overContainerId }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItemId(null)
    onActiveDragItemChange?.(null)
    if (disabled) return
    if (!event.over) return

    if (typeof event.active.id !== 'string' && typeof event.active.id !== 'number') return
    if (typeof event.over.id !== 'string' && typeof event.over.id !== 'number') return

    const activeItemId = String(event.active.id)
    const overId = String(event.over.id)
    const { overType, overContainerId } = readOverData(event.over)

    const command = resolveMoveCommandFromDrag({
      itinerary,
      activeItemId,
      overId,
      overType,
      overContainerId,
    })
    if (!command) return

    onMove(command.itemId, command.payload)
  }

  function handleDragStart(event: DragStartEvent) {
    if (typeof event.active.id === 'string' || typeof event.active.id === 'number') {
      const nextActiveId = String(event.active.id)
      setActiveItemId(nextActiveId)
      onActiveDragItemChange?.(nextActiveId)
    }
  }

  function handleDragCancel(_event: DragCancelEvent) {
    void _event
    setActiveItemId(null)
    onActiveDragItemChange?.(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <Paper
            elevation={8}
            sx={{
              width: { xs: 280, md: 420 },
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid rgba(21,112,239,0.18)',
              bgcolor: 'rgba(255,255,255,0.98)',
              boxShadow: '0 24px 48px rgba(15,23,42,0.18)',
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.75,
                  bgcolor: 'rgba(21,112,239,0.10)',
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <PlaceRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, color: '#223046', lineHeight: 1.2 }}>
                  {activeItem.placeName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#667085', fontWeight: 700 }}>
                  {activeItem.dayNumber == null ? 'Dragging from backlog' : `Dragging from day ${activeItem.dayNumber}`}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
