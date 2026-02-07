package com.travelcompanion.application.expense

import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of deleting an expense.
 *
 * Validates that the expense exists and the trip belongs to the user.
 */
@Service
class DeleteExpenseService(
    private val tripRepository: TripRepository,
    private val expenseRepository: ExpenseRepository,
) {

    /**
     * Deletes an expense.
     *
     * @param expenseId The expense ID
     * @param userId The requesting user (must own the trip)
     * @return true if deleted, false if not found/not owned
     */
    fun execute(expenseId: ExpenseId, userId: UserId): Boolean {
        val existing = expenseRepository.findById(expenseId) ?: return false
        if (!tripRepository.existsByIdAndUserId(existing.tripId, userId)) return false
        expenseRepository.deleteById(expenseId)
        return true
    }
}
