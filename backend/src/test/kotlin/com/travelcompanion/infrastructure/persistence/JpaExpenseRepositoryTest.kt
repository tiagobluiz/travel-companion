package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.Optional

class JpaExpenseRepositoryTest {

    private val springRepo = mock<SpringDataExpenseRepository>()
    private val auditEventWriter = mock<AuditEventWriter>()
    private val repository = JpaExpenseRepository(springRepo, auditEventWriter)

    @Test
    fun `save writes create audit when entity does not exist`() {
        val expense = expense()
        whenever(springRepo.findById(expense.id.value)).thenReturn(Optional.empty())
        whenever(springRepo.save(any<ExpenseJpaEntity>())).thenAnswer { it.arguments[0] as ExpenseJpaEntity }

        val saved = repository.save(expense)

        assertEquals(expense, saved)
        verify(auditEventWriter).record(
            action = eq("EXPENSE_CREATED"),
            entityType = eq("EXPENSE"),
            entityId = eq(expense.id.toString()),
            beforeState = eq(null),
            afterState = eq(saved),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `save writes update audit when entity already exists`() {
        val expense = expense()
        val existingEntity = ExpenseJpaEntity(
            id = expense.id.value,
            tripId = expense.tripId.value,
            userId = expense.userId.value,
            amount = BigDecimal("10.00"),
            currency = "USD",
            description = "old",
            date = expense.date.minusDays(1),
            createdAt = expense.createdAt.minusSeconds(60),
        )
        whenever(springRepo.findById(expense.id.value)).thenReturn(Optional.of(existingEntity))
        whenever(springRepo.save(any<ExpenseJpaEntity>())).thenAnswer { it.arguments[0] as ExpenseJpaEntity }

        repository.save(expense)

        verify(auditEventWriter).record(
            action = eq("EXPENSE_UPDATED"),
            entityType = eq("EXPENSE"),
            entityId = eq(expense.id.toString()),
            beforeState = any<Expense>(),
            afterState = any<Expense>(),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `deleteById records delete audit only when expense exists`() {
        val expense = expense()
        val existingEntity = ExpenseJpaEntity(
            id = expense.id.value,
            tripId = expense.tripId.value,
            userId = expense.userId.value,
            amount = expense.amount,
            currency = expense.currency,
            description = expense.description,
            date = expense.date,
            createdAt = expense.createdAt,
        )
        whenever(springRepo.findById(expense.id.value)).thenReturn(Optional.of(existingEntity))

        repository.deleteById(expense.id)

        verify(springRepo).deleteById(expense.id.value)
        verify(auditEventWriter).record(
            action = eq("EXPENSE_DELETED"),
            entityType = eq("EXPENSE"),
            entityId = eq(expense.id.toString()),
            beforeState = eq(expense),
            afterState = eq(null),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `deleteById skips delete audit when expense does not exist`() {
        val id = ExpenseId.generate()
        whenever(springRepo.findById(id.value)).thenReturn(Optional.empty())

        repository.deleteById(id)

        verify(springRepo).deleteById(id.value)
        verify(auditEventWriter, never()).record(
            action = eq("EXPENSE_DELETED"),
            entityType = eq("EXPENSE"),
            entityId = any(),
            beforeState = any(),
            afterState = any(),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `findById returns null when not found`() {
        val id = ExpenseId.generate()
        whenever(springRepo.findById(id.value)).thenReturn(Optional.empty())

        val found = repository.findById(id)

        assertNull(found)
    }

    private fun expense() = Expense(
        id = ExpenseId.generate(),
        tripId = TripId.generate(),
        userId = UserId.generate(),
        amount = BigDecimal("42.50"),
        currency = "USD",
        description = "Lunch",
        date = LocalDate.of(2026, 1, 2),
        createdAt = Instant.parse("2026-01-01T00:00:00Z"),
    )
}

