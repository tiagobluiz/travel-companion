package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.trip.CreateTripService
import com.travelcompanion.application.trip.DeleteTripService
import com.travelcompanion.application.trip.GetTripService
import com.travelcompanion.application.trip.GetTripsService
import com.travelcompanion.application.trip.UpdateTripService
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.CreateTripRequest
import com.travelcompanion.interfaces.rest.dto.ItineraryItemResponse
import com.travelcompanion.interfaces.rest.dto.TripResponse
import com.travelcompanion.interfaces.rest.dto.UpdateTripRequest
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
 * REST controller for trip CRUD operations.
 *
 * Most endpoints require authentication. Users can only modify their own trips.
 * GET /{id} also supports anonymous access for public trips.
 */
@RestController
@RequestMapping("/trips")
class TripController(
    private val createTripService: CreateTripService,
    private val getTripsService: GetTripsService,
    private val getTripService: GetTripService,
    private val updateTripService: UpdateTripService,
    private val deleteTripService: DeleteTripService,
) {

    @PostMapping
    fun create(
        authentication: Authentication,
        @Valid @RequestBody request: CreateTripRequest,
    ): ResponseEntity<Any> {
        val userId = resolveUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val trip = createTripService.execute(
            userId = userId,
            name = request.name,
            startDate = request.startDate,
            endDate = request.endDate,
            visibility = request.visibility,
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(trip))
    }

    @GetMapping
    fun list(authentication: Authentication): ResponseEntity<Any> {
        val userId = resolveUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val trips = getTripsService.execute(userId)
        return ResponseEntity.ok(trips.map { toResponse(it) })
    }

    @GetMapping("/{id}")
    fun get(
        authentication: Authentication?,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = resolveUserId(authentication)
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = getTripService.execute(tripId, userId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toResponse(trip))
    }

    @PutMapping("/{id}")
    fun update(
        authentication: Authentication,
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateTripRequest,
    ): ResponseEntity<Any> {
        val userId = resolveUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = updateTripService.execute(
            tripId = tripId,
            userId = userId,
            name = request.name,
            startDate = request.startDate,
            endDate = request.endDate,
            visibility = request.visibility,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toResponse(trip))
    }

    @DeleteMapping("/{id}")
    fun delete(
        authentication: Authentication,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = resolveUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val deleted = deleteTripService.execute(tripId, userId)
        return if (deleted) ResponseEntity.noContent().build()
        else ResponseEntity.status(HttpStatus.NOT_FOUND).build()
    }

    private fun resolveUserId(authentication: Authentication?): UserId? {
        if (authentication == null) return null
        val principal = authentication.principal as? String ?: return null
        return UserId.fromString(principal)
    }

    private fun toResponse(trip: Trip) = TripResponse(
        id = trip.id.toString(),
        name = trip.name,
        startDate = trip.startDate.toString(),
        endDate = trip.endDate.toString(),
        visibility = trip.visibility.name,
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
