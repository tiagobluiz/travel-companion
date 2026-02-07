package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

/**
 * Handles the use case of removing an itinerary item from a trip.
 *
 * Validates that the trip exists, belongs to the user, and the index is valid.
 */
@Service
class RemoveItineraryItemService(
    private val tripRepository: TripRepository,
) {

    /**
     * Removes the itinerary item at the given index.
     *
     * @param tripId The trip ID
     * @param userId The owner's user ID
     * @param index The index of the item to remove
     * @return The updated trip, or null if not found/not owned/invalid index
     */
    fun execute(tripId: TripId, userId: UserId, index: Int): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (trip.userId != userId) return null

        val updated = trip.removeItineraryItem(index)
        return tripRepository.save(updated)
    }
}
