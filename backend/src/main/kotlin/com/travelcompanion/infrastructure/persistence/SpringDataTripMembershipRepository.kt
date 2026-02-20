package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SpringDataTripMembershipRepository : JpaRepository<TripMembershipJpaEntity, TripMembershipJpaKey> {
    fun findByTripId(tripId: UUID): List<TripMembershipJpaEntity>
    fun findByTripIdIn(tripIds: Collection<UUID>): List<TripMembershipJpaEntity>
    fun deleteByTripId(tripId: UUID)
}

