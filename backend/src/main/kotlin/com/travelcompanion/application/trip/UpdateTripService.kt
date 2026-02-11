package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripVisibility
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service
import java.time.LocalDate

/**
 * Handles the use case of updating an existing trip.
 *
 * Ensures the trip belongs to the user and updates name/dates if provided.
 */
@Service
class UpdateTripService(
    private val tripRepository: TripRepository,
) {

    /**
     * Updates a trip's name and dates.
     *
     * @param tripId The trip ID
     * @param userId The owner's user ID
     * @param name New name (optional)
     * @param startDate New start date (optional)
     * @param endDate New end date (optional)
     * @return The updated trip, or null if not found or not owned
     */
    fun execute(
        tripId: TripId,
        userId: UserId,
        name: String?,
        startDate: LocalDate?,
        endDate: LocalDate?,
        visibility: TripVisibility?,
    ): Trip? {
        val existing = tripRepository.findById(tripId) ?: return null

        val isOwner = existing.hasRole(userId, TripRole.OWNER)
        val isEditor = existing.hasRole(userId, TripRole.EDITOR)
        val isOwnerOrEditor = isOwner || isEditor
        val requestedCoreEdit = name != null || startDate != null || endDate != null

        if (requestedCoreEdit && !isOwnerOrEditor) return null
        if (visibility != null && !isOwner) return null

        if (!requestedCoreEdit && visibility == null) return existing

        val newName = name?.trim() ?: existing.name
        val newStart = startDate ?: existing.startDate
        val newEnd = endDate ?: existing.endDate

        val updated = existing.updateDetails(
            name = newName,
            startDate = newStart,
            endDate = newEnd,
            visibility = visibility ?: existing.visibility,
        )
        return tripRepository.save(updated)
    }
}
