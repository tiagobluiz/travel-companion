package com.travelcompanion.domain.trip

import java.util.UUID

/**
 * Unique identifier for a [Trip] aggregate.
 *
 * Wraps a UUID to provide type safety when referencing trips across the application.
 */
@JvmInline
value class TripId(val value: UUID) {
    companion object {
        /**
         * Creates a new random [TripId].
         */
        fun generate(): TripId = TripId(UUID.randomUUID())

        /**
         * Parses a [TripId] from a string representation of a UUID.
         *
         * @param value The string UUID
         * @return The parsed TripId, or null if invalid
         */
        fun fromString(value: String): TripId? = runCatching { TripId(UUID.fromString(value)) }.getOrNull()
    }

    override fun toString(): String = value.toString()
}
