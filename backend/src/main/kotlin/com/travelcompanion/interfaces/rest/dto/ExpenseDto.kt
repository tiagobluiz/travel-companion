package com.travelcompanion.interfaces.rest.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Request body for creating an expense.
 */
data class CreateExpenseRequest(
    @field:NotNull(message = "Amount is required")
    @field:DecimalMin(value = "0", message = "Amount must be >= 0")
    val amount: BigDecimal,

    @field:NotBlank(message = "Currency is required")
    val currency: String,

    val description: String? = null,

    @field:NotNull(message = "Date is required")
    val date: LocalDate,
)

/**
 * Request body for updating an expense (all fields optional).
 */
data class UpdateExpenseRequest(
    val amount: BigDecimal? = null,
    val currency: String? = null,
    val description: String? = null,
    val date: LocalDate? = null,
)

/**
 * Response DTO for an expense.
 */
data class ExpenseResponse(
    val id: String,
    val tripId: String,
    val amount: String,
    val currency: String,
    val description: String,
    val date: String,
    val createdAt: String,
)
