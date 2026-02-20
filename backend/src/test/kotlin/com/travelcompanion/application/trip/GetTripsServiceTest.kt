package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class GetTripsServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val service = GetTripsService(tripRepository)

    @Test
    fun `execute returns trips from repository`() {
        val userId = UserId.generate()
        val trips = listOf(
            trip(userId, "A", LocalDate.of(2026, 1, 1)),
            trip(userId, "B", LocalDate.of(2026, 2, 1)),
        )
        whenever(tripRepository.findByUserId(userId)).thenReturn(trips)

        val result = service.execute(userId)

        assertEquals(trips, result)
        verify(tripRepository).findByUserId(userId)
    }

    @Test
    fun `execute returns empty list when user has no trips`() {
        val userId = UserId.generate()
        whenever(tripRepository.findByUserId(userId)).thenReturn(emptyList())

        val result = service.execute(userId)

        assertEquals(emptyList<Trip>(), result)
        verify(tripRepository).findByUserId(userId)
    }

    private fun trip(ownerId: UserId, name: String, startDate: LocalDate) = Trip(
        id = TripId.generate(),
        userId = ownerId,
        name = name,
        startDate = startDate,
        endDate = startDate.plusDays(2),
        visibility = TripVisibility.PRIVATE,
        createdAt = Instant.parse("2026-01-01T00:00:00Z"),
    )
}

