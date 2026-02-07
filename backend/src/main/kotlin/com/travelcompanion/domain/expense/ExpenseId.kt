package com.travelcompanion.domain.expense

import java.util.UUID

/**
 * Unique identifier for an [Expense] entity.
 *
 * Wraps a UUID to provide type safety when referencing expenses.
 */
@JvmInline
value class ExpenseId(val value: UUID) {
    companion object {
        /**
         * Creates a new random [ExpenseId].
         */
        fun generate(): ExpenseId = ExpenseId(UUID.randomUUID())

        /**
         * Parses an [ExpenseId] from a string representation of a UUID.
         *
         * @param value The string UUID
         * @return The parsed ExpenseId, or null if invalid
         */
        fun fromString(value: String): ExpenseId? = runCatching { ExpenseId(UUID.fromString(value)) }.getOrNull()
    }

    override fun toString(): String = value.toString()
}
