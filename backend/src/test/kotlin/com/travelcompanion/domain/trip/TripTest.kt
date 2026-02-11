package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.assertNull
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

    @Test
    fun `trip supports public visibility`() {
        val trip = createTrip().updateDetails(
            name = "Public Trip",
            startDate = startDate,
            endDate = endDate,
            visibility = TripVisibility.PUBLIC,
        )
        assertEquals(TripVisibility.PUBLIC, trip.visibility)
        assertTrue(trip.canView(null))
    }

    @Test
    fun `trip supports owner editor viewer memberships`() {
        val editorId = UserId.generate()
        val viewerId = UserId.generate()
        val trip = createTrip().copy(
            memberships = listOf(
                TripMembership(userId = userId, role = TripRole.OWNER),
                TripMembership(userId = editorId, role = TripRole.EDITOR),
                TripMembership(userId = viewerId, role = TripRole.VIEWER),
            )
        )

        assertTrue(trip.hasRole(userId, TripRole.OWNER))
        assertTrue(trip.hasRole(editorId, TripRole.EDITOR))
        assertTrue(trip.hasRole(viewerId, TripRole.VIEWER))
    }

    @Test
    fun `trip supports pending accepted declined invite states`() {
        val now = Instant.now()
        val trip = createTrip().copy(
            invites = listOf(
                TripInvite("pending@example.com", TripRole.EDITOR, InviteStatus.PENDING, now),
                TripInvite("accepted@example.com", TripRole.VIEWER, InviteStatus.ACCEPTED, now),
                TripInvite("declined@example.com", TripRole.VIEWER, InviteStatus.DECLINED, now),
            )
        )

        assertEquals(3, trip.invites.size)
        assertEquals(InviteStatus.PENDING, trip.invites[0].status)
        assertEquals(InviteStatus.ACCEPTED, trip.invites[1].status)
        assertEquals(InviteStatus.DECLINED, trip.invites[2].status)
    }

    @Test
    fun `generated days cover full trip range and places list is separate`() {
        val trip = createTrip()
            .addItineraryItemToDay("Museum", "visit", 10.0, 20.0, dayNumber = 2)
            .addItineraryItemToPlacesToVisit("Wishlist", "", 11.0, 21.0)

        val days = trip.generatedDays()
        assertEquals(10, days.size)
        assertEquals(LocalDate.of(2025, 6, 2), days[1].date)
        assertEquals(1, days[1].items.size)
        assertEquals("Museum", days[1].items[0].placeName)
        assertEquals(1, trip.placesToVisitItems().size)
        assertNull(trip.placesToVisitItems()[0].date)
    }

    @Test
    fun `move item supports before and after ordering in day container`() {
        var trip = createTrip()
            .addItineraryItemToDay("A", "", 1.0, 1.0, 1)
            .addItineraryItemToDay("B", "", 1.0, 1.0, 1)
            .addItineraryItemToDay("C", "", 1.0, 1.0, 1)

        val itemA = trip.generatedDays()[0].items[0]
        val itemB = trip.generatedDays()[0].items[1]
        val itemC = trip.generatedDays()[0].items[2]

        trip = trip.moveItineraryItem(itemId = itemC.id, targetDayNumber = 1, beforeItemId = itemA.id, afterItemId = null)
        assertEquals(listOf("C", "A", "B"), trip.generatedDays()[0].items.map { it.placeName })

        trip = trip.moveItineraryItem(itemId = itemA.id, targetDayNumber = 1, beforeItemId = null, afterItemId = itemB.id)
        assertEquals(listOf("C", "B", "A"), trip.generatedDays()[0].items.map { it.placeName })
    }

    @Test
    fun `move item between places and day containers`() {
        val trip = createTrip()
            .addItineraryItemToPlacesToVisit("Idea", "", 1.0, 1.0)

        val itemId = trip.placesToVisitItems().first().id
        val moved = trip.moveItineraryItem(itemId, targetDayNumber = 3, beforeItemId = null, afterItemId = null)

        assertEquals(0, moved.placesToVisitItems().size)
        assertEquals("Idea", moved.generatedDays()[2].items.first().placeName)
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
