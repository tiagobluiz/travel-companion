package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

@Service
class ManageTripMembershipService(
    private val tripRepository: TripRepository,
) {

    fun addOwner(tripId: TripId, actorUserId: UserId, targetUserId: UserId): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        val updated = trip.addOwner(actorUserId, targetUserId)
        return tripRepository.save(updated)
    }

    fun removeMember(tripId: TripId, actorUserId: UserId, targetUserId: UserId): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        val updated = trip.removeMember(actorUserId, targetUserId)
        return tripRepository.save(updated)
    }

    fun leaveTrip(tripId: TripId, memberUserId: UserId, successorOwnerUserId: UserId? = null): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        val updated = trip.leaveTrip(memberUserId, successorOwnerUserId)
        return tripRepository.save(updated)
    }
}

