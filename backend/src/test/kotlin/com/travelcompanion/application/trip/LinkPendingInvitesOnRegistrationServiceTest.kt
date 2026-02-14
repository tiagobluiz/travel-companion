package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class LinkPendingInvitesOnRegistrationServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val service = LinkPendingInvitesOnRegistrationService(tripRepository)

    @Test
    fun `links pending invite by case insensitive exact email on registration`() {
        val userId = UserId.generate()
        val user = createUser(userId, "member@example.com")
        val trip = createTrip(
            invites = listOf(
                TripInvite("Member@Example.com", TripRole.EDITOR, InviteStatus.PENDING, Instant.now())
            )
        )

        whenever(tripRepository.findByInviteEmail("member@example.com")).thenReturn(listOf(trip))
        whenever(tripRepository.save(any())).thenAnswer { it.arguments[0] as Trip }

        service.execute(user)

        val tripCaptor = argumentCaptor<Trip>()
        verify(tripRepository).save(tripCaptor.capture())
        val saved = tripCaptor.firstValue
        assertEquals(InviteStatus.ACCEPTED, saved.invites.single().status)
        assertEquals(TripRole.EDITOR, saved.memberships.first { it.userId == userId }.role)
    }

    private fun createTrip(
        invites: List<TripInvite>,
    ): Trip {
        val ownerId = UserId.generate()
        return Trip(
            id = TripId.generate(),
            userId = ownerId,
            name = "Trip",
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2026, 1, 3),
            memberships = listOf(TripMembership(ownerId, TripRole.OWNER)),
            invites = invites,
            createdAt = Instant.now(),
        )
    }

    private fun createUser(id: UserId, email: String): User = User(
        id = id,
        email = email,
        passwordHash = "hash",
        displayName = "Member",
        createdAt = Instant.now(),
    )
}
