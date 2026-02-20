package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.LocalDate

class CreateTripServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val service = CreateTripService(tripRepository)

    @Test
    fun `execute trims name and persists trip`() {
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }
        val ownerId = UserId.generate()

        val result = service.execute(
            userId = ownerId,
            name = "  Summer Trip  ",
            startDate = LocalDate.of(2026, 7, 1),
            endDate = LocalDate.of(2026, 7, 10),
            visibility = TripVisibility.PUBLIC,
        )

        val tripCaptor = argumentCaptor<Trip>()
        verify(tripRepository).save(tripCaptor.capture())
        assertEquals("Summer Trip", tripCaptor.firstValue.name)
        assertEquals(TripVisibility.PUBLIC, result.visibility)
        assertTrue(result.memberships.any { it.userId == ownerId && it.role == TripRole.OWNER })
    }

    @Test
    fun `execute throws when trimmed name is blank`() {
        assertThrows<IllegalArgumentException> {
            service.execute(
                userId = UserId.generate(),
                name = "   ",
                startDate = LocalDate.of(2026, 7, 1),
                endDate = LocalDate.of(2026, 7, 2),
            )
        }
        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute throws when end date is before start date`() {
        assertThrows<IllegalArgumentException> {
            service.execute(
                userId = UserId.generate(),
                name = "Trip",
                startDate = LocalDate.of(2026, 7, 10),
                endDate = LocalDate.of(2026, 7, 1),
            )
        }
        verify(tripRepository, never()).save(any())
    }
}

