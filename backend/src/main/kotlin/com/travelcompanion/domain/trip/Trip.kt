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
    val visibility: TripVisibility = TripVisibility.PRIVATE,
    val memberships: List<TripMembership> = listOf(TripMembership(userId, TripRole.OWNER)),
    val invites: List<TripInvite> = emptyList(),
    val itineraryItems: List<ItineraryItem> = emptyList(),
    val createdAt: Instant,
) {
    init {
        require(name.isNotBlank()) { "Trip name cannot be blank" }
        require(!endDate.isBefore(startDate)) { "End date cannot be before start date" }
        require(memberships.isNotEmpty()) { "Trip must have at least one member" }
        require(memberships.any { it.userId == userId && it.role == TripRole.OWNER }) {
            "Trip owner must be present as an OWNER membership"
        }
        require(memberships.map { it.userId }.toSet().size == memberships.size) {
            "Duplicate memberships are not allowed"
        }
        require(invites.map { it.email.lowercase() }.toSet().size == invites.size) {
            "Duplicate invites are not allowed"
        }
        itineraryItems.forEach { item ->
            item.date?.let { validateDateWithinRange(it, startDate, endDate) }
        }
        require(itineraryItems.map { it.id }.toSet().size == itineraryItems.size) {
            "Duplicate itinerary item ids are not allowed"
        }
    }

    /**
     * Adds an itinerary item, ensuring it falls within the trip's date range.
     *
     * @param item The item to add
     * @return A new Trip with the item added
     */
    fun addItineraryItem(item: ItineraryItem): Trip {
        item.date?.let { validateDateWithinRange(it, startDate, endDate) }
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
        item.date?.let { validateDateWithinRange(it, startDate, endDate) }
        val updated = itineraryItems.toMutableList()
        updated[index] = item
        return copy(itineraryItems = updated)
    }

    /**
     * Updates trip metadata while preserving aggregate invariants.
     */
    fun updateDetails(
        name: String,
        startDate: LocalDate,
        endDate: LocalDate,
        visibility: TripVisibility = this.visibility,
    ): Trip {
        require(name.isNotBlank()) { "Trip name cannot be blank" }
        require(!endDate.isBefore(startDate)) { "End date cannot be before start date" }
        itineraryItems.forEach { item ->
            item.date?.let { validateDateWithinRange(it, startDate, endDate) }
        }
        return copy(name = name, startDate = startDate, endDate = endDate, visibility = visibility)
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

    fun generatedDays(): List<TripDayContainer> {
        val days = mutableListOf<TripDayContainer>()
        var current = startDate
        var dayNumber = 1
        while (!current.isAfter(endDate)) {
            days += TripDayContainer(
                dayNumber = dayNumber,
                date = current,
                items = itineraryItems.filter { isSameDate(it.date, current) },
            )
            current = current.plusDays(1)
            dayNumber++
        }
        return days
    }

    fun placesToVisitItems(): List<ItineraryItem> =
        itineraryItems.filter { it.date == null }

    fun addItineraryItemToDay(
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
        dayNumber: Int,
    ): Trip {
        val date = dayNumberToDate(dayNumber)
        val item = ItineraryItem(
            placeName = placeName.trim(),
            date = date,
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
        )
        return addItineraryItem(item)
    }

    fun addItineraryItemToPlacesToVisit(
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
    ): Trip {
        val item = ItineraryItem(
            placeName = placeName.trim(),
            date = null,
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
        )
        return addItineraryItem(item)
    }

    fun updateItineraryItemById(
        itemId: String,
        placeName: String,
        notes: String,
        latitude: Double,
        longitude: Double,
        dayNumber: Int?,
    ): Trip {
        val index = itineraryItems.indexOfFirst { it.id == itemId }
        require(index >= 0) { "Itinerary item not found" }
        val targetDate = dayNumber?.let { dayNumberToDate(it) }
        val updated = itineraryItems[index].copy(
            placeName = placeName.trim(),
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
            date = targetDate,
        )
        return updateItineraryItem(index, updated)
    }

    fun removeItineraryItemById(itemId: String): Trip {
        val index = itineraryItems.indexOfFirst { it.id == itemId }
        require(index >= 0) { "Itinerary item not found" }
        return removeItineraryItem(index)
    }

    fun moveItineraryItem(
        itemId: String,
        targetDayNumber: Int?,
        beforeItemId: String?,
        afterItemId: String?,
    ): Trip {
        require(beforeItemId == null || afterItemId == null) {
            "Use either beforeItemId or afterItemId, not both"
        }

        val sourceIndex = itineraryItems.indexOfFirst { it.id == itemId }
        require(sourceIndex >= 0) { "Itinerary item not found" }

        val targetDate = targetDayNumber?.let { dayNumberToDate(it) }
        val moving = itineraryItems[sourceIndex].copy(date = targetDate)
        val remaining = itineraryItems.toMutableList().also { it.removeAt(sourceIndex) }

        val insertAt = when {
            beforeItemId != null -> {
                val beforeIndex = remaining.indexOfFirst { it.id == beforeItemId }
                require(beforeIndex >= 0) { "beforeItemId not found" }
                require(isSameDate(remaining[beforeIndex].date, targetDate)) {
                    "beforeItemId must be in the target container"
                }
                beforeIndex
            }
            afterItemId != null -> {
                val afterIndex = remaining.indexOfFirst { it.id == afterItemId }
                require(afterIndex >= 0) { "afterItemId not found" }
                require(isSameDate(remaining[afterIndex].date, targetDate)) {
                    "afterItemId must be in the target container"
                }
                afterIndex + 1
            }
            else -> {
                val lastTargetIndex = remaining.indexOfLast { isSameDate(it.date, targetDate) }
                if (lastTargetIndex >= 0) lastTargetIndex + 1 else remaining.size
            }
        }

        remaining.add(insertAt, moving)
        return copy(itineraryItems = remaining)
    }

    fun isMember(userId: UserId): Boolean =
        memberships.any { it.userId == userId }

    fun hasRole(userId: UserId, role: TripRole): Boolean =
        memberships.any { it.userId == userId && it.role == role }

    fun canView(userId: UserId?): Boolean =
        visibility == TripVisibility.PUBLIC || (userId != null && isMember(userId))

    private fun dayNumberToDate(dayNumber: Int): LocalDate {
        require(dayNumber >= 1) { "dayNumber must be >= 1" }
        val date = startDate.plusDays((dayNumber - 1).toLong())
        require(!date.isAfter(endDate)) { "dayNumber exceeds trip range" }
        return date
    }

    private fun validateDateWithinRange(date: LocalDate, startDate: LocalDate, endDate: LocalDate) {
        require(!date.isBefore(startDate) && !date.isAfter(endDate)) {
            "Itinerary item date must be within trip date range ($startDate - $endDate)"
        }
    }

    private fun isSameDate(left: LocalDate?, right: LocalDate?): Boolean {
        if (left == null || right == null) return left == null && right == null
        return left.isEqual(right)
    }
}

data class TripDayContainer(
    val dayNumber: Int,
    val date: LocalDate,
    val items: List<ItineraryItem>,
)
