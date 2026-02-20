import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ItineraryBoard } from './ItineraryBoard'

const itinerary = {
  days: [
    {
      dayNumber: 1,
      date: '2026-01-01',
      items: [{ id: 'd1-1', placeName: 'Louvre', notes: 'Morning', latitude: 1, longitude: 1, dayNumber: 1 }],
    },
    {
      dayNumber: 2,
      date: '2026-01-02',
      items: [],
    },
  ],
  placesToVisit: {
    label: 'Places To Visit',
    items: [{ id: 'p-1', placeName: 'Montmartre', notes: '', latitude: 2, longitude: 2, dayNumber: null }],
  },
}

describe('ItineraryBoard', () => {
  it('renders loading states for day and places containers', () => {
    render(
      <ItineraryBoard
        itinerary={undefined}
        isLoading
        loadError={null}
        canEditPlanning={false}
        isMovePending={false}
        isEditPending={false}
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('Loading itinerary days...')).toBeInTheDocument()
    expect(screen.getByText('Loading places to visit...')).toBeInTheDocument()
  })

  it('renders day columns and places to visit in backend order (happy path)', () => {
    render(
      <ItineraryBoard
        itinerary={itinerary}
        isLoading={false}
        loadError={null}
        canEditPlanning={false}
        isMovePending={false}
        isEditPending={false}
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('Day 1 (2026-01-01)')).toBeInTheDocument()
    expect(screen.getByText('Day 2 (2026-01-02)')).toBeInTheDocument()
    expect(screen.getByText('Places To Visit')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Montmartre')).toBeInTheDocument()
  })

  it('renders edit controls when planning is enabled', () => {
    render(
      <ItineraryBoard
        itinerary={itinerary}
        isLoading={false}
        loadError={null}
        canEditPlanning
        isMovePending={false}
        isEditPending={false}
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getAllByRole('button', { name: 'Move up' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Move down' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Remove' }).length).toBeGreaterThan(0)
  })

  it('renders empty states for day and places containers', () => {
    render(
      <ItineraryBoard
        itinerary={{
          days: [{ dayNumber: 1, date: '2026-01-01', items: [] }],
          placesToVisit: { label: 'Places To Visit', items: [] },
        }}
        isLoading={false}
        loadError={null}
        canEditPlanning={false}
        isMovePending={false}
        isEditPending={false}
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('No items in this day.')).toBeInTheDocument()
    expect(screen.getByText('No places waiting to be scheduled.')).toBeInTheDocument()
  })

  it('renders error states for day and places containers', () => {
    render(
      <ItineraryBoard
        itinerary={undefined}
        isLoading={false}
        loadError={new Error('load failed')}
        canEditPlanning={false}
        isMovePending={false}
        isEditPending={false}
        tripStartDate="2026-01-01"
        tripEndDate="2026-01-03"
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('Failed to load itinerary.')).toBeInTheDocument()
    expect(screen.getByText('Failed to load places to visit.')).toBeInTheDocument()
  })
})
