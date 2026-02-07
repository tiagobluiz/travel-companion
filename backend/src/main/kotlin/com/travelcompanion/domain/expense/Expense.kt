package com.travelcompanion.domain.expense

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

/**
 * Represents an expense incurred during a trip.
 *
 * An Expense is associated with a trip and the user who created it. It tracks the amount,
 * currency, optional description, and the date of the expense. For MVP, we use a single
 * currency per expense.
 */
data class Expense(
    val id: ExpenseId,
    val tripId: TripId,
    val userId: UserId,
    val amount: BigDecimal,
    val currency: String,
    val description: String = "",
    val date: LocalDate,
    val createdAt: Instant,
) {
    init {
        require(amount >= BigDecimal.ZERO) { "Amount cannot be negative" }
        require(currency.isNotBlank()) { "Currency cannot be blank" }
    }
}
