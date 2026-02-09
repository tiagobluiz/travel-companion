package com.travelcompanion.interfaces.rest.dto

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import java.time.LocalDate

/**
 * Request body for creating a trip.
 */
data class CreateTripRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate,
)

/**
 * Request body for updating a trip (all fields optional).
 */
data class UpdateTripRequest(
    val name: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
)

/**
 * Response DTO for a trip.
 */
data class TripResponse(
    val id: String,
    val name: String,
    val startDate: String,
    val endDate: String,
    val itineraryItems: List<ItineraryItemResponse>,
    val createdAt: String,
)

/**
 * Request body for adding/updating an itinerary item.
 *
 * Date and coordinates are required. Coordinates enable map display and route ordering.
 */
data class ItineraryItemRequest(
    @field:NotBlank(message = "Place name is required")
    val placeName: String,
    @field:NotBlank(message = "Date is required")
    @field:Pattern(
        regexp = "^\\d{4}-\\d{2}-\\d{2}$",
        message = "Date must use yyyy-MM-dd format",
    )
    val date: String,  // ISO date (yyyy-MM-dd)
    val notes: String? = null,
    @field:NotNull(message = "Latitude is required")
    @field:DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @field:DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    val latitude: Double,
    @field:NotNull(message = "Longitude is required")
    @field:DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @field:DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    val longitude: Double,
)

/**
 * Response DTO for an itinerary item.
 */
data class ItineraryItemResponse(
    val placeName: String,
    val date: String,
    val notes: String,
    val latitude: Double,
    val longitude: Double,
)
