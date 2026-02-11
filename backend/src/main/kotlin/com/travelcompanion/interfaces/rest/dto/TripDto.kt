package com.travelcompanion.interfaces.rest.dto

import com.travelcompanion.domain.trip.TripVisibility
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
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

    val visibility: TripVisibility = TripVisibility.PRIVATE,
)

/**
 * Request body for updating a trip (all fields optional).
 */
data class UpdateTripRequest(
    val name: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val visibility: TripVisibility? = null,
)

/**
 * Response DTO for a trip.
 */
data class TripResponse(
    val id: String,
    val name: String,
    val startDate: String,
    val endDate: String,
    val visibility: String,
    val itineraryItems: List<ItineraryItemResponse>,
    val createdAt: String,
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

data class ItineraryV2Response(
    val days: List<DayContainerResponse>,
    val placesToVisit: ItemContainerResponse,
)

data class DayContainerResponse(
    val dayNumber: Int,
    val date: String,
    val items: List<ItineraryItemV2Response>,
)

data class ItemContainerResponse(
    val label: String,
    val items: List<ItineraryItemV2Response>,
)

data class ItineraryItemV2Response(
    val id: String,
    val placeName: String,
    val notes: String,
    val latitude: Double,
    val longitude: Double,
    val dayNumber: Int?,
)

data class ItineraryItemV2Request(
    @field:NotBlank(message = "Place name is required")
    val placeName: String,
    val notes: String? = null,
    @field:NotNull(message = "Latitude is required")
    @field:DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @field:DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    val latitude: Double,
    @field:NotNull(message = "Longitude is required")
    @field:DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @field:DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    val longitude: Double,
    val dayNumber: Int? = null,
)

data class MoveItineraryItemV2Request(
    val targetDayNumber: Int? = null,
    val beforeItemId: String? = null,
    val afterItemId: String? = null,
)
