package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class GetTripServiceTest {

    private val repository = mock<TripRepository>()
    private val service = GetTripService(repository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val outsiderId = UserId.generate()

    @Test
    fun `anonymous user can read public trip`() {
        val trip = createTrip(visibility = TripVisibility.PUBLIC)
        whenever(repository.findById(tripId)).thenReturn(trip)

        val result = service.execute(tripId, null)

        assertEquals(trip, result)
    }

    @Test
    fun `anonymous user cannot read private trip`() {
        val trip = createTrip(visibility = TripVisibility.PRIVATE)
        whenever(repository.findById(tripId)).thenReturn(trip)

        val result = service.execute(tripId, null)

        assertNull(result)
    }

    @Test
    fun `non member cannot read private trip`() {
        val trip = createTrip(visibility = TripVisibility.PRIVATE)
        whenever(repository.findById(tripId)).thenReturn(trip)

        val result = service.execute(tripId, outsiderId)

        assertNull(result)
    }

    private fun createTrip(visibility: TripVisibility) = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 3),
        visibility = visibility,
        memberships = listOf(TripMembership(ownerId, TripRole.OWNER)),
        createdAt = Instant.now(),
    )
}
