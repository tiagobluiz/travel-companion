package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.trip.ItineraryV2Service
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.DayContainerResponse
import com.travelcompanion.interfaces.rest.dto.ItineraryItemV2Request
import com.travelcompanion.interfaces.rest.dto.ItineraryItemV2Response
import com.travelcompanion.interfaces.rest.dto.ItineraryV2Response
import com.travelcompanion.interfaces.rest.dto.ItemContainerResponse
import com.travelcompanion.interfaces.rest.dto.MoveItineraryItemV2Request
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for itinerary v2 operations within a trip.
 */
@RestController
@RequestMapping("/trips/{tripId}/itinerary")
class ItineraryController(
    private val itineraryV2Service: ItineraryV2Service,
) {
    @GetMapping("/v2")
    fun getV2(
        authentication: Authentication,
        @PathVariable tripId: String,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = itineraryV2Service.get(id, userId) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryV2Response(trip))
    }

    @PostMapping("/v2/items")
    fun addV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: ItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = itineraryV2Service.addItem(
            tripId = id,
            userId = userId,
            placeName = request.placeName,
            notes = request.notes ?: "",
            latitude = request.latitude,
            longitude = request.longitude,
            dayNumber = request.dayNumber,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.status(HttpStatus.CREATED).body(toItineraryV2Response(trip))
    }

    @PutMapping("/v2/items/{itemId}")
    fun updateV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
        @Valid @RequestBody request: ItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = itineraryV2Service.updateItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
            placeName = request.placeName,
            notes = request.notes ?: "",
            latitude = request.latitude,
            longitude = request.longitude,
            dayNumber = request.dayNumber,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryV2Response(trip))
    }

    @PostMapping("/v2/items/{itemId}/move")
    fun moveV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
        @Valid @RequestBody request: MoveItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = itineraryV2Service.moveItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
            targetDayNumber = request.targetDayNumber,
            beforeItemId = request.beforeItemId,
            afterItemId = request.afterItemId,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryV2Response(trip))
    }

    @DeleteMapping("/v2/items/{itemId}")
    fun removeV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
    ): ResponseEntity<Any> {
        val userId = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = itineraryV2Service.removeItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toItineraryV2Response(trip))
    }

    private fun requireUserId(authentication: Authentication): UserId? {
        val principal = authentication.principal as? String ?: return null
        return UserId.fromString(principal)
    }

    private fun toItineraryV2Response(trip: Trip): ItineraryV2Response {
        val days = trip.generatedDays().map { day ->
            DayContainerResponse(
                dayNumber = day.dayNumber,
                date = day.date.toString(),
                items = day.items.map { item ->
                    ItineraryItemV2Response(
                        id = item.id.toString(),
                        placeName = item.placeName,
                        notes = item.notes,
                        latitude = item.latitude,
                        longitude = item.longitude,
                        dayNumber = day.dayNumber,
                    )
                },
            )
        }

        val places = ItemContainerResponse(
            label = "Places To Visit",
            items = trip.placesToVisitItems().map { item ->
                ItineraryItemV2Response(
                    id = item.id.toString(),
                    placeName = item.placeName,
                    notes = item.notes,
                    latitude = item.latitude,
                    longitude = item.longitude,
                    dayNumber = null,
                )
            },
        )

        return ItineraryV2Response(
            days = days,
            placesToVisit = places,
        )
    }
}
