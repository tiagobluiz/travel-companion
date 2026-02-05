package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

/**
 * Spring Data JPA repository for [TripJpaEntity].
 *
 * Provides database access for trip persistence. Used by [JpaTripRepository]
 * to implement the domain [com.travelcompanion.domain.trip.TripRepository].
 */
interface SpringDataTripRepository : JpaRepository<TripJpaEntity, UUID> {

    fun findByUserIdOrderByCreatedAtDesc(userId: UUID): List<TripJpaEntity>

    fun existsByIdAndUserId(id: UUID, userId: UUID): Boolean
}
