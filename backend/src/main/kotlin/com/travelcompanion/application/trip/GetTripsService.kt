package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of listing all trips accessible to an authenticated user.
 *
 * Returns trips ordered by creation date descending.
 */
@Service
class GetTripsService(
    private val tripRepository: TripRepository,
) {

    /**
     * Returns all trips where the user has access (owner/editor/viewer membership).
     *
     * @param userId The requesting user's ID
     * @return List of trips (may be empty)
     */
    fun execute(
        userId: UserId,
        statusFilter: TripListStatusFilter = TripListStatusFilter.ACTIVE,
    ): List<Trip> =
        tripRepository.findByUserId(userId).filter(statusFilter::matches)
}
