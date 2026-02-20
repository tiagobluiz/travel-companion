package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.audit.AuditActorResolver
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

class JpaTripRepositoryPersistenceStrategyTest {

    private val springRepo = mock<SpringDataTripRepository>()
    private val membershipRepo = mock<SpringDataTripMembershipRepository>()
    private val inviteRepo = mock<SpringDataTripInviteRepository>()
    private val auditRepo = mock<SpringDataAuditEventRepository>()
    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
        registerModule(KotlinModule.Builder().build())
    }
    private val auditWriter = AuditEventWriter(auditRepo, objectMapper, AuditActorResolver())

    @Test
    fun `save syncs memberships and invites without delete-all and keeps invite id stable`() {
        val tripId = TripId.generate()
        val ownerId = UserId.generate()
        val editorId = UserId.generate()
        val createdAt = Instant.parse("2026-01-01T00:00:00Z")
        val existingInviteId = UUID.randomUUID()

        val existingTripEntity = TripJpaEntity(
            id = tripId.value,
            ownerId = ownerId.value,
            name = "Trip",
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2026, 1, 10),
            visibility = TripVisibility.PRIVATE.name,
            itineraryItems = mutableListOf(),
            createdAt = createdAt,
        )
        val staleMembershipUser = UUID.randomUUID()
        val existingMemberships = listOf(
            TripMembershipJpaEntity(
                tripId = tripId.value,
                userId = ownerId.value,
                role = TripRole.OWNER.name,
                createdAt = createdAt,
            ),
            TripMembershipJpaEntity(
                tripId = tripId.value,
                userId = staleMembershipUser,
                role = TripRole.VIEWER.name,
                createdAt = createdAt,
            ),
        )
        val existingInvites = listOf(
            TripInviteJpaEntity(
                id = existingInviteId,
                tripId = tripId.value,
                email = "kept@example.com",
                role = TripRole.VIEWER.name,
                status = InviteStatus.PENDING.name,
                createdAt = createdAt,
            ),
            TripInviteJpaEntity(
                id = UUID.randomUUID(),
                tripId = tripId.value,
                email = "stale@example.com",
                role = TripRole.VIEWER.name,
                status = InviteStatus.PENDING.name,
                createdAt = createdAt,
            ),
        )

        whenever(springRepo.findById(tripId.value)).thenReturn(Optional.of(existingTripEntity))
        whenever(springRepo.save(any<TripJpaEntity>())).thenAnswer { it.arguments[0] as TripJpaEntity }
        whenever(membershipRepo.findByTripId(tripId.value)).thenReturn(existingMemberships, existingMemberships)
        whenever(inviteRepo.findByTripId(tripId.value)).thenReturn(existingInvites, existingInvites)
        whenever(membershipRepo.saveAll(any<List<TripMembershipJpaEntity>>()))
            .thenAnswer { it.arguments[0] as List<TripMembershipJpaEntity> }
        whenever(inviteRepo.saveAll(any<List<TripInviteJpaEntity>>()))
            .thenAnswer { it.arguments[0] as List<TripInviteJpaEntity> }
        whenever(auditRepo.save(any<AuditEventJpaEntity>())).thenAnswer { it.arguments[0] as AuditEventJpaEntity }

        val repository = JpaTripRepository(springRepo, membershipRepo, inviteRepo, auditWriter)
        val saved = repository.save(
            Trip(
                id = tripId,
                userId = ownerId,
                name = "Trip",
                startDate = LocalDate.of(2026, 1, 1),
                endDate = LocalDate.of(2026, 1, 10),
                visibility = TripVisibility.PRIVATE,
                memberships = listOf(
                    TripMembership(ownerId, TripRole.OWNER),
                    TripMembership(editorId, TripRole.EDITOR),
                ),
                invites = listOf(
                    TripInvite("kept@example.com", TripRole.EDITOR, InviteStatus.PENDING, createdAt),
                    TripInvite("new@example.com", TripRole.VIEWER, InviteStatus.PENDING, createdAt),
                ),
                itineraryItems = emptyList(),
                createdAt = createdAt,
            )
        )

        val inviteCaptor = argumentCaptor<List<TripInviteJpaEntity>>()
        verify(inviteRepo).saveAll(inviteCaptor.capture())
        val keptInvite = inviteCaptor.firstValue.first { it.email == "kept@example.com" }
        assertEquals(existingInviteId, keptInvite.id)
        assertEquals(2, saved.invites.size)
        val membershipDeleteCaptor = argumentCaptor<List<TripMembershipJpaEntity>>()
        verify(membershipRepo).deleteAll(membershipDeleteCaptor.capture())
        assertEquals(1, membershipDeleteCaptor.firstValue.size)
        assertEquals(staleMembershipUser, membershipDeleteCaptor.firstValue[0].userId)
        val inviteDeleteCaptor = argumentCaptor<List<TripInviteJpaEntity>>()
        verify(inviteRepo).deleteAll(inviteDeleteCaptor.capture())
        assertEquals(1, inviteDeleteCaptor.firstValue.size)
        assertEquals("stale@example.com", inviteDeleteCaptor.firstValue[0].email)
        verify(membershipRepo, never()).deleteByTripId(any())
        verify(inviteRepo, never()).deleteByTripId(any())
    }

    @Test
    fun `findByUserId hydrates memberships and invites in batch`() {
        val ownerId = UserId.generate()
        val tripA = TripJpaEntity(
            id = UUID.randomUUID(),
            ownerId = ownerId.value,
            name = "A",
            startDate = LocalDate.of(2026, 2, 1),
            endDate = LocalDate.of(2026, 2, 3),
            visibility = TripVisibility.PRIVATE.name,
            itineraryItems = mutableListOf(),
            createdAt = Instant.parse("2026-02-01T00:00:00Z"),
        )
        val tripB = TripJpaEntity(
            id = UUID.randomUUID(),
            ownerId = ownerId.value,
            name = "B",
            startDate = LocalDate.of(2026, 3, 1),
            endDate = LocalDate.of(2026, 3, 3),
            visibility = TripVisibility.PUBLIC.name,
            itineraryItems = mutableListOf(),
            createdAt = Instant.parse("2026-03-01T00:00:00Z"),
        )

        whenever(springRepo.findAccessibleByUserIdOrderByCreatedAtDesc(ownerId.value)).thenReturn(listOf(tripA, tripB))
        whenever(membershipRepo.findByTripIdIn(listOf(tripA.id, tripB.id))).thenReturn(
            listOf(
                TripMembershipJpaEntity(tripA.id, ownerId.value, TripRole.OWNER.name, tripA.createdAt),
                TripMembershipJpaEntity(tripB.id, ownerId.value, TripRole.OWNER.name, tripB.createdAt),
            )
        )
        whenever(inviteRepo.findByTripIdIn(listOf(tripA.id, tripB.id))).thenReturn(emptyList())

        val repository = JpaTripRepository(springRepo, membershipRepo, inviteRepo, auditWriter)
        val trips = repository.findByUserId(ownerId)

        assertEquals(2, trips.size)
        verify(membershipRepo, times(1)).findByTripIdIn(listOf(tripA.id, tripB.id))
        verify(inviteRepo, times(1)).findByTripIdIn(listOf(tripA.id, tripB.id))
        verify(membershipRepo, never()).findByTripId(any())
        verify(inviteRepo, never()).findByTripId(any())
    }
}

