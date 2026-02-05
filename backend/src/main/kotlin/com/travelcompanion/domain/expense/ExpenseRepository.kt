package com.travelcompanion.domain.expense

import com.travelcompanion.domain.trip.TripId

/**
 * Port for persisting and retrieving [Expense] entities.
 *
 * This interface defines the contract for expense storage. Expenses are always
 * queried in the context of a trip.
 */
interface ExpenseRepository {
    /**
     * Saves an expense to persistence.
     *
     * @param expense The expense to save
     * @return The saved expense
     */
    fun save(expense: Expense): Expense

    /**
     * Finds an expense by its unique identifier.
     *
     * @param id The expense ID
     * @return The expense if found, null otherwise
     */
    fun findById(id: ExpenseId): Expense?

    /**
     * Finds all expenses for a given trip.
     *
     * @param tripId The trip ID
     * @return List of expenses (may be empty)
     */
    fun findByTripId(tripId: TripId): List<Expense>

    /**
     * Deletes an expense by ID.
     *
     * @param id The expense ID to delete
     */
    fun deleteById(id: ExpenseId)
}
