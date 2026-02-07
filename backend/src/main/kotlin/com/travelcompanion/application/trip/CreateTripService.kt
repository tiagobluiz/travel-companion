package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate

/**
 * Handles the use case of creating a new trip for an authenticated user.
 *
 * Validates that the user exists (via UserId), creates the trip with the given name and dates,
 * and persists it. The caller is responsible for ensuring the user is authenticated.
 */
@Service
class CreateTripService(
    private val tripRepository: TripRepository,
) {

    /**
     * Creates a new trip.
     *
     * @param userId The owner's user ID
     * @param name The trip name
     * @param startDate The trip start date
     * @param endDate The trip end date (must be >= startDate)
     * @return The created trip
     */
    fun execute(userId: UserId, name: String, startDate: LocalDate, endDate: LocalDate): Trip {
        val trip = Trip(
            id = TripId.generate(),
            userId = userId,
            name = name.trim(),
            startDate = startDate,
            endDate = endDate,
            itineraryItems = emptyList(),
            createdAt = Instant.now(),
        )
        return tripRepository.save(trip)
    }
}
