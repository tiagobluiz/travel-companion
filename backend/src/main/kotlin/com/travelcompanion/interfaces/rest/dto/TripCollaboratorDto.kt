package com.travelcompanion.interfaces.rest.dto

import com.travelcompanion.domain.trip.TripRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class InviteMemberRequest(
    @field:Email(message = "Email must be valid")
    @field:NotBlank(message = "Email is required")
    val email: String,
    val role: TripRole = TripRole.VIEWER,
)

data class InviteResponseRequest(
    val accept: Boolean,
)

data class ChangeRoleRequest(
    val role: TripRole,
)

data class CollaboratorsResponse(
    val memberships: List<MembershipDto>,
    val invites: List<InviteDto>,
)

data class MembershipDto(
    val userId: String,
    val role: String,
)

data class InviteDto(
    val email: String,
    val role: String,
    val status: String,
)
