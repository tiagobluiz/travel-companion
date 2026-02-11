package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.springframework.stereotype.Repository

/**
 * JPA implementation of [ExpenseRepository].
 *
 * Maps between domain [Expense] and [ExpenseJpaEntity], delegating persistence
 * to [SpringDataExpenseRepository].
 */
@Repository
class JpaExpenseRepository(
    private val springRepo: SpringDataExpenseRepository,
    private val auditEventWriter: AuditEventWriter,
) : ExpenseRepository {

    override fun save(expense: Expense): Expense {
        val existing = springRepo.findById(expense.id.value).orElse(null)?.let { toDomain(it) }
        val entity = toEntity(expense)
        val saved = springRepo.save(entity)
        val savedDomain = toDomain(saved)

        auditEventWriter.record(
            action = if (existing == null) "EXPENSE_CREATED" else "EXPENSE_UPDATED",
            entityType = "EXPENSE",
            entityId = savedDomain.id.toString(),
            beforeState = existing,
            afterState = savedDomain,
            metadata = mapOf(
                "tripId" to savedDomain.tripId.toString(),
                "currency" to savedDomain.currency,
            ),
        )

        return savedDomain
    }

    override fun findById(id: ExpenseId): Expense? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

    override fun findByTripId(tripId: TripId): List<Expense> =
        springRepo.findByTripId(tripId.value).map { toDomain(it) }

    override fun deleteById(id: ExpenseId) {
        val existing = findById(id)
        springRepo.deleteById(id.value)
        if (existing != null) {
            auditEventWriter.record(
                action = "EXPENSE_DELETED",
                entityType = "EXPENSE",
                entityId = existing.id.toString(),
                beforeState = existing,
                metadata = mapOf(
                    "tripId" to existing.tripId.toString(),
                    "currency" to existing.currency,
                ),
            )
        }
    }

    private fun toEntity(expense: Expense) = ExpenseJpaEntity(
        id = expense.id.value,
        tripId = expense.tripId.value,
        userId = expense.userId.value,
        amount = expense.amount,
        currency = expense.currency,
        description = expense.description,
        date = expense.date,
        createdAt = expense.createdAt,
    )

    private fun toDomain(entity: ExpenseJpaEntity) = Expense(
        id = ExpenseId(entity.id),
        tripId = TripId(entity.tripId),
        userId = com.travelcompanion.domain.user.UserId(entity.userId),
        amount = entity.amount,
        currency = entity.currency,
        description = entity.description,
        date = entity.date,
        createdAt = entity.createdAt,
    )
}
