package com.travelcompanion.application.expense

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of listing expenses for a trip.
 *
 * Validates that the trip exists and belongs to the user before returning expenses.
 */
@Service
class GetExpensesService(
    private val tripRepository: TripRepository,
    private val expenseRepository: ExpenseRepository,
) {

    /**
     * Returns all expenses for the trip.
     *
     * @param tripId The trip ID
     * @param userId The requesting user (must own the trip)
     * @return List of expenses, or null if trip not found/not owned
     */
    fun execute(tripId: TripId, userId: UserId): List<Expense>? {
        if (!tripRepository.existsByIdAndUserId(tripId, userId)) return null
        return expenseRepository.findByTripId(tripId)
    }
}
