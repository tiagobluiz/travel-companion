package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.ItineraryItem
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.time.LocalDate

/**
 * Handles the use case of updating an itinerary item at a given index.
 *
 * Validates that the trip exists and belongs to the user.
 * Domain invariants (including index and date range) are enforced by the Trip aggregate.
 */
@Service
class UpdateItineraryItemService(
    private val tripRepository: TripRepository,
) {

    /**
     * Updates the itinerary item at the given index.
     *
     * @param tripId The trip ID
     * @param userId The owner's user ID
     * @param index The index of the item to update
     * @param placeName New place name
     * @param date New date (within trip range)
     * @param notes New notes
     * @param latitude Latitude for map display
     * @param longitude Longitude for map display
     * @return The updated trip, or null if not found/not owned/invalid index
     */
    fun execute(
        tripId: TripId,
        userId: UserId,
        index: Int,
        placeName: String,
        date: LocalDate,
        notes: String = "",
        latitude: Double,
        longitude: Double,
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (trip.userId != userId) return null
        val item = ItineraryItem(
            placeName = placeName.trim(),
            date = date,
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
        )
        val updated = trip.updateItineraryItem(index, item)
        return tripRepository.save(updated)
    }
}
