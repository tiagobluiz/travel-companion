package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of fetching a single trip by ID.
 *
 * Ensures the trip exists and belongs to the requesting user.
 */
@Service
class GetTripService(
    private val tripRepository: TripRepository,
) {

    /**
     * Returns the trip if it exists and belongs to the user.
     *
     * @param tripId The trip ID
     * @param userId The requesting user's ID (must be owner)
     * @return The trip, or null if not found or not owned by user
     */
    fun execute(tripId: TripId, userId: UserId): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (trip.userId != userId) return null
        return trip
    }
}
