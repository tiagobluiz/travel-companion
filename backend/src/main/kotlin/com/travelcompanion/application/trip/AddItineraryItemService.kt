package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.ItineraryItem
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.time.LocalDate

/**
 * Handles the use case of adding an itinerary item to a trip.
 *
 * Validates that the trip exists, belongs to the user, and that the item's date
 * falls within the trip's date range.
 */
@Service
class AddItineraryItemService(
    private val tripRepository: TripRepository,
) {

    /**
     * Adds an itinerary item to the trip.
     *
     * @param tripId The trip ID
     * @param userId The owner's user ID
     * @param placeName The place or activity name
     * @param date The date (must be within trip start/end)
     * @param notes Optional notes
     * @param latitude Latitude (-90 to 90) for map display
     * @param longitude Longitude (-180 to 180) for map display
     * @return The updated trip with the new item, or null if not found/not owned
     */
    fun execute(
        tripId: TripId,
        userId: UserId,
        placeName: String,
        date: LocalDate,
        notes: String = "",
        latitude: Double,
        longitude: Double,
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (trip.userId != userId) return null
        require(!date.isBefore(trip.startDate) && !date.isAfter(trip.endDate)) {
            "Itinerary item date must be within trip date range (${trip.startDate} - ${trip.endDate})"
        }

        val item = ItineraryItem(
            placeName = placeName.trim(),
            date = date,
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
        )
        val updated = trip.addItineraryItem(item)
        return tripRepository.save(updated)
    }
}
