package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.AccessResult
import com.travelcompanion.application.trip.ItineraryV2Service
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.interfaces.rest.dto.ItineraryItemV2Request
import com.travelcompanion.interfaces.rest.dto.MoveItineraryItemV2Request
import com.travelcompanion.interfaces.rest.support.AuthPrincipalResolver
import com.travelcompanion.interfaces.rest.support.ItineraryResponseMapper
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
    private val authPrincipalResolver: AuthPrincipalResolver,
) {
    @GetMapping("/v2")
    fun getV2(
        authentication: Authentication,
        @PathVariable tripId: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = itineraryV2Service.get(id, userId)) {
            is AccessResult.Success -> ResponseEntity.ok(ItineraryResponseMapper.toV2Response(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PostMapping("/v2/items")
    fun addV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: ItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = itineraryV2Service.addItem(
            tripId = id,
            userId = userId,
            placeName = request.placeName,
            notes = request.notes ?: "",
            latitude = request.latitude,
            longitude = request.longitude,
            dayNumber = request.dayNumber,
        )) {
            is AccessResult.Success -> ResponseEntity.status(HttpStatus.CREATED).body(
                ItineraryResponseMapper.toV2Response(result.value)
            )
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PutMapping("/v2/items/{itemId}")
    fun updateV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
        @Valid @RequestBody request: ItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = itineraryV2Service.updateItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
            placeName = request.placeName,
            notes = request.notes ?: "",
            latitude = request.latitude,
            longitude = request.longitude,
            dayNumber = request.dayNumber,
        )) {
            is AccessResult.Success -> ResponseEntity.ok(ItineraryResponseMapper.toV2Response(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PostMapping("/v2/items/{itemId}/move")
    fun moveV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
        @Valid @RequestBody request: MoveItineraryItemV2Request,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = itineraryV2Service.moveItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
            targetDayNumber = request.targetDayNumber,
            beforeItemId = request.beforeItemId,
            afterItemId = request.afterItemId,
        )) {
            is AccessResult.Success -> ResponseEntity.ok(ItineraryResponseMapper.toV2Response(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @DeleteMapping("/v2/items/{itemId}")
    fun removeV2Item(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable itemId: String,
    ): ResponseEntity<Any> {
        val userId = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = itineraryV2Service.removeItem(
            tripId = id,
            userId = userId,
            itemId = itemId,
        )) {
            is AccessResult.Success -> ResponseEntity.ok(ItineraryResponseMapper.toV2Response(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }
}
