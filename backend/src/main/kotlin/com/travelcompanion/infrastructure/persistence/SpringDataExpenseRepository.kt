package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

/**
 * Spring Data JPA repository for [ExpenseJpaEntity].
 *
 * Provides database access for expense persistence. Used by [JpaExpenseRepository]
 * to implement the domain [com.travelcompanion.domain.expense.ExpenseRepository].
 */
interface SpringDataExpenseRepository : JpaRepository<ExpenseJpaEntity, UUID> {

    fun findByTripId(tripId: UUID): List<ExpenseJpaEntity>
}
