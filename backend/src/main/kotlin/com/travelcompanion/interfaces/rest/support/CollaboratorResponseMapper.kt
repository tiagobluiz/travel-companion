package com.travelcompanion.interfaces.rest.support

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.interfaces.rest.dto.CollaboratorsResponse
import com.travelcompanion.interfaces.rest.dto.InviteDto
import com.travelcompanion.interfaces.rest.dto.MembershipDto

object CollaboratorResponseMapper {

    fun toResponse(trip: Trip): CollaboratorsResponse =
        CollaboratorsResponse(
            memberships = trip.memberships.map { MembershipDto(it.userId.toString(), it.role.name) },
            invites = trip.invites.map { InviteDto(it.email, it.role.name, it.status.name) },
        )
}

