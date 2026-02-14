package com.travelcompanion.application.expense

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

class CreateExpenseServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val expenseRepository = mock<ExpenseRepository>()
    private val service = CreateExpenseService(tripRepository, expenseRepository)
    private val tripId = TripId.generate()
    private val ownerId = UserId.generate()
    private val editorId = UserId.generate()
    private val viewerId = UserId.generate()

    @Test
    fun `editor can create expense`() {
        whenever(tripRepository.findById(tripId)).thenReturn(createTrip())
        whenever(expenseRepository.save(any())).thenAnswer { it.arguments[0] as Expense }

        val result = service.execute(
            tripId = tripId,
            userId = editorId,
            amount = BigDecimal("10.00"),
            currency = "USD",
            date = LocalDate.of(2026, 1, 2),
        )

        assertNotNull(result)
        verify(expenseRepository).save(any())
    }

    @Test
    fun `viewer cannot create expense`() {
        whenever(tripRepository.findById(tripId)).thenReturn(createTrip())

        val result = service.execute(
            tripId = tripId,
            userId = viewerId,
            amount = BigDecimal("10.00"),
            currency = "USD",
            date = LocalDate.of(2026, 1, 2),
        )

        assertNull(result)
        verify(expenseRepository, never()).save(any())
    }

    private fun createTrip() = Trip(
        id = tripId,
        userId = ownerId,
        name = "Trip",
        startDate = LocalDate.of(2026, 1, 1),
        endDate = LocalDate.of(2026, 1, 3),
        memberships = listOf(
            TripMembership(ownerId, TripRole.OWNER),
            TripMembership(editorId, TripRole.EDITOR),
            TripMembership(viewerId, TripRole.VIEWER),
        ),
        createdAt = Instant.now(),
    )
}
