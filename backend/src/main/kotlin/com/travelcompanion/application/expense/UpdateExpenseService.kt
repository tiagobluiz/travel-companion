package com.travelcompanion.application.expense

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Handles the use case of updating an expense.
 *
 * Validates that the expense exists and the trip belongs to the user.
 */
@Service
class UpdateExpenseService(
    private val tripRepository: TripRepository,
    private val expenseRepository: ExpenseRepository,
) {

    /**
     * Updates an expense.
     *
     * @param expenseId The expense ID
     * @param userId The requesting user (must own the trip)
     * @param amount New amount (optional)
     * @param currency New currency (optional)
     * @param description New description (optional)
     * @param date New date (optional)
     * @return The updated expense, or null if not found/not owned
     */
    fun execute(
        expenseId: ExpenseId,
        userId: UserId,
        amount: BigDecimal?,
        currency: String?,
        description: String?,
        date: LocalDate?,
    ): Expense? {
        val existing = expenseRepository.findById(expenseId) ?: return null
        val trip = tripRepository.findById(existing.tripId) ?: return null
        if (!canWriteExpenses(trip, userId)) return null
        if (date != null) {
            require(!date.isBefore(trip.startDate) && !date.isAfter(trip.endDate)) {
                "Expense date must be within trip date range (${trip.startDate} - ${trip.endDate})"
            }
        }

        val updated = existing.copy(
            amount = amount ?: existing.amount,
            currency = (currency ?: existing.currency).trim().uppercase(),
            description = description?.trim() ?: existing.description,
            date = date ?: existing.date,
        )
        return expenseRepository.save(updated)
    }

    private fun canWriteExpenses(trip: Trip, userId: UserId): Boolean =
        trip.hasRole(userId, TripRole.OWNER) || trip.hasRole(userId, TripRole.EDITOR)
}
