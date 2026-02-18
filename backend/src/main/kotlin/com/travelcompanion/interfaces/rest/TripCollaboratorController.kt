package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.trip.ManageTripMembershipService
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.interfaces.rest.dto.ChangeRoleRequest
import com.travelcompanion.interfaces.rest.dto.CollaboratorsResponse
import com.travelcompanion.interfaces.rest.dto.InviteDto
import com.travelcompanion.interfaces.rest.dto.InviteMemberRequest
import com.travelcompanion.interfaces.rest.dto.InviteResponseRequest
import com.travelcompanion.interfaces.rest.dto.MembershipDto
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
) {

    @GetMapping("/collaborators")
    fun getCollaborators(
        authentication: Authentication,
        @PathVariable tripId: String,
    ): ResponseEntity<Any> {
        val requester = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        if (!manageTripMembershipService.existsTrip(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
        val trip = manageTripMembershipService.getCollaborators(id, requester)
            ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()

        return ResponseEntity.ok(
            CollaboratorsResponse(
                memberships = trip.memberships.map { MembershipDto(it.userId.toString(), it.role.name) },
                invites = trip.invites.map { InviteDto(it.email, it.role.name, it.status.name) },
            )
        )
    }

    @PostMapping("/invites")
    fun invite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: InviteMemberRequest,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.inviteMember(id, actor, request.email, request.role)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @PostMapping("/invites/respond")
    fun respondInvite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @Valid @RequestBody request: InviteResponseRequest,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.respondToInvite(id, actor, request.accept)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @DeleteMapping("/invites")
    fun removePendingOrDeclinedInvite(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam email: String,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.removePendingOrDeclinedInvite(id, actor, email)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @PatchMapping("/members/{memberId}/role")
    fun changeMemberRole(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable memberId: String,
        @Valid @RequestBody request: ChangeRoleRequest,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val targetUserId = UserId.fromString(memberId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.changeMemberRole(id, actor, targetUserId, request.role)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @PatchMapping("/invites/role")
    fun changeInviteRole(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam email: String,
        @Valid @RequestBody request: ChangeRoleRequest,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.changeInviteRole(id, actor, email, request.role)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @DeleteMapping("/members/{memberId}")
    fun removeMember(
        authentication: Authentication,
        @PathVariable tripId: String,
        @PathVariable memberId: String,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val target = UserId.fromString(memberId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val trip = manageTripMembershipService.removeMember(id, actor, target)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    @DeleteMapping("/members/me")
    fun leaveTrip(
        authentication: Authentication,
        @PathVariable tripId: String,
        @RequestParam(required = false) successorOwnerUserId: String?,
    ): ResponseEntity<Any> {
        val actor = requireUserId(authentication) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val id = TripId.fromString(tripId) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        val successor = successorOwnerUserId?.let { UserId.fromString(it) }
        if (successorOwnerUserId != null && successor == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        }

        val trip = manageTripMembershipService.leaveTrip(id, actor, successor)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toCollaboratorsResponse(trip))
    }

    private fun requireUserId(authentication: Authentication): UserId? {
        val principal = authentication.principal as? String ?: return null
        return UserId.fromString(principal)
    }

    private fun toCollaboratorsResponse(trip: com.travelcompanion.domain.trip.Trip): CollaboratorsResponse =
        CollaboratorsResponse(
            memberships = trip.memberships.map { MembershipDto(it.userId.toString(), it.role.name) },
            invites = trip.invites.map { InviteDto(it.email, it.role.name, it.status.name) },
        )
}
