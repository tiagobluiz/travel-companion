package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class AddItineraryItemServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val service = AddItineraryItemService(tripRepository)
    private val tripId = TripId.generate()
    private val userId = UserId.generate()

    @Test
    fun `execute throws when itinerary date is before trip start`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        assertThrows<IllegalArgumentException> {
            service.execute(
                tripId = tripId,
                userId = userId,
                placeName = "Outside",
                date = LocalDate.of(2025, 5, 31),
                notes = "",
                latitude = 10.0,
                longitude = 10.0,
            )
        }

        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute throws when itinerary date is after trip end`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        assertThrows<IllegalArgumentException> {
            service.execute(
                tripId = tripId,
                userId = userId,
                placeName = "Outside",
                date = LocalDate.of(2025, 6, 11),
                notes = "",
                latitude = 10.0,
                longitude = 10.0,
            )
        }

        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute accepts itinerary date on trip start`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = userId,
            placeName = "Start Day",
            date = LocalDate.of(2025, 6, 1),
            notes = "",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertEquals(1, updated!!.itineraryItems.size)
        assertEquals(LocalDate.of(2025, 6, 1), updated.itineraryItems.first().date)
        verify(tripRepository).save(any())
    }

    @Test
    fun `execute accepts itinerary date on trip end`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = userId,
            placeName = "End Day",
            date = LocalDate.of(2025, 6, 10),
            notes = "",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertEquals(1, updated!!.itineraryItems.size)
        assertEquals(LocalDate.of(2025, 6, 10), updated.itineraryItems.first().date)
        verify(tripRepository).save(any())
    }

    @Test
    fun `execute returns null when trip is not found`() {
        whenever(tripRepository.findById(tripId)).thenReturn(null)

        val result = service.execute(
            tripId = tripId,
            userId = userId,
            placeName = "Inside",
            date = LocalDate.of(2025, 6, 5),
            notes = "",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertNull(result)
        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute returns null when trip belongs to another user`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        val result = service.execute(
            tripId = tripId,
            userId = UserId.generate(),
            placeName = "Inside",
            date = LocalDate.of(2025, 6, 5),
            notes = "",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertNull(result)
        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute trims place name and notes before saving`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = userId,
            placeName = "  Inside  ",
            date = LocalDate.of(2025, 6, 5),
            notes = "  note  ",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertEquals("Inside", updated!!.itineraryItems.first().placeName)
        assertEquals("note", updated.itineraryItems.first().notes)
    }

    @Test
    fun `execute throws when latitude is invalid`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        assertThrows<IllegalArgumentException> {
            service.execute(
                tripId = tripId,
                userId = userId,
                placeName = "Inside",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 100.0,
                longitude = 10.0,
            )
        }

        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute throws when longitude is invalid`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        assertThrows<IllegalArgumentException> {
            service.execute(
                tripId = tripId,
                userId = userId,
                placeName = "Inside",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 10.0,
                longitude = 200.0,
            )
        }

        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute throws when place name becomes blank after trim`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)

        assertThrows<IllegalArgumentException> {
            service.execute(
                tripId = tripId,
                userId = userId,
                placeName = "   ",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 10.0,
                longitude = 10.0,
            )
        }

        verify(tripRepository, never()).save(any())
    }

    @Test
    fun `execute saves trip when itinerary date is within range`() {
        val trip = createTrip()
        whenever(tripRepository.findById(tripId)).thenReturn(trip)
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = userId,
            placeName = "Inside",
            date = LocalDate.of(2025, 6, 5),
            notes = "",
            latitude = 10.0,
            longitude = 10.0,
        )

        assertEquals(1, updated!!.itineraryItems.size)
        verify(tripRepository).save(any())
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = userId,
        name = "Trip",
        startDate = LocalDate.of(2025, 6, 1),
        endDate = LocalDate.of(2025, 6, 10),
        itineraryItems = emptyList(),
        createdAt = Instant.now(),
    )
}
