package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.AccessResult
import com.travelcompanion.application.trip.ManageTripMembershipService
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.ChangeRoleRequest
import com.travelcompanion.interfaces.rest.dto.InviteMemberRequest
import com.travelcompanion.interfaces.rest.dto.InviteResponseRequest
import com.travelcompanion.interfaces.rest.support.AuthPrincipalResolver
import com.travelcompanion.interfaces.rest.support.CollaboratorResponseMapper
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/trips/{tripId}")
class TripCollaboratorController(
    private val manageTripMembershipService: ManageTripMembershipService,
    private val authPrincipalResolver: AuthPrincipalResolver,
) {

    @GetMapping("/collaborators")
    fun getCollaborators(
        authentication: Authentication,
        @PathVariable tripId: String,
    ): ResponseEntity<Any> {
        val requester = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.getCollaborators(id, requester)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PostMapping("/invites")
    fun invite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: InviteMemberRequest,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.inviteMember(id, actor, request.email, request.role)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PostMapping("/invites/respond")
    fun respondInvite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: InviteResponseRequest,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.respondToInvite(id, actor, request.accept)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @DeleteMapping("/invites")
    fun removePendingOrDeclinedInvite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam email: String,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.removePendingOrDeclinedInvite(id, actor, email)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PatchMapping("/members/{memberId}/role")
    fun changeMemberRole(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable memberId: String,
        @Valid @RequestBody request: ChangeRoleRequest,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val targetUserId = UserId.fromString(memberId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.changeMemberRole(id, actor, targetUserId, request.role)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @PatchMapping("/invites/role")
    fun changeInviteRole(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam email: String,
        @Valid @RequestBody request: ChangeRoleRequest,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.changeInviteRole(id, actor, email, request.role)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @DeleteMapping("/members/{memberId}")
    fun removeMember(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable memberId: String,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val target = UserId.fromString(memberId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        return when (val result = manageTripMembershipService.removeMember(id, actor, target)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }

    @DeleteMapping("/members/me")
    fun leaveTrip(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam(required = false) successorOwnerUserId: String?,
    ): ResponseEntity<Any> {
        val actor = authPrincipalResolver.userId(authentication)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val successor = successorOwnerUserId?.let { UserId.fromString(it) }
        if (successorOwnerUserId != null && successor == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        }

        return when (val result = manageTripMembershipService.leaveTrip(id, actor, successor)) {
            is AccessResult.Success -> ResponseEntity.ok(CollaboratorResponseMapper.toResponse(result.value))
            AccessResult.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            AccessResult.Forbidden -> ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
    }
}
