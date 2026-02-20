package com.travelcompanion.application.trip

import com.travelcompanion.application.AccessResult
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of fetching a single trip by ID.
 *
 * Ensures the trip exists and can be read by the requesting user context.
 */
@Service
class GetTripService(
    private val tripRepository: TripRepository,
) {

    /**
     * Returns the trip if it exists and is readable by the user.
     *
     * @param tripId The trip ID
     * @param userId The requesting user's ID, or null for anonymous callers
     * @return The trip, or null if not found or not readable by user
     */
    fun execute(tripId: TripId, userId: UserId?): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canView(userId)) return AccessResult.Forbidden
        return AccessResult.Success(trip)
    }
}
