package com.travelcompanion.interfaces.rest.support

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.interfaces.rest.dto.ItineraryItemResponse
import com.travelcompanion.interfaces.rest.dto.TripResponse

object TripResponseMapper {

    fun toResponse(trip: Trip): TripResponse = TripResponse(
        id = trip.id.toString(),
        name = trip.name,
        startDate = trip.startDate.toString(),
        endDate = trip.endDate.toString(),
        visibility = trip.visibility.name,
        itineraryItems = trip.itineraryItems.map {
            ItineraryItemResponse(
                placeName = it.placeName,
                date = it.date.toString(),
                notes = it.notes,
                latitude = it.latitude,
                longitude = it.longitude,
            )
        },
        createdAt = trip.createdAt.toString(),
    )
}

