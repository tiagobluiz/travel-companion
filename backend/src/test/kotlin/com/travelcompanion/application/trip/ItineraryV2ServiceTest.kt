package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class ItineraryV2ServiceTest {

    private val repository = mock<TripRepository>()
    private val service = ItineraryV2Service(repository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val editorId = UserId.generate()
    private val viewerId = UserId.generate()

    @Test
    fun `editor can add itinerary item`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val result = service.addItem(
            tripId = tripId,
            userId = editorId,
            placeName = "Museum",
            notes = "",
            latitude = 1.0,
            longitude = 2.0,
            dayNumber = 1,
        )

        assertNotNull(result)
        verify(repository).save(any())
    }

    @Test
    fun `viewer cannot add itinerary item`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val result = service.addItem(
            tripId = tripId,
            userId = viewerId,
            placeName = "Museum",
            notes = "",
            latitude = 1.0,
            longitude = 2.0,
            dayNumber = 1,
        )

        assertNull(result)
        verify(repository, never()).save(any())
    }

    @Test
    fun `viewer can read itinerary`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val result = service.get(tripId, viewerId)

        assertNotNull(result)
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 3),
        memberships = listOf(
            TripMembership(ownerId, TripRole.OWNER),
            TripMembership(editorId, TripRole.EDITOR),
            TripMembership(viewerId, TripRole.VIEWER),
        ),
        createdAt = Instant.now(),
    )
}
