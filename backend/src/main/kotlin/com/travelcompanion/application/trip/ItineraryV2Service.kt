package com.travelcompanion.application.trip

import com.travelcompanion.application.AccessResult
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

@Service
class ItineraryV2Service(
    private val tripRepository: TripRepository,
) {

    fun get(tripId: TripId, userId: UserId): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canView(userId)) return AccessResult.Forbidden
        return AccessResult.Success(trip)
    }

    fun addItem(
        tripId: TripId,
        userId: UserId,
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
        dayNumber: Int?,
    ): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canWrite(userId)) return AccessResult.Forbidden

        val updated = if (dayNumber == null) {
            trip.addItineraryItemToPlacesToVisit(placeName, notes, latitude, longitude)
        } else {
            trip.addItineraryItemToDay(placeName, notes, latitude, longitude, dayNumber)
        }
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun updateItem(
        tripId: TripId,
        userId: UserId,
        itemId: String,
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
        dayNumber: Int?,
    ): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canWrite(userId)) return AccessResult.Forbidden

        val updated = trip.updateItineraryItemById(
            itemId = itemId,
            placeName = placeName,
            notes = notes,
            latitude = latitude,
            longitude = longitude,
            dayNumber = dayNumber,
        )
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun removeItem(
        tripId: TripId,
        userId: UserId,
        itemId: String,
    ): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canWrite(userId)) return AccessResult.Forbidden

        val updated = trip.removeItineraryItemById(itemId)
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun moveItem(
        tripId: TripId,
        userId: UserId,
        itemId: String,
        targetDayNumber: Int?,
        beforeItemId: String?,
        afterItemId: String?,
    ): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.canWrite(userId)) return AccessResult.Forbidden

        val updated = trip.moveItineraryItem(
            itemId = itemId,
            targetDayNumber = targetDayNumber,
            beforeItemId = beforeItemId,
            afterItemId = afterItemId,
        )
        return AccessResult.Success(tripRepository.save(updated))
    }

}

