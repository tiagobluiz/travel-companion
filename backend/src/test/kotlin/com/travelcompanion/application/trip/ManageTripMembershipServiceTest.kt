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
import com.travelcompanion.domain.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate

class ManageTripMembershipServiceTest {

    private val repository = mock<TripRepository>()
    private val userRepository = mock<UserRepository>()
    private val service = ManageTripMembershipService(repository, userRepository)

    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val memberId = UserId.generate()

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

    @Test
    fun `invite reopens declined invite as pending`() {
        val trip = createTrip(
            invites = listOf(
                TripInvite(
                    email = "member@example.com",
                    role = TripRole.VIEWER,
                    status = InviteStatus.DECLINED,
                    createdAt = Instant.now().minusSeconds(3600),
                )
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(userRepository.findByEmail("member@example.com")).thenReturn(null)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.inviteMember(tripId, ownerId, "Member@Example.com", TripRole.EDITOR)

        assertEquals(InviteStatus.PENDING, updated!!.invites.single().status)
        assertEquals(TripRole.EDITOR, updated.invites.single().role)
    }

    @Test
    fun `invite links existing registered user with case insensitive exact match`() {
        val existingUser = createUser(email = "member@example.com", id = memberId)
        val trip = createTrip()
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(userRepository.findByEmail("member@example.com")).thenReturn(existingUser)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.inviteMember(tripId, ownerId, "MEMBER@example.com", TripRole.EDITOR)

        assertEquals(1, updated!!.memberships.count { it.userId == memberId && it.role == TripRole.EDITOR })
    }

    @Test
    fun `respond accept marks invite accepted and adds membership`() {
        val user = createUser(email = "guest@example.com", id = memberId)
        val trip = createTrip(
            invites = listOf(
                TripInvite("guest@example.com", TripRole.VIEWER, InviteStatus.PENDING, Instant.now())
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(userRepository.findById(memberId)).thenReturn(user)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.respondToInvite(tripId, memberId, accept = true)

        assertEquals(InviteStatus.ACCEPTED, updated!!.invites.single().status)
        assertEquals(TripRole.VIEWER, updated.memberships.first { it.userId == memberId }.role)
    }

    @Test
    fun `remove pending invite works for owners`() {
        val trip = createTrip(
            invites = listOf(
                TripInvite("pending@example.com", TripRole.VIEWER, InviteStatus.PENDING, Instant.now())
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.removePendingOrDeclinedInvite(tripId, ownerId, "pending@example.com")

        assertEquals(0, updated!!.invites.size)
    }

    @Test
    fun `change member role cannot demote another owner`() {
        val secondOwner = UserId.generate()
        val trip = createTrip(
            memberships = listOf(
                TripMembership(ownerId, TripRole.OWNER),
                TripMembership(secondOwner, TripRole.OWNER),
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)

        assertThrows(IllegalArgumentException::class.java) {
            service.changeMemberRole(tripId, ownerId, secondOwner, TripRole.EDITOR)
        }
    }

    @Test
    fun `change invite role updates pending invite`() {
        val trip = createTrip(
            invites = listOf(
                TripInvite("pending@example.com", TripRole.VIEWER, InviteStatus.PENDING, Instant.now())
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(repository.save(any())).thenAnswer { it.arguments[0] as Trip }

        val updated = service.changeInviteRole(tripId, ownerId, "PENDING@example.com", TripRole.EDITOR)

        assertEquals(TripRole.EDITOR, updated!!.invites.single().role)
    }

    @Test
    fun `invite by non owner throws access denied`() {
        val nonOwner = UserId.generate()
        val trip = createTrip(
            memberships = listOf(
                TripMembership(ownerId, TripRole.OWNER),
                TripMembership(nonOwner, TripRole.VIEWER),
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)

        assertThrows(TripCollaborationAccessDeniedException::class.java) {
            service.inviteMember(tripId, nonOwner, "new@example.com", TripRole.VIEWER)
        }
    }

    @Test
    fun `invite cannot demote another owner via existing user link`() {
        val secondOwner = UserId.generate()
        val existingOwnerUser = createUser(email = "owner2@example.com", id = secondOwner)
        val trip = createTrip(
            memberships = listOf(
                TripMembership(ownerId, TripRole.OWNER),
                TripMembership(secondOwner, TripRole.OWNER),
            )
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(userRepository.findByEmail("owner2@example.com")).thenReturn(existingOwnerUser)

        assertThrows(IllegalArgumentException::class.java) {
            service.inviteMember(tripId, ownerId, "owner2@example.com", TripRole.VIEWER)
        }
    }

    @Test
    fun `invite cannot demote self when user is last owner`() {
        val existingOwnerUser = createUser(email = "owner@example.com", id = ownerId)
        val trip = createTrip(
            memberships = listOf(TripMembership(ownerId, TripRole.OWNER))
        )
        whenever(repository.findById(tripId)).thenReturn(trip)
        whenever(userRepository.findByEmail("owner@example.com")).thenReturn(existingOwnerUser)

        assertThrows(IllegalArgumentException::class.java) {
            service.inviteMember(tripId, ownerId, "owner@example.com", TripRole.EDITOR)
        }
    }

    @Test
    fun `change member role cannot demote last owner`() {
        val trip = createTrip(
            memberships = listOf(TripMembership(ownerId, TripRole.OWNER))
        )
        whenever(repository.findById(tripId)).thenReturn(trip)

        assertThrows(IllegalArgumentException::class.java) {
            service.changeMemberRole(tripId, ownerId, ownerId, TripRole.EDITOR)
        }
    }

    private fun createTrip(
        memberships: List<TripMembership> = listOf(TripMembership(ownerId, TripRole.OWNER)),
        invites: List<TripInvite> = emptyList(),
    ) = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 5),
        memberships = memberships,
        invites = invites,
        createdAt = Instant.now(),
    )

    private fun createUser(email: String, id: UserId): User = User(
        id = id,
        email = email,
        passwordHash = "hashed",
        displayName = "Member",
        createdAt = Instant.now(),
    )
}
