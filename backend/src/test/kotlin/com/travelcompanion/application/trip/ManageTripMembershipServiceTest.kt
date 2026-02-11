package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class ManageTripMembershipServiceTest {

    private val repository = mock<TripRepository>()
    private val service = ManageTripMembershipService(repository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()

    @Test
    fun `addOwner returns null when trip not found`() {
        whenever(repository.findById(tripId)).thenReturn(null)

        val result = service.addOwner(tripId, ownerId, UserId.generate())

        assertNull(result)
    }

    @Test
    fun `addOwner saves updated trip`() {
        val targetOwner = UserId.generate()
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val result = service.addOwner(tripId, ownerId, targetOwner)

        assertNotNull(result)
        verify(repository).save(any())
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 5),
        createdAt = Instant.now(),
    )
}

