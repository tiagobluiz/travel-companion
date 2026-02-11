package com.travelcompanion.infrastructure.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "trip_memberships")
@IdClass(TripMembershipJpaKey::class)
class TripMembershipJpaEntity(
    @Id
    @Column(name = "trip_id", nullable = false, updatable = false)
    val tripId: UUID,

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "role", nullable = false)
    val role: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant,
)

data class TripMembershipJpaKey(
    val tripId: UUID = UUID.randomUUID(),
    val userId: UUID = UUID.randomUUID(),
) : Serializable

