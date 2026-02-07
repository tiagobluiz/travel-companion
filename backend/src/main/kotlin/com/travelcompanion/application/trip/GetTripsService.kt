package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of listing all trips for an authenticated user.
 *
 * Returns trips ordered by creation date descending.
 */
@Service
class GetTripsService(
    private val tripRepository: TripRepository,
) {

    /**
     * Returns all trips owned by the user.
     *
     * @param userId The owner's user ID
     * @return List of trips (may be empty)
     */
    fun execute(userId: UserId): List<Trip> =
        tripRepository.findByUserId(userId)
}
