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
        itineraryItems.forEach { item -> validateDateWithinRange(item.date, startDate, endDate) }
    }

    /**
     * Adds an itinerary item, ensuring it falls within the trip's date range.
     *
     * @param item The item to add
     * @return A new Trip with the item added
     */
    fun addItineraryItem(item: ItineraryItem): Trip {
        validateDateWithinRange(item.date, startDate, endDate)
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
        validateDateWithinRange(item.date, startDate, endDate)
        val updated = itineraryItems.toMutableList()
        updated[index] = item
        return copy(itineraryItems = updated)
    }

    /**
     * Updates trip metadata while preserving aggregate invariants.
     */
    fun updateDetails(name: String, startDate: LocalDate, endDate: LocalDate): Trip {
        require(name.isNotBlank()) { "Trip name cannot be blank" }
        require(!endDate.isBefore(startDate)) { "End date cannot be before start date" }
        itineraryItems.forEach { item -> validateDateWithinRange(item.date, startDate, endDate) }
        return copy(name = name, startDate = startDate, endDate = endDate)
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

    private fun validateDateWithinRange(date: LocalDate, startDate: LocalDate, endDate: LocalDate) {
        require(!date.isBefore(startDate) && !date.isAfter(endDate)) {
            "Itinerary item date must be within trip date range ($startDate - $endDate)"
        }
    }
}
