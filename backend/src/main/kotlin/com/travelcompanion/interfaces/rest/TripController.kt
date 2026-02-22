package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.AccessResult
import com.travelcompanion.application.trip.ArchiveTripService
import com.travelcompanion.application.trip.CreateTripService
import com.travelcompanion.application.trip.DeleteTripService
import com.travelcompanion.application.trip.GetTripService
import com.travelcompanion.application.trip.GetTripsService
import com.travelcompanion.application.trip.RestoreTripService
import com.travelcompanion.application.trip.TripListStatusFilter
import com.travelcompanion.application.trip.UpdateTripService
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.interfaces.rest.dto.CreateTripRequest
import com.travelcompanion.interfaces.rest.dto.UpdateTripRequest
import com.travelcompanion.interfaces.rest.support.AuthPrincipalResolver
import com.travelcompanion.interfaces.rest.support.TripResponseMapper
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
import org.springframework.web.bind.annotation.RequestParam
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
    private val archiveTripService: ArchiveTripService,
    private val restoreTripService: RestoreTripService,
    private val authPrincipalResolver: AuthPrincipalResolver,
) {

    @PostMapping
    fun create(
        authentication: Authentication,
        @Valid @RequestBody request: CreateTripRequest,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val trip = createTripService.execute(
            userId = userId,
            name = request.name,
            startDate = request.startDate,
            endDate = request.endDate,
            visibility = request.visibility,
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(TripResponseMapper.toResponse(trip))
    }

    @GetMapping
    fun list(
        authentication: Authentication,
        @RequestParam(required = false) status: String?,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val statusFilter = status?.let {
            runCatching { TripListStatusFilter.valueOf(it.uppercase()) }.getOrNull()
                ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        } ?: TripListStatusFilter.ACTIVE
        val trips = getTripsService.execute(userId, statusFilter)
        return ResponseEntity.ok(trips.map { TripResponseMapper.toResponse(it) })
    }

    @GetMapping("/{id}")
    fun get(
        authentication: Authentication?,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = getTripService.execute(tripId, userId)) {
            is AccessResult.Success -> ResponseEntity.ok(TripResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            // Keep private-trip existence opaque to unauthorized callers.
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }

    @PutMapping("/{id}")
    fun update(
        authentication: Authentication,
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateTripRequest,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = updateTripService.execute(
            tripId = tripId,
            userId = userId,
            name = request.name,
            startDate = request.startDate,
            endDate = request.endDate,
            visibility = request.visibility,
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(TripResponseMapper.toResponse(trip))
    }

    @DeleteMapping("/{id}")
    fun delete(
        authentication: Authentication,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val deleted = deleteTripService.execute(tripId, userId)
        return if (deleted) ResponseEntity.noContent().build()
        else ResponseEntity.status(HttpStatus.NOT_FOUND).build()
    }

    @PostMapping("/{id}/archive")
    fun archive(
        authentication: Authentication,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = archiveTripService.execute(tripId, userId)) {
            is AccessResult.Success -> ResponseEntity.ok(TripResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }

    @PostMapping("/{id}/restore")
    fun restore(
        authentication: Authentication,
        @PathVariable id: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val tripId = TripId.fromString(id) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = restoreTripService.execute(tripId, userId)) {
            is AccessResult.Success -> ResponseEntity.ok(TripResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }
}
