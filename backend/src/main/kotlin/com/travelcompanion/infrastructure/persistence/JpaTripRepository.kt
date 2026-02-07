package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Repository

/**
 * JPA implementation of [TripRepository].
 *
 * Maps between domain [Trip] and [TripJpaEntity], delegating persistence
 * to [SpringDataTripRepository].
 */
@Repository
class JpaTripRepository(
    private val springRepo: SpringDataTripRepository,
) : TripRepository {

    override fun save(trip: Trip): Trip {
        val entity = toEntity(trip)
        val saved = springRepo.save(entity)
        return toDomain(saved)
    }

    override fun findById(id: TripId): Trip? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

    override fun findByUserId(userId: UserId): List<Trip> =
        springRepo.findByUserIdOrderByCreatedAtDesc(userId.value).map { toDomain(it) }

    override fun deleteById(id: TripId) {
        springRepo.deleteById(id.value)
    }

    override fun existsByIdAndUserId(tripId: TripId, userId: UserId): Boolean =
        springRepo.existsByIdAndUserId(tripId.value, userId.value)

    private fun toEntity(trip: Trip): TripJpaEntity {
        val entity = TripJpaEntity(
            id = trip.id.value,
            userId = trip.userId.value,
            name = trip.name,
            startDate = trip.startDate,
            endDate = trip.endDate,
            itineraryItems = trip.itineraryItems.toMutableList(),
            createdAt = trip.createdAt,
        )
        return entity
    }

    private fun toDomain(entity: TripJpaEntity) = Trip(
        id = TripId(entity.id),
        userId = UserId(entity.userId),
        name = entity.name,
        startDate = entity.startDate,
        endDate = entity.endDate,
        itineraryItems = entity.itineraryItems.toList(),
        createdAt = entity.createdAt,
    )
}
