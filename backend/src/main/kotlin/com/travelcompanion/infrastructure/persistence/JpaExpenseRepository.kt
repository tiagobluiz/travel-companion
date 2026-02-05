package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.expense.Expense
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripId
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
) : ExpenseRepository {

    override fun save(expense: Expense): Expense {
        val entity = toEntity(expense)
        val saved = springRepo.save(entity)
        return toDomain(saved)
    }

    override fun findById(id: ExpenseId): Expense? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

    override fun findByTripId(tripId: TripId): List<Expense> =
        springRepo.findByTripId(tripId.value).map { toDomain(it) }

    override fun deleteById(id: ExpenseId) {
        springRepo.deleteById(id.value)
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
