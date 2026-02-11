package com.travelcompanion.infrastructure.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "trip_invites")
class TripInviteJpaEntity(
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    val id: UUID,

    @Column(name = "trip_id", nullable = false, updatable = false)
    val tripId: UUID,

    @Column(name = "email", nullable = false)
    val email: String,

    @Column(name = "role", nullable = false)
    val role: String,

    @Column(name = "status", nullable = false)
    val status: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant,
)

