package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
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

class UpdateTripServiceTest {

    private val repository = mock<TripRepository>()
    private val service = UpdateTripService(repository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val editorId = UserId.generate()
    private val viewerId = UserId.generate()
    private val outsiderId = UserId.generate()

    @Test
    fun `owner can update privacy and details`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = ownerId,
            name = "Updated",
            startDate = LocalDate.of(2026, 1, 2),
            endDate = LocalDate.of(2026, 1, 6),
            visibility = TripVisibility.PUBLIC,
        )

        assertNotNull(updated)
        assertEquals("Updated", updated!!.name)
        assertEquals(TripVisibility.PUBLIC, updated.visibility)
    }

    @Test
    fun `editor can update name dates but not privacy`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val detailsUpdated = service.execute(
            tripId = tripId,
            userId = editorId,
            name = "Editor Update",
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2026, 1, 7),
            visibility = null,
        )
        assertNotNull(detailsUpdated)
        assertEquals("Editor Update", detailsUpdated!!.name)

        val privacyUpdated = service.execute(
            tripId = tripId,
            userId = editorId,
            name = null,
            startDate = null,
            endDate = null,
            visibility = TripVisibility.PUBLIC,
        )
        assertNull(privacyUpdated)
    }

    @Test
    fun `viewer cannot update details`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val updated = service.execute(
            tripId = tripId,
            userId = viewerId,
            name = "Nope",
            startDate = null,
            endDate = null,
            visibility = null,
        )

        assertNull(updated)
        verify(repository, never()).save(any())
    }

    @Test
    fun `non member cannot update details or visibility`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val updated = service.execute(
            tripId = tripId,
            userId = outsiderId,
            name = "Outsider",
            startDate = null,
            endDate = null,
            visibility = TripVisibility.PUBLIC,
        )

        assertNull(updated)
        verify(repository, never()).save(any())
    }

    @Test
    fun `editor cannot update visibility only`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val updated = service.execute(
            tripId = tripId,
            userId = editorId,
            name = null,
            startDate = null,
            endDate = null,
            visibility = TripVisibility.PUBLIC,
        )

        assertNull(updated)
        verify(repository, never()).save(any())
    }

    @Test
    fun `owner can update visibility only`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.execute(
            tripId = tripId,
            userId = ownerId,
            name = null,
            startDate = null,
            endDate = null,
            visibility = TripVisibility.PUBLIC,
        )

        assertNotNull(updated)
        assertEquals(TripVisibility.PUBLIC, updated!!.visibility)
    }

    @Test
    fun `returns existing trip when no fields are provided`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val updated = service.execute(
            tripId = tripId,
            userId = ownerId,
            name = null,
            startDate = null,
            endDate = null,
            visibility = null,
        )

        assertEquals(trip, updated)
        verify(repository, never()).save(any())
    }

    @Test
    fun `returns null when trip not found`() {
        whenever(repository.findById(tripId)).thenReturn(null)

        val updated = service.execute(
            tripId = tripId,
            userId = ownerId,
            name = "Whatever",
            startDate = null,
            endDate = null,
            visibility = null,
        )

        assertNull(updated)
        verify(repository, never()).save(any())
    }

    @Test
    fun `editor cannot update details when visibility is also requested`() {
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)

        val updated = service.execute(
            tripId = tripId,
            userId = editorId,
            name = "Editor rename",
            startDate = null,
            endDate = null,
            visibility = TripVisibility.PUBLIC,
        )

        assertNull(updated)
        verify(repository, never()).save(any())
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 5),
        memberships = listOf(
            TripMembership(ownerId, TripRole.OWNER),
            TripMembership(editorId, TripRole.EDITOR),
            TripMembership(viewerId, TripRole.VIEWER),
        ),
        createdAt = Instant.now(),
    )
}

