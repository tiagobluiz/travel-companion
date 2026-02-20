package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.AccessResult
import com.travelcompanion.application.expense.CreateExpenseService
import com.travelcompanion.application.expense.DeleteExpenseService
import com.travelcompanion.application.expense.GetExpensesService
import com.travelcompanion.application.expense.UpdateExpenseService
import com.travelcompanion.domain.expense.ExpenseId
import com.travelcompanion.domain.expense.ExpenseRepository
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.CreateExpenseRequest
import com.travelcompanion.interfaces.rest.dto.ExpenseResponse
import com.travelcompanion.interfaces.rest.dto.UpdateExpenseRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for expense operations within a trip.
 *
 * All endpoints require authentication. Users can only access expenses for their own trips.
 */
@RestController
@RequestMapping("/trips/{tripId}/expenses")
class ExpenseController(
    private val createExpenseService: CreateExpenseService,
    private val getExpensesService: GetExpensesService,
    private val updateExpenseService: UpdateExpenseService,
    private val deleteExpenseService: DeleteExpenseService,
    private val expenseRepository: ExpenseRepository,
) {

    @PostMapping
    fun create(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: CreateExpenseRequest,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripIdUuid = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val expense = createExpenseService.execute(
            tripId = tripIdUuid,
            userId = userId,
            amount = request.amount,
            currency = request.currency,
            description = request.description ?: "",
            date = request.date,
        )
        return when (expense) {
            is AccessResult.Success -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(expense.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @GetMapping
    fun list(
        authentication: Authentication,
        @PathVariable tripId: String,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripIdUuid = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val expenses = getExpensesService.execute(tripIdUuid, userId)) {
            is AccessResult.Success -> ResponseEntity.ok(expenses.value.map { toResponse(it) })
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PutMapping("/{expenseId}")
    fun update(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable expenseId: String,
        @Valid @RequestBody request: UpdateExpenseRequest,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripIdUuid = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val expenseIdUuid = ExpenseId.fromString(expenseId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val existingExpense = expenseRepository.findById(expenseIdUuid) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        if (existingExpense.tripId != tripIdUuid) return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return when (val expense = updateExpenseService.execute(
            expenseId = expenseIdUuid,
            userId = userId,
            amount = request.amount,
            currency = request.currency,
            description = request.description,
            date = request.date,
        )) {
            is AccessResult.Success -> ResponseEntity.ok(toResponse(expense.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @DeleteMapping("/{expenseId}")
    fun delete(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable expenseId: String,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripIdUuid = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val expenseIdUuid = ExpenseId.fromString(expenseId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val existingExpense = expenseRepository.findById(expenseIdUuid) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        if (existingExpense.tripId != tripIdUuid) return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return when (deleteExpenseService.execute(expenseIdUuid, userId)) {
            is AccessResult.Success -> ResponseEntity.noContent().build()
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    private fun requireUserId(authentication: Authentication): UserId? {
        val principal = authentication.principal as? String ?: return null
        return UserId.fromString(principal)
    }

    private fun toResponse(expense: com.travelcompanion.domain.expense.Expense) = ExpenseResponse(
        id = expense.id.toString(),
        tripId = expense.tripId.toString(),
        amount = expense.amount.toPlainString(),
        currency = expense.currency,
        description = expense.description,
        date = expense.date.toString(),
        createdAt = expense.createdAt.toString(),
    )
}
