package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate

/**
 * Unit tests for the [Trip] aggregate.
 */
class TripTest {

    private val userId = UserId.generate()
    private val startDate = LocalDate.of(2025, 6, 1)
    private val endDate = LocalDate.of(2025, 6, 10)

    @Test
    fun `addItineraryItem adds item within date range`() {
        val trip = createTrip()
        val item = ItineraryItem("Paris", LocalDate.of(2025, 6, 5), "Eiffel Tower", 48.8566, 2.3522)
        val updated = trip.addItineraryItem(item)
        assertEquals(1, updated.itineraryItems.size)
        assertEquals("Paris", updated.itineraryItems[0].placeName)
        assertEquals(LocalDate.of(2025, 6, 5), updated.itineraryItems[0].date)
    }

    @Test
    fun `addItineraryItem rejects date before start`() {
        val trip = createTrip()
        val item = ItineraryItem("Paris", LocalDate.of(2025, 5, 31), "", 48.0, 2.0)
        assertThrows(IllegalArgumentException::class.java) {
            trip.addItineraryItem(item)
        }
    }

    @Test
    fun `addItineraryItem rejects date after end`() {
        val trip = createTrip()
        val item = ItineraryItem("Paris", LocalDate.of(2025, 6, 11), "", 48.0, 2.0)
        assertThrows(IllegalArgumentException::class.java) {
            trip.addItineraryItem(item)
        }
    }

    @Test
    fun `addItineraryItem preserves coordinates for map display`() {
        val trip = createTrip()
        val item = ItineraryItem(
            placeName = "Eiffel Tower",
            date = LocalDate.of(2025, 6, 5),
            notes = "",
            latitude = 48.8584,
            longitude = 2.2945,
        )
        val updated = trip.addItineraryItem(item)
        assertEquals(48.8584, updated.itineraryItems[0].latitude)
        assertEquals(2.2945, updated.itineraryItems[0].longitude)
    }

    @Test
    fun `removeItineraryItem removes at index`() {
        val trip = createTrip()
            .addItineraryItem(ItineraryItem("A", startDate, "", 0.0, 0.0))
            .addItineraryItem(ItineraryItem("B", startDate.plusDays(1), "", 0.0, 0.0))
        val updated = trip.removeItineraryItem(0)
        assertEquals(1, updated.itineraryItems.size)
        assertEquals("B", updated.itineraryItems[0].placeName)
    }

    @Test
    fun `trip rejects end date before start date`() {
        assertThrows(IllegalArgumentException::class.java) {
            Trip(
                id = TripId.generate(),
                userId = userId,
                name = "Trip",
                startDate = endDate,
                endDate = startDate,
                itineraryItems = emptyList(),
                createdAt = Instant.now(),
            )
        }
    }

    @Test
    fun `trip rejects blank name`() {
        assertThrows(IllegalArgumentException::class.java) {
            Trip(
                id = TripId.generate(),
                userId = userId,
                name = "   ",
                startDate = startDate,
                endDate = endDate,
                itineraryItems = emptyList(),
                createdAt = Instant.now(),
            )
        }
    }

    @Test
    fun `trip rejects itinerary items outside date range at construction`() {
        val outOfRangeItem = ItineraryItem(
            placeName = "London",
            date = endDate.plusDays(1),
            notes = "",
            latitude = 51.5074,
            longitude = -0.1278,
        )
        assertThrows(IllegalArgumentException::class.java) {
            Trip(
                id = TripId.generate(),
                userId = userId,
                name = "Trip",
                startDate = startDate,
                endDate = endDate,
                itineraryItems = listOf(outOfRangeItem),
                createdAt = Instant.now(),
            )
        }
    }

    @Test
    fun `updateDetails rejects new date range that excludes existing itinerary items`() {
        val trip = createTrip().addItineraryItem(
            ItineraryItem("Paris", LocalDate.of(2025, 6, 5), "", 48.0, 2.0)
        )

        assertThrows(IllegalArgumentException::class.java) {
            trip.updateDetails(
                name = trip.name,
                startDate = LocalDate.of(2025, 6, 6),
                endDate = LocalDate.of(2025, 6, 10),
            )
        }
    }

    @Test
    fun `updateDetails rejects blank name`() {
        val trip = createTrip()
        assertThrows(IllegalArgumentException::class.java) {
            trip.updateDetails(
                name = " ",
                startDate = trip.startDate,
                endDate = trip.endDate,
            )
        }
    }

    @Test
    fun `updateDetails rejects end date before start date`() {
        val trip = createTrip()
        assertThrows(IllegalArgumentException::class.java) {
            trip.updateDetails(
                name = trip.name,
                startDate = endDate,
                endDate = startDate,
            )
        }
    }

    @Test
    fun `updateItineraryItem rejects invalid index`() {
        val trip = createTrip()
        val item = ItineraryItem("Paris", startDate, "", 48.0, 2.0)
        assertThrows(IllegalArgumentException::class.java) {
            trip.updateItineraryItem(0, item)
        }
    }

    @Test
    fun `updateItineraryItem rejects out of range date`() {
        val trip = createTrip().addItineraryItem(ItineraryItem("A", startDate, "", 0.0, 0.0))
        val item = ItineraryItem("B", endDate.plusDays(1), "", 0.0, 0.0)
        assertThrows(IllegalArgumentException::class.java) {
            trip.updateItineraryItem(0, item)
        }
    }

    @Test
    fun `removeItineraryItem rejects invalid index`() {
        val trip = createTrip()
        assertThrows(IllegalArgumentException::class.java) {
            trip.removeItineraryItem(0)
        }
    }

    private fun createTrip() = Trip(
        id = TripId.generate(),
        userId = userId,
        name = "Europe 2025",
        startDate = startDate,
        endDate = endDate,
        itineraryItems = emptyList(),
        createdAt = Instant.now(),
    )
}
