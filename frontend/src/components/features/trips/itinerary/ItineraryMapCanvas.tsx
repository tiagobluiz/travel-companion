import { Box, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ItineraryV2Response } from '../../../../api/itinerary'

interface ItineraryMapCanvasProps {
  itinerary: ItineraryV2Response
  mode: 'MAP' | 'SATELLITE'
  highlightedItemId?: string | null
  focusedDayNumber?: number | null
}

type MapPoint = {
  id: string
  label: string
  dayNumber: number | null
  latitude: number
  longitude: number
}

type MapLibreModule = typeof import('maplibre-gl')

function buildStyle(mode: 'MAP' | 'SATELLITE') {
  if (mode === 'SATELLITE') {
    return {
      version: 8,
      sources: {
        esri: {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles © Esri',
        },
      },
      layers: [{ id: 'esri-imagery', type: 'raster', source: 'esri' }],
    } as const
  }

  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm-raster', type: 'raster', source: 'osm' }],
  } as const
}

function markerColor(point: MapPoint) {
  return point.dayNumber == null ? '#f59e0b' : '#1570ef'
}

export function ItineraryMapCanvas({
  itinerary,
  mode,
  highlightedItemId = null,
  focusedDayNumber = null,
}: ItineraryMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const maplibreRef = useRef<MapLibreModule | null>(null)
  const mapInstanceRef = useRef<{
    remove: () => void
    fitBounds: (...args: unknown[]) => void
    flyTo: (options: unknown) => void
    once: (event: string, cb: () => void) => void
    addSource: (id: string, source: unknown) => void
    addLayer: (layer: unknown) => void
    getSource: (id: string) => { setData?: (data: unknown) => void } | undefined
    getLayer?: (id: string) => unknown
    removeLayer?: (id: string) => void
    removeSource?: (id: string) => void
    resize: () => void
    loaded: () => boolean
  } | null>(null)
  const markersRef = useRef<Array<{ remove: () => void }>>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const pointsRef = useRef<MapPoint[]>([])
  const routeCoordinatesRef = useRef<Array<[number, number]>>([])
  const highlightedItemIdRef = useRef<string | null>(null)
  const focusedDayNumberRef = useRef<number | null>(null)

  const points = useMemo<MapPoint[]>(() => {
    const scheduled = itinerary.days.flatMap((day) =>
      day.items.map((item) => ({
        id: item.id,
        label: item.placeName,
        dayNumber: day.dayNumber,
        latitude: item.latitude,
        longitude: item.longitude,
      }))
    )
    const backlog = itinerary.placesToVisit.items.map((item) => ({
      id: item.id,
      label: item.placeName,
      dayNumber: null,
      latitude: item.latitude,
      longitude: item.longitude,
    }))
    return [...scheduled, ...backlog].filter(
      (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    )
  }, [itinerary])

  const routeCoordinates = useMemo(
    () =>
      itinerary.days.flatMap((day) =>
        day.items
          .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
          .map((item) => [item.longitude, item.latitude] as [number, number])
      ),
    [itinerary]
  )

  const syncMapOverlays = useCallback(() => {
    const map = mapInstanceRef.current
    const maplibre = maplibreRef.current
    if (!map || !maplibre || !map.loaded()) return

    const currentPoints = pointsRef.current
    const currentRouteCoordinates = routeCoordinatesRef.current
    const currentHighlightedItemId = highlightedItemIdRef.current
    const currentFocusedDayNumber = focusedDayNumberRef.current

    markersRef.current.forEach((marker) => {
      marker.remove()
    })
    markersRef.current = currentPoints.map((point) => {
      const isHighlighted = point.id === currentHighlightedItemId
      const markerLabel =
        point.dayNumber == null ? `${point.label} (Backlog)` : `${point.label} (Day ${point.dayNumber})`

      const wrapper = document.createElement('div')
      wrapper.style.display = 'flex'
      wrapper.style.flexDirection = 'column'
      wrapper.style.alignItems = 'center'
      wrapper.style.gap = '3px'

      const el = document.createElement('button')
      el.type = 'button'
      el.title = markerLabel
      el.setAttribute('aria-label', markerLabel)
      el.style.width = isHighlighted ? '28px' : '24px'
      el.style.height = isHighlighted ? '36px' : '32px'
      el.style.border = 'none'
      el.style.background = 'transparent'
      el.style.boxShadow = 'none'
      el.style.cursor = 'pointer'
      el.style.padding = '0'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'flex-start'

      const pinColor = markerColor(point)
      const pinHead = document.createElement('div')
      pinHead.style.width = isHighlighted ? '20px' : '16px'
      pinHead.style.height = isHighlighted ? '20px' : '16px'
      pinHead.style.borderRadius = '999px'
      pinHead.style.background = pinColor
      pinHead.style.border = '2px solid white'
      pinHead.style.boxShadow = isHighlighted
        ? '0 0 0 3px rgba(21,112,239,0.20), 0 10px 20px rgba(15,23,42,0.26)'
        : '0 4px 12px rgba(15,23,42,0.22)'
      pinHead.style.display = 'grid'
      pinHead.style.placeItems = 'center'

      const pinCore = document.createElement('div')
      pinCore.style.width = isHighlighted ? '5px' : '4px'
      pinCore.style.height = isHighlighted ? '5px' : '4px'
      pinCore.style.borderRadius = '999px'
      pinCore.style.background = 'rgba(255,255,255,0.95)'
      pinHead.appendChild(pinCore)

      const pinTail = document.createElement('div')
      pinTail.style.width = isHighlighted ? '10px' : '8px'
      pinTail.style.height = isHighlighted ? '10px' : '8px'
      pinTail.style.background = pinColor
      pinTail.style.borderRight = '2px solid white'
      pinTail.style.borderBottom = '2px solid white'
      pinTail.style.transform = 'rotate(45deg)'
      pinTail.style.marginTop = '-3px'
      pinTail.style.boxShadow = isHighlighted
        ? '0 7px 16px rgba(15,23,42,0.16)'
        : '0 4px 10px rgba(15,23,42,0.14)'

      const label = document.createElement('div')
      label.textContent = point.label
      label.style.display = isHighlighted ? 'block' : 'none'
      label.style.maxWidth = '150px'
      label.style.whiteSpace = 'nowrap'
      label.style.overflow = 'hidden'
      label.style.textOverflow = 'ellipsis'
      label.style.fontSize = '11px'
      label.style.fontWeight = '700'
      label.style.lineHeight = '1'
      label.style.padding = '4px 8px'
      label.style.borderRadius = '999px'
      label.style.background = 'rgba(255,255,255,0.94)'
      label.style.border = '1px solid rgba(15,23,42,0.08)'
      label.style.boxShadow = '0 4px 14px rgba(15,23,42,0.10)'

      el.appendChild(pinHead)
      el.appendChild(pinTail)

      wrapper.appendChild(label)
      wrapper.appendChild(el)

      const popupContent = document.createElement('div')
      popupContent.style.minWidth = '140px'
      const popupTitle = document.createElement('div')
      popupTitle.style.fontWeight = '800'
      popupTitle.style.color = '#223046'
      popupTitle.textContent = point.label
      const popupMeta = document.createElement('div')
      popupMeta.style.fontSize = '12px'
      popupMeta.style.color = '#667085'
      popupMeta.style.marginTop = '2px'
      popupMeta.textContent = point.dayNumber == null ? 'Backlog' : `Day ${point.dayNumber}`
      popupContent.appendChild(popupTitle)
      popupContent.appendChild(popupMeta)
      const popup = new maplibre.Popup({ offset: 18, closeButton: false, closeOnClick: false }).setDOMContent(
        popupContent
      )

      const marker = new maplibre.Marker({ element: wrapper, anchor: 'bottom' })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map as unknown as Parameters<InstanceType<MapLibreModule['Marker']>['addTo']>[0])

      el.addEventListener('mouseenter', () => {
        label.style.display = 'block'
        popup.setLngLat([point.longitude, point.latitude]).addTo(map as never)
      })
      el.addEventListener('mouseleave', () => {
        if (!isHighlighted) label.style.display = 'none'
        popup.remove()
      })
      el.addEventListener('click', () => {
        popup.setLngLat([point.longitude, point.latitude]).addTo(map as never)
      })

      if (isHighlighted) {
        popup.setLngLat([point.longitude, point.latitude]).addTo(map as never)
      }
      return marker
    })

    const routeSourceId = 'itinerary-route'
    const routeLayerId = 'itinerary-route-line'
    if (currentRouteCoordinates.length >= 2) {
      const routeGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: currentRouteCoordinates,
            },
          },
        ],
      }

      const existingSource = map.getSource(routeSourceId)
      if (existingSource?.setData) {
        existingSource.setData(routeGeoJson)
      } else {
        map.addSource(routeSourceId, {
          type: 'geojson',
          data: routeGeoJson,
        })
        map.addLayer({
          id: routeLayerId,
          type: 'line',
          source: routeSourceId,
          paint: {
            'line-color': '#2f6fe4',
            'line-width': 3,
            'line-opacity': 0.78,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        })
      }
    } else if (map.getLayer?.(routeLayerId)) {
      map.removeLayer?.(routeLayerId)
      map.removeSource?.(routeSourceId)
    }

    const fitPointsToBounds = (targetPoints: MapPoint[], maxZoom = 14) => {
      if (targetPoints.length === 0) return false
      if (targetPoints.length === 1) {
        map.fitBounds(
          [
            [targetPoints[0].longitude - 0.03, targetPoints[0].latitude - 0.03],
            [targetPoints[0].longitude + 0.03, targetPoints[0].latitude + 0.03],
          ],
          { padding: 48, duration: 0 }
        )
        return true
      }

      const bounds = new maplibre.LngLatBounds(
        [targetPoints[0].longitude, targetPoints[0].latitude],
        [targetPoints[0].longitude, targetPoints[0].latitude]
      )
      targetPoints.slice(1).forEach((point) => {
        bounds.extend([point.longitude, point.latitude])
      })
      map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom })
      return true
    }

    if (currentPoints.length === 1) {
      map.fitBounds(
        [
          [currentPoints[0].longitude - 0.03, currentPoints[0].latitude - 0.03],
          [currentPoints[0].longitude + 0.03, currentPoints[0].latitude + 0.03],
        ],
        { padding: 48, duration: 0 }
      )
    } else if (currentPoints.length > 1) {
      const bounds = new maplibre.LngLatBounds(
        [currentPoints[0].longitude, currentPoints[0].latitude],
        [currentPoints[0].longitude, currentPoints[0].latitude]
      )
      currentPoints.slice(1).forEach((point) => {
        bounds.extend([point.longitude, point.latitude])
      })
      map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 14 })
    }

    const highlightedPoint = currentHighlightedItemId
      ? currentPoints.find((point) => point.id === currentHighlightedItemId)
      : null
    if (highlightedPoint) {
      map.flyTo({
        center: [highlightedPoint.longitude, highlightedPoint.latitude],
        zoom: 15.2,
        duration: 650,
        essential: true,
      })
      return
    }

    if (currentFocusedDayNumber != null) {
      const dayPoints = currentPoints.filter((point) => point.dayNumber === currentFocusedDayNumber)
      fitPointsToBounds(dayPoints, 15)
    }
  }, [])

  useEffect(() => {
    pointsRef.current = points
    routeCoordinatesRef.current = routeCoordinates
    highlightedItemIdRef.current = highlightedItemId
    focusedDayNumberRef.current = focusedDayNumber
    syncMapOverlays()
  }, [focusedDayNumber, highlightedItemId, points, routeCoordinates, syncMapOverlays])

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!containerRef.current) return

    let cancelled = false

    async function mountMap() {
      const maplibre = await import('maplibre-gl')
      if (cancelled || !containerRef.current) return
      maplibreRef.current = maplibre

      const seedPoints = pointsRef.current
      const map = new maplibre.Map({
        container: containerRef.current,
        style: buildStyle(mode),
        center: seedPoints[0] ? [seedPoints[0].longitude, seedPoints[0].latitude] : [0, 20],
        zoom: seedPoints.length > 0 ? 5 : 1.2,
        attributionControl: true,
      })
      mapInstanceRef.current = map as unknown as NonNullable<typeof mapInstanceRef.current>

      map.once('load', () => {
        if (!cancelled) syncMapOverlays()
      })

      resizeObserverRef.current = new ResizeObserver(() => {
        map.resize()
      })
      resizeObserverRef.current.observe(containerRef.current)
    }

    void mountMap()

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      markersRef.current.forEach((marker) => {
        marker.remove()
      })
      markersRef.current = []
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      maplibreRef.current = null
    }
  }, [mode, syncMapOverlays])

  if (import.meta.env.MODE === 'test') {
    return (
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 220, lg: 420 },
          borderTop: '1px solid rgba(15,23,42,0.06)',
          bgcolor: 'rgba(248,250,252,0.8)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Map preview unavailable in tests.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 220, lg: 420 },
        borderTop: '1px solid rgba(15,23,42,0.06)',
        overflow: 'hidden',
      }}
    >
      <Box ref={containerRef} sx={{ position: 'absolute', inset: 0 }} />
    </Box>
  )
}
