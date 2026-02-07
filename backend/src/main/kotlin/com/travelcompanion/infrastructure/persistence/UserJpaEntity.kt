package com.travelcompanion.infrastructure.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * JPA entity mapping for [com.travelcompanion.domain.user.User].
 *
 * Persists user accounts with email, bcrypt-hashed password, and display name.
 * The id, email, and created_at are immutable after creation.
 */
@Entity
@Table(name = "users")
class UserJpaEntity(
    @Id
    @Column(name = "id", updatable = false)
    val id: UUID,

    @Column(name = "email", nullable = false, unique = true)
    var email: String,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant,
)
