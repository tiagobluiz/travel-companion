package com.travelcompanion.domain.expense

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

class ExpenseTest {

    @Test
    fun `creates expense when amount and currency are valid`() {
        val expense = Expense(
            id = ExpenseId.generate(),
            tripId = TripId.generate(),
            userId = UserId.generate(),
            amount = BigDecimal("0.00"),
            currency = "USD",
            description = "Taxi",
            date = LocalDate.of(2026, 1, 2),
            createdAt = Instant.parse("2026-01-01T00:00:00Z"),
        )

        assertEquals("USD", expense.currency)
        assertEquals(BigDecimal("0.00"), expense.amount)
    }

    @Test
    fun `throws when amount is negative`() {
        assertThrows<IllegalArgumentException> {
            Expense(
                id = ExpenseId.generate(),
                tripId = TripId.generate(),
                userId = UserId.generate(),
                amount = BigDecimal("-1.00"),
                currency = "USD",
                description = "Taxi",
                date = LocalDate.of(2026, 1, 2),
                createdAt = Instant.parse("2026-01-01T00:00:00Z"),
            )
        }
    }

    @Test
    fun `throws when currency is blank`() {
        assertThrows<IllegalArgumentException> {
            Expense(
                id = ExpenseId.generate(),
                tripId = TripId.generate(),
                userId = UserId.generate(),
                amount = BigDecimal("1.00"),
                currency = "   ",
                description = "Taxi",
                date = LocalDate.of(2026, 1, 2),
                createdAt = Instant.parse("2026-01-01T00:00:00Z"),
            )
        }
    }
}

