package com.travelcompanion.domain.user

import java.util.UUID

/**
 * Unique identifier for a [User] aggregate.
 *
 * Wraps a UUID to provide type safety and domain semantics when referencing users
 * across the application.
 */
@JvmInline
value class UserId(val value: UUID) {
    companion object {
        /**
         * Creates a new random [UserId].
         */
        fun generate(): UserId = UserId(UUID.randomUUID())

        /**
         * Parses a [UserId] from a string representation of a UUID.
         *
         * @param value The string UUID
         * @return The parsed UserId, or null if invalid
         */
        fun fromString(value: String): UserId? = runCatching { UserId(UUID.fromString(value)) }.getOrNull()
    }

    override fun toString(): String = value.toString()
}
