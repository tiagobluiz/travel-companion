package com.travelcompanion.interfaces.rest.support

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.interfaces.rest.dto.DayContainerResponse
import com.travelcompanion.interfaces.rest.dto.ItineraryItemV2Response
import com.travelcompanion.interfaces.rest.dto.ItineraryV2Response
import com.travelcompanion.interfaces.rest.dto.ItemContainerResponse

object ItineraryResponseMapper {

    fun toV2Response(trip: Trip): ItineraryV2Response {
        val days = trip.generatedDays().map { day ->
            DayContainerResponse(
                dayNumber = day.dayNumber,
                date = day.date.toString(),
                items = day.items.map { item ->
                    ItineraryItemV2Response(
                        id = item.id.toString(),
                        placeName = item.placeName,
                        notes = item.notes,
                        latitude = item.latitude,
                        longitude = item.longitude,
                        dayNumber = day.dayNumber,
                    )
                },
            )
        }

        val places = ItemContainerResponse(
            label = "Places To Visit",
            items = trip.placesToVisitItems().map { item ->
                ItineraryItemV2Response(
                    id = item.id.toString(),
                    placeName = item.placeName,
                    notes = item.notes,
                    latitude = item.latitude,
                    longitude = item.longitude,
                    dayNumber = null,
                )
            },
        )

        return ItineraryV2Response(
            days = days,
            placesToVisit = places,
        )
    }
}

