package com.travelcompanion.interfaces.rest.support

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.user.UserRepository
import com.travelcompanion.interfaces.rest.dto.CollaboratorsResponse
import com.travelcompanion.interfaces.rest.dto.InviteDto
import com.travelcompanion.interfaces.rest.dto.MembershipDto

object CollaboratorResponseMapper {

    fun toResponse(trip: Trip, userRepository: UserRepository): CollaboratorsResponse {
        val usersById = userRepository.findByIds(trip.memberships.map { it.userId }.toSet())
        return CollaboratorsResponse(
            memberships = trip.memberships.map {
                val memberUser = usersById[it.userId]
                MembershipDto(
                    userId = it.userId.toString(),
                    role = it.role.name,
                    displayName = memberUser?.displayName,
                )
            },
            invites = trip.invites.map { InviteDto(it.email, it.role.name, it.status.name) },
        )
    }
}

