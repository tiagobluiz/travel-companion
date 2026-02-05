package com.travelcompanion.infrastructure.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * JPA entity mapping for [com.travelcompanion.domain.expense.Expense].
 *
 * Persists expenses with amount, currency, description, and date.
 */
@Entity
@Table(name = "expenses")
class ExpenseJpaEntity(
    @Id
    @Column(name = "id", updatable = false)
    val id: UUID,

    @Column(name = "trip_id", nullable = false, updatable = false)
    val tripId: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    var amount: BigDecimal,

    @Column(name = "currency", nullable = false, length = 3)
    var currency: String,

    @Column(name = "description", length = 1000)
    var description: String = "",

    @Column(name = "date", nullable = false)
    var date: LocalDate,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant,
)
