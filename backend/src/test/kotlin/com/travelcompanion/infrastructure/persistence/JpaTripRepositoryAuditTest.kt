package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.ItineraryItem
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
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

class JpaTripRepositoryAuditTest {

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
    fun `save update records trip and derived member invite day list item audit events`() {
        val tripId = TripId.generate()
        val ownerId = UserId.generate()
        val editorId = UserId.generate()
        val createdAt = Instant.parse("2026-01-01T00:00:00Z")

        val beforeItem = ItineraryItem("Before", LocalDate.of(2026, 1, 2), "", 10.0, 20.0)
        val afterItem = ItineraryItem("After", LocalDate.of(2026, 1, 3), "", 11.0, 21.0)

        val beforeEntity = TripJpaEntity(
            id = tripId.value,
            ownerId = ownerId.value,
            name = "Trip",
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2026, 1, 5),
            visibility = TripVisibility.PRIVATE.name,
            itineraryItems = mutableListOf(beforeItem),
            createdAt = createdAt,
        )

        val afterTrip = Trip(
            id = tripId,
            userId = ownerId,
            name = "Trip Updated",
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2026, 1, 5),
            visibility = TripVisibility.PUBLIC,
            memberships = listOf(
                TripMembership(ownerId, TripRole.OWNER),
                TripMembership(editorId, TripRole.EDITOR),
            ),
            invites = listOf(
                TripInvite("new@example.com", TripRole.VIEWER, InviteStatus.PENDING, createdAt),
            ),
            itineraryItems = listOf(afterItem),
            createdAt = createdAt,
        )

        whenever(springRepo.findById(tripId.value)).thenReturn(Optional.of(beforeEntity))
        whenever(springRepo.save(any<TripJpaEntity>())).thenAnswer { it.arguments[0] as TripJpaEntity }
        whenever(membershipRepo.findByTripId(tripId.value)).thenReturn(
            listOf(
                TripMembershipJpaEntity(
                    tripId = tripId.value,
                    userId = ownerId.value,
                    role = TripRole.OWNER.name,
                    createdAt = createdAt,
                )
            ),
            listOf(
                TripMembershipJpaEntity(
                    tripId = tripId.value,
                    userId = ownerId.value,
                    role = TripRole.OWNER.name,
                    createdAt = createdAt,
                ),
                TripMembershipJpaEntity(
                    tripId = tripId.value,
                    userId = editorId.value,
                    role = TripRole.EDITOR.name,
                    createdAt = createdAt,
                )
            ),
        )
        whenever(inviteRepo.findByTripId(tripId.value)).thenReturn(
            emptyList(),
            listOf(
                TripInviteJpaEntity(
                    id = UUID.randomUUID(),
                    tripId = tripId.value,
                    email = "new@example.com",
                    role = TripRole.VIEWER.name,
                    status = InviteStatus.PENDING.name,
                    createdAt = createdAt,
                )
            ),
        )

        val persistedEvents = mutableListOf<AuditEventJpaEntity>()
        whenever(auditRepo.save(any<AuditEventJpaEntity>())).thenAnswer {
            (it.arguments[0] as AuditEventJpaEntity).also { entity -> persistedEvents.add(entity) }
        }

        val repository = JpaTripRepository(springRepo, membershipRepo, inviteRepo, auditWriter)
        val saved = repository.save(afterTrip)

        assertEquals(afterTrip.id, saved.id)

        val byAction = persistedEvents.associateBy { it.action }
        assertNotNull(byAction["TRIP_UPDATED"])
        assertNotNull(byAction["MEMBER_WRITE"])
        assertNotNull(byAction["INVITE_WRITE"])
        assertNotNull(byAction["ITEM_WRITE"])
        assertNotNull(byAction["DAY_WRITE"])
        assertNotNull(byAction["LIST_WRITE"])

        assertEquals("TRIP", byAction["TRIP_UPDATED"]!!.entityType)
        assertEquals("MEMBER", byAction["MEMBER_WRITE"]!!.entityType)
        assertEquals("INVITE", byAction["INVITE_WRITE"]!!.entityType)
        assertEquals("ITEM", byAction["ITEM_WRITE"]!!.entityType)
        assertEquals("DAY", byAction["DAY_WRITE"]!!.entityType)
        assertEquals("LIST", byAction["LIST_WRITE"]!!.entityType)

        assertEquals(1, byAction["TRIP_UPDATED"]!!.metadata.get("itineraryItemCount").asInt())
        assertEquals(tripId.toString(), byAction["ITEM_WRITE"]!!.metadata.get("tripId").asText())
        assertEquals("Places To Visit", byAction["LIST_WRITE"]!!.metadata.get("listName").asText())
        assertEquals("Single-list itinerary baseline", byAction["LIST_WRITE"]!!.metadata.get("note").asText())

        assertEquals("Before", byAction["ITEM_WRITE"]!!.beforeState?.get(0)?.get("placeName")?.asText())
        assertEquals("After", byAction["ITEM_WRITE"]!!.afterState?.get(0)?.get("placeName")?.asText())
    }
}
