package com.travelcompanion.domain.trip

import java.time.LocalDate
import java.util.UUID

/**
 * Represents a single place or activity in a trip's itinerary.
 *
 * ItineraryItem is a value object that captures the place name, date, optional notes,
 * and required coordinates (latitude, longitude) for map display. Items are stored in
 * list order, which defines the display order for the day's route. Users can manually
 * reorder (future UI) or rely on an optimization algorithm (future feature).
 *
 * Coordinates are required to display the full trip route on a map.
 */
data class ItineraryItem(
    val placeName: String,
    val date: LocalDate,
    val notes: String = "",
    val latitude: Double,
    val longitude: Double,
    val id: UUID = UUID.randomUUID(),
    val isInPlacesToVisit: Boolean = false,
) {
    init {
        require(placeName.isNotBlank()) { "Place name cannot be blank" }
        require(latitude in -90.0..90.0) { "Latitude must be between -90 and 90" }
        require(longitude in -180.0..180.0) { "Longitude must be between -180 and 180" }
    }
}
