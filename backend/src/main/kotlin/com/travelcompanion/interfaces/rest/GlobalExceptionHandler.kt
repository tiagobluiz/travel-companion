package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.trip.TripCollaborationAccessDeniedException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.format.DateTimeParseException

@RestControllerAdvice
class GlobalExceptionHandler {

    data class ErrorResponse(val message: String)

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        val message = ex.message ?: "Invalid request"
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse(message))
    }

    @ExceptionHandler(TripCollaborationAccessDeniedException::class)
    fun handleTripCollaborationAccessDenied(ex: TripCollaborationAccessDeniedException): ResponseEntity<ErrorResponse> {
        val message = ex.message ?: "Forbidden"
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse(message))
    }

    @ExceptionHandler(DateTimeParseException::class)
    fun handleDateParse(ex: DateTimeParseException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse("Invalid date format. Use yyyy-MM-dd.")
        )
    }
}
