package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SpringDataTripInviteRepository : JpaRepository<TripInviteJpaEntity, UUID> {
    fun findByTripId(tripId: UUID): List<TripInviteJpaEntity>
    fun deleteByTripId(tripId: UUID)
}

