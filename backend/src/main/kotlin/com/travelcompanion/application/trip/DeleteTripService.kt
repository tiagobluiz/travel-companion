package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of deleting a trip.
 *
 * Ensures the trip belongs to the user before deleting. Cascade will remove
 * associated expenses (handled by DB foreign key).
 */
@Service
class DeleteTripService(
    private val tripRepository: TripRepository,
) {

    /**
     * Deletes a trip if it exists and belongs to the user.
     *
     * @param tripId The trip ID
     * @param userId The owner's user ID
     * @return true if deleted, false if not found or not owned
     */
    fun execute(tripId: TripId, userId: UserId): Boolean {
        if (!tripRepository.existsByIdAndUserId(tripId, userId)) return false
        tripRepository.deleteById(tripId)
        return true
    }
}
