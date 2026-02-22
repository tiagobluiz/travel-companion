package com.travelcompanion.application.trip

import com.travelcompanion.application.AccessResult
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripStatus
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

@Service
class ArchiveTripService(
    private val tripRepository: TripRepository,
) {
    fun execute(tripId: TripId, userId: UserId): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(userId, TripRole.OWNER)) return AccessResult.Forbidden
        if (trip.status == TripStatus.ARCHIVED) return AccessResult.Success(trip)
        return AccessResult.Success(tripRepository.save(trip.copy(status = TripStatus.ARCHIVED)))
    }
}
