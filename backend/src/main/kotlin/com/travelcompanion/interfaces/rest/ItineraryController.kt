package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.trip.AddItineraryItemService
import com.travelcompanion.application.trip.RemoveItineraryItemService
import com.travelcompanion.application.trip.UpdateItineraryItemService
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.ItineraryItemRequest
import com.travelcompanion.interfaces.rest.dto.ItineraryItemResponse
import com.travelcompanion.interfaces.rest.dto.TripResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

/**
 * REST controller for itinerary operations within a trip.
 *
 * Manages add/update/remove of itinerary items. All endpoints require authentication.
 */
@RestController
@RequestMapping("/trips/{tripId}/itinerary")
class ItineraryController(
    private val addItineraryItemService: AddItineraryItemService,
    private val updateItineraryItemService: UpdateItineraryItemService,
    private val removeItineraryItemService: RemoveItineraryItemService,
) {

    @PostMapping
    fun add(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: ItineraryItemRequest,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val date = LocalDate.parse(request.date)
        val trip = addItineraryItemService.execute(
            id, userId, request.placeName, date, request.notes ?: "",
            latitude = request.latitude, longitude = request.longitude,
        )
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.status(HttpStatus.CREATED).body(toItineraryResponse(trip))
    }

    @PutMapping("/{index}")
    fun update(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable index: Int,
        @Valid @RequestBody request: ItineraryItemRequest,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val date = LocalDate.parse(request.date)
        val trip = updateItineraryItemService.execute(
            id, userId, index, request.placeName, date, request.notes ?: "",
            latitude = request.latitude, longitude = request.longitude,
        )
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryResponse(trip))
    }

    @DeleteMapping("/{index}")
    fun remove(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable index: Int,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = removeItineraryItemService.execute(id, userId, index)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryResponse(trip))
    }

    private fun requireUserId(authentication: Authentication): UserId? {
        val principal = authentication.principal as? String ?: return null
        return UserId.fromString(principal)
    }

    private fun toItineraryResponse(trip: com.travelcompanion.domain.trip.Trip) = TripResponse(
        id = trip.id.toString(),
        name = trip.name,
        startDate = trip.startDate.toString(),
        endDate = trip.endDate.toString(),
        itineraryItems = trip.itineraryItems.map {
            ItineraryItemResponse(
                placeName = it.placeName,
                date = it.date.toString(),
                notes = it.notes,
                latitude = it.latitude,
                longitude = it.longitude,
            )
        },
        createdAt = trip.createdAt.toString(),
    )
}
