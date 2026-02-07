package com.travelcompanion.domain.user

import java.time.Instant

/**
 * Represents a user of the Travel Companion application.
 *
 * User is the aggregate root for authentication and ownership. Each user owns trips
 * and can create expenses within those trips. The aggregate holds the email (used as
 * login identifier), display name, and hashed password for authentication.
 */
data class User(
    val id: UserId,
    val email: String,
    val passwordHash: String,
    val displayName: String,
    val createdAt: Instant,
) {
    init {
        require(email.isNotBlank()) { "Email cannot be blank" }
        require(displayName.isNotBlank()) { "Display name cannot be blank" }
        require(passwordHash.isNotBlank()) { "Password hash cannot be blank" }
    }
}
