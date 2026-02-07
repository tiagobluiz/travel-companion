package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId
import java.time.Instant
import java.time.LocalDate

/**
 * Represents a travel trip owned by a user.
 *
 * A Trip is the central aggregate for planning: it holds the itinerary (places and dates)
 * and is the parent of all expenses for that trip. The aggregate ensures that itinerary
 * items fall within the trip's date range.
 */
data class Trip(
    val id: TripId,
    val userId: UserId,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val itineraryItems: List<ItineraryItem> = emptyList(),
    val createdAt: Instant,
) {
    init {
        require(name.isNotBlank()) { "Trip name cannot be blank" }
        require(!endDate.isBefore(startDate)) { "End date cannot be before start date" }
        itineraryItems.forEach { item ->
            require(!item.date.isBefore(startDate) && !item.date.isAfter(endDate)) {
                "Itinerary item date must be within trip date range"
            }
        }
    }

    /**
     * Adds an itinerary item, ensuring it falls within the trip's date range.
     *
     * @param item The item to add
     * @return A new Trip with the item added
     */
    fun addItineraryItem(item: ItineraryItem): Trip {
        require(!item.date.isBefore(startDate) && !item.date.isAfter(endDate)) {
            "Itinerary item date must be within trip date range ($startDate - $endDate)"
        }
        return copy(itineraryItems = itineraryItems + item)
    }

    /**
     * Updates an itinerary item at the given index.
     *
     * @param index The index of the item to update
     * @param item The new item (must be within trip date range)
     * @return A new Trip with the updated item
     */
    fun updateItineraryItem(index: Int, item: ItineraryItem): Trip {
        require(index in itineraryItems.indices) { "Invalid itinerary item index" }
        require(!item.date.isBefore(startDate) && !item.date.isAfter(endDate)) {
            "Itinerary item date must be within trip date range"
        }
        val updated = itineraryItems.toMutableList()
        updated[index] = item
        return copy(itineraryItems = updated)
    }

    /**
     * Removes an itinerary item at the given index.
     *
     * @param index The index of the item to remove
     * @return A new Trip without the item
     */
    fun removeItineraryItem(index: Int): Trip {
        require(index in itineraryItems.indices) { "Invalid itinerary item index" }
        val updated = itineraryItems.toMutableList()
        updated.removeAt(index)
        return copy(itineraryItems = updated)
    }
}
