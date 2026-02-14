package com.travelcompanion.application.expense

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

/**
 * Handles the use case of creating an expense for a trip.
 *
 * Validates that the trip exists and the user has write access before adding the expense.
 */
@Service
class CreateExpenseService(
    private val tripRepository: TripRepository,
    private val expenseRepository: ExpenseRepository,
) {

    /**
     * Creates a new expense for the trip.
     *
     * @param tripId The trip ID
     * @param userId The user creating the expense (must have write access: OWNER or EDITOR)
     * @param amount The expense amount
     * @param currency The currency code (e.g., USD)
     * @param description Optional description
     * @param date The expense date
     * @return The created expense, or null if trip is not found or trip.canWrite(userId) is false
     */
    fun execute(
        tripId: TripId,
        userId: UserId,
        amount: BigDecimal,
        currency: String,
        description: String = "",
        date: LocalDate,
    ): Expense? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!trip.canWrite(userId)) return null
        require(!date.isBefore(trip.startDate) && !date.isAfter(trip.endDate)) {
            "Expense date must be within trip date range (${trip.startDate} - ${trip.endDate})"
        }

        val expense = Expense(
            id = ExpenseId.generate(),
            tripId = tripId,
            userId = userId,
            amount = amount,
            currency = currency.trim().uppercase(),
            description = description.trim(),
            date = date,
            createdAt = Instant.now(),
        )
        return expenseRepository.save(expense)
    }
}
