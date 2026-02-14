package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.User
import org.springframework.stereotype.Service

@Service
class LinkPendingInvitesOnRegistrationService(
    private val tripRepository: TripRepository,
) {

    fun execute(user: User) {
        val inviteTrips = tripRepository.findByInviteEmail(user.email)
        inviteTrips.forEach { trip ->
            val inviteIndex = trip.invites.indexOfFirst {
                it.email.equals(user.email, ignoreCase = true) && it.status == InviteStatus.PENDING
            }
            if (inviteIndex < 0) return@forEach

            val invite = trip.invites[inviteIndex]
            val updatedInvites = trip.invites.toMutableList()
            updatedInvites[inviteIndex] = invite.copy(status = InviteStatus.ACCEPTED)

            val updatedMemberships = if (trip.memberships.any { it.userId == user.id }) {
                trip.memberships
            } else {
                trip.memberships + TripMembership(userId = user.id, role = invite.role)
            }

            tripRepository.save(trip.copy(memberships = updatedMemberships, invites = updatedInvites))
        }
    }
}
