package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * JPA implementation of [TripRepository].
 *
 * Maps between domain [Trip] and [TripJpaEntity], delegating persistence
 * to [SpringDataTripRepository].
 */
@Repository
class JpaTripRepository(
    private val springRepo: SpringDataTripRepository,
    private val membershipRepo: SpringDataTripMembershipRepository,
    private val inviteRepo: SpringDataTripInviteRepository,
    private val auditEventWriter: AuditEventWriter,
) : TripRepository {

    @Transactional
    override fun save(trip: Trip): Trip {
        val existing = springRepo.findById(trip.id.value).orElse(null)?.let { toDomain(it) }
        val entity = toEntity(trip)
        val saved = springRepo.save(entity)

        membershipRepo.deleteByTripId(saved.id)
        membershipRepo.saveAll(
            trip.memberships.map {
                TripMembershipJpaEntity(
                    tripId = saved.id,
                    userId = it.userId.value,
                    role = it.role.name,
                    createdAt = Instant.now(),
                )
            }
        )

        inviteRepo.deleteByTripId(saved.id)
        inviteRepo.flush()
        inviteRepo.saveAll(
            trip.invites.map {
                TripInviteJpaEntity(
                    id = UUID.randomUUID(),
                    tripId = saved.id,
                    email = it.email,
                    role = it.role.name,
                    status = it.status.name,
                    createdAt = it.createdAt,
                )
            }
        )

        val savedDomain = toDomain(saved)

        val metadata = mapOf(
            "aggregate" to "trip",
            "itineraryItemCount" to savedDomain.itineraryItems.size,
        )
        if (existing == null) {
            auditEventWriter.record(
                action = "TRIP_CREATED",
                entityType = "TRIP",
                entityId = savedDomain.id.toString(),
                afterState = savedDomain,
                metadata = metadata,
            )
        } else {
            auditEventWriter.record(
                action = "TRIP_UPDATED",
                entityType = "TRIP",
                entityId = savedDomain.id.toString(),
                beforeState = existing,
                afterState = savedDomain,
                metadata = metadata,
            )
            recordDerivedAudit(existing, savedDomain)
        }

        return savedDomain
    }

    override fun findById(id: TripId): Trip? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

    override fun findByUserId(userId: UserId): List<Trip> =
        springRepo.findByOwnerIdOrderByCreatedAtDesc(userId.value).map { toDomain(it) }

    override fun findByInviteEmail(email: String): List<Trip> =
        springRepo.findByInviteEmailIgnoreCase(email.trim()).map { toDomain(it) }

    @Transactional
    override fun deleteById(id: TripId) {
        val existing = findById(id)
        inviteRepo.deleteByTripId(id.value)
        membershipRepo.deleteByTripId(id.value)
        springRepo.deleteById(id.value)
        if (existing != null) {
            auditEventWriter.record(
                action = "TRIP_DELETED",
                entityType = "TRIP",
                entityId = id.toString(),
                beforeState = existing,
                metadata = mapOf("aggregate" to "trip"),
            )
        }
    }

    override fun existsByIdAndUserId(tripId: TripId, userId: UserId): Boolean =
        springRepo.existsByIdAndOwnerId(tripId.value, userId.value)

    private fun toEntity(trip: Trip): TripJpaEntity {
        val entity = TripJpaEntity(
            id = trip.id.value,
            ownerId = trip.userId.value,
            name = trip.name,
            startDate = trip.startDate,
            endDate = trip.endDate,
            visibility = trip.visibility.name,
            itineraryItems = trip.itineraryItems.toMutableList(),
            createdAt = trip.createdAt,
        )
        return entity
    }

    private fun recordDerivedAudit(before: Trip, after: Trip) {
        if (before.memberships != after.memberships) {
            auditEventWriter.record(
                action = "MEMBER_WRITE",
                entityType = "MEMBER",
                entityId = after.id.toString(),
                beforeState = before.memberships,
                afterState = after.memberships,
                metadata = mapOf("tripId" to after.id.toString()),
            )
        }

        if (before.invites != after.invites) {
            auditEventWriter.record(
                action = "INVITE_WRITE",
                entityType = "INVITE",
                entityId = after.id.toString(),
                beforeState = before.invites,
                afterState = after.invites,
                metadata = mapOf("tripId" to after.id.toString()),
            )
        }

        if (before.itineraryItems != after.itineraryItems) {
            auditEventWriter.record(
                action = "ITEM_WRITE",
                entityType = "ITEM",
                entityId = "${after.id}:itinerary",
                beforeState = before.itineraryItems,
                afterState = after.itineraryItems,
                metadata = mapOf("tripId" to after.id.toString()),
            )

            auditEventWriter.record(
                action = "DAY_WRITE",
                entityType = "DAY",
                entityId = after.id.toString(),
                beforeState = before.itineraryItems.groupBy { it.date.toString() },
                afterState = after.itineraryItems.groupBy { it.date.toString() },
                metadata = mapOf("tripId" to after.id.toString()),
            )

            auditEventWriter.record(
                action = "LIST_WRITE",
                entityType = "LIST",
                entityId = "${after.id}:places_to_visit",
                beforeState = before.itineraryItems,
                afterState = after.itineraryItems,
                metadata = mapOf(
                    "tripId" to after.id.toString(),
                    "listName" to "Places To Visit",
                    "note" to "Single-list itinerary baseline",
                ),
            )
        }
    }

    private fun toDomain(entity: TripJpaEntity): Trip {
        val ownerId = UserId(entity.ownerId)
        val persistedMemberships = membershipRepo.findByTripId(entity.id).map {
            TripMembership(
                userId = UserId(it.userId),
                role = TripRole.valueOf(it.role),
            )
        }
        val memberships = if (persistedMemberships.isEmpty()) {
            listOf(TripMembership(userId = ownerId, role = TripRole.OWNER))
        } else {
            persistedMemberships
        }

        val invites = inviteRepo.findByTripId(entity.id).map {
            TripInvite(
                email = it.email,
                role = TripRole.valueOf(it.role),
                status = InviteStatus.valueOf(it.status),
                createdAt = it.createdAt,
            )
        }

        return Trip(
            id = TripId(entity.id),
            userId = ownerId,
            name = entity.name,
            startDate = entity.startDate,
            endDate = entity.endDate,
            visibility = runCatching { TripVisibility.valueOf(entity.visibility) }
                .getOrDefault(TripVisibility.PRIVATE),
            memberships = memberships,
            invites = invites,
            itineraryItems = entity.itineraryItems.toList(),
            createdAt = entity.createdAt,
        )
    }
}
