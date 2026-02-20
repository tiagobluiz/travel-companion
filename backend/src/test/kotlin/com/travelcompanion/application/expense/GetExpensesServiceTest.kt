package com.travelcompanion.application.expense

import com.travelcompanion.application.AccessResult
import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

class GetExpensesServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val expenseRepository = mock<ExpenseRepository>()
    private val service = GetExpensesService(tripRepository, expenseRepository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val viewerId = UserId.generate()
    private val outsiderId = UserId.generate()

    @Test
    fun `viewer can list expenses`() {
        val trip = createTrip()
        val expense = Expense(
            id = ExpenseId.generate(),
            tripId = tripId,
            userId = ownerId,
            amount = BigDecimal("10.00"),
            currency = "USD",
            date = LocalDate.of(2026, 1, 2),
            createdAt = Instant.now(),
        )
        whenever(tripRepository.findById(tripId)).thenReturn(trip)
        whenever(expenseRepository.findByTripId(tripId)).thenReturn(listOf(expense))

        val result = service.execute(tripId, viewerId)

        assertEquals(1, (result as AccessResult.Success).value.size)
    }

    @Test
    fun `outsider cannot list private trip expenses`() {
        whenever(tripRepository.findById(tripId)).thenReturn(createTrip())

        val result = service.execute(tripId, outsiderId)

        assertEquals(AccessResult.Forbidden, result)
        verify(expenseRepository, never()).findByTripId(tripId)
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 3),
        memberships = listOf(
            TripMembership(ownerId, TripRole.OWNER),
            TripMembership(viewerId, TripRole.VIEWER),
        ),
        createdAt = Instant.now(),
    )
}
