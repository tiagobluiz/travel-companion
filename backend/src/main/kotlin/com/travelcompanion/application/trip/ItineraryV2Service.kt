package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.springframework.stereotype.Service

@Service
class ItineraryV2Service(
    private val tripRepository: TripRepository,
) {

    fun get(tripId: TripId, userId: UserId): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!trip.canView(userId)) return null
        return trip
    }

    fun addItem(
        tripId: TripId,
        userId: UserId,
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
        dayNumber: Int?,
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!canWriteItinerary(trip, userId)) return null

        val updated = if (dayNumber == null) {
            trip.addItineraryItemToPlacesToVisit(placeName, notes, latitude, longitude)
        } else {
            trip.addItineraryItemToDay(placeName, notes, latitude, longitude, dayNumber)
        }
        return tripRepository.save(updated)
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
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!canWriteItinerary(trip, userId)) return null

        val updated = trip.updateItineraryItemById(
            itemId = itemId,
            placeName = placeName,
            notes = notes,
            latitude = latitude,
            longitude = longitude,
            dayNumber = dayNumber,
        )
        return tripRepository.save(updated)
    }

    fun removeItem(
        tripId: TripId,
        userId: UserId,
        itemId: String,
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!canWriteItinerary(trip, userId)) return null

        val updated = trip.removeItineraryItemById(itemId)
        return tripRepository.save(updated)
    }

    fun moveItem(
        tripId: TripId,
        userId: UserId,
        itemId: String,
        targetDayNumber: Int?,
        beforeItemId: String?,
        afterItemId: String?,
    ): Trip? {
        val trip = tripRepository.findById(tripId) ?: return null
        if (!canWriteItinerary(trip, userId)) return null

        val updated = trip.moveItineraryItem(
            itemId = itemId,
            targetDayNumber = targetDayNumber,
            beforeItemId = beforeItemId,
            afterItemId = afterItemId,
        )
        return tripRepository.save(updated)
    }

    private fun canWriteItinerary(trip: Trip, userId: UserId): Boolean =
        trip.hasRole(userId, TripRole.OWNER) || trip.hasRole(userId, TripRole.EDITOR)
}

