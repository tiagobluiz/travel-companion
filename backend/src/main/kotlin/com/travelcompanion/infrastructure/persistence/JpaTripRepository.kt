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
        val existingEntity = springRepo.findById(trip.id.value).orElse(null)
        val existingMemberships = existingEntity?.let { membershipRepo.findByTripId(it.id) } ?: emptyList()
        val existingInvites = existingEntity?.let { inviteRepo.findByTripId(it.id) } ?: emptyList()
        val existing = existingEntity?.let { toDomain(it, existingMemberships, existingInvites) }
        val entity = toEntity(trip)
        val saved = springRepo.save(entity)

        val savedMembershipEntities = syncMemberships(saved.id, trip.memberships)
        val savedInviteEntities = syncInvites(saved.id, trip.invites)
        val savedDomain = toDomain(saved, savedMembershipEntities, savedInviteEntities)

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
        springRepo.findById(id.value).orElse(null)?.let { entity ->
            toDomain(
                entity = entity,
                membershipEntities = membershipRepo.findByTripId(entity.id),
                inviteEntities = inviteRepo.findByTripId(entity.id),
            )
        }

    override fun findByUserId(userId: UserId): List<Trip> =
        hydrateTrips(springRepo.findAccessibleByUserIdOrderByCreatedAtDesc(userId.value))

    override fun findByInviteEmail(email: String): List<Trip> =
        hydrateTrips(springRepo.findByInviteEmailIgnoreCase(email.trim()))

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

    private fun hydrateTrips(entities: List<TripJpaEntity>): List<Trip> {
        if (entities.isEmpty()) return emptyList()
        val tripIds = entities.map { it.id }
        val membershipsByTripId = membershipRepo.findByTripIdIn(tripIds).groupBy { it.tripId }
        val invitesByTripId = inviteRepo.findByTripIdIn(tripIds).groupBy { it.tripId }
        return entities.map { entity ->
            toDomain(
                entity = entity,
                membershipEntities = membershipsByTripId[entity.id].orEmpty(),
                inviteEntities = invitesByTripId[entity.id].orEmpty(),
            )
        }
    }

    private fun syncMemberships(
        tripId: UUID,
        desiredMemberships: List<TripMembership>,
    ): List<TripMembershipJpaEntity> {
        val existing = membershipRepo.findByTripId(tripId)
        val existingByUserId = existing.associateBy { it.userId }
        val desiredUserIds = desiredMemberships.map { it.userId.value }.toSet()
        val stale = existing.filter { it.userId !in desiredUserIds }
        if (stale.isNotEmpty()) membershipRepo.deleteAll(stale)

        val synced = desiredMemberships.map { desired ->
            val persisted = existingByUserId[desired.userId.value]
            TripMembershipJpaEntity(
                tripId = tripId,
                userId = desired.userId.value,
                role = desired.role.name,
                createdAt = persisted?.createdAt ?: Instant.now(),
            )
        }
        return membershipRepo.saveAll(synced)
    }

    private fun syncInvites(
        tripId: UUID,
        desiredInvites: List<TripInvite>,
    ): List<TripInviteJpaEntity> {
        val existing = inviteRepo.findByTripId(tripId)
        val existingByEmail = existing.associateBy { normalizeEmail(it.email) }
        val desiredEmails = desiredInvites.map { normalizeEmail(it.email) }.toSet()
        val stale = existing.filter { normalizeEmail(it.email) !in desiredEmails }
        if (stale.isNotEmpty()) inviteRepo.deleteAll(stale)

        val synced = desiredInvites.map { desired ->
            val persisted = existingByEmail[normalizeEmail(desired.email)]
            TripInviteJpaEntity(
                id = persisted?.id ?: UUID.randomUUID(),
                tripId = tripId,
                email = normalizeEmail(desired.email),
                role = desired.role.name,
                status = desired.status.name,
                createdAt = persisted?.createdAt ?: desired.createdAt,
            )
        }
        return inviteRepo.saveAll(synced)
    }

    private fun toDomain(
        entity: TripJpaEntity,
        membershipEntities: List<TripMembershipJpaEntity>,
        inviteEntities: List<TripInviteJpaEntity>,
    ): Trip {
        val ownerId = UserId(entity.ownerId)
        val persistedMemberships = membershipEntities.map {
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

        val invites = inviteEntities.map {
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

    private fun normalizeEmail(email: String): String = email.trim().lowercase()
}
