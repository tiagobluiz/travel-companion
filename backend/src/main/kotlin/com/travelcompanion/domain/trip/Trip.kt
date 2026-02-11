package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

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
        itineraryItems.forEach { item -> validateDateWithinRange(item.date, startDate, endDate) }
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
    fun updateDetails(
        name: String,
        startDate: LocalDate,
        endDate: LocalDate,
        visibility: TripVisibility = this.visibility,
    ): Trip {
        require(name.isNotBlank()) { "Trip name cannot be blank" }
        require(!endDate.isBefore(startDate)) { "End date cannot be before start date" }

        val remappedItems = itineraryItems.map { item ->
            if (item.isInPlacesToVisit) {
                item.copy(date = startDate)
            } else {
                if (item.date.isBefore(startDate) || item.date.isAfter(endDate)) {
                    item.copy(
                        isInPlacesToVisit = true,
                        date = startDate,
                    )
                } else {
                    item
                }
            }
        }

        remappedItems.forEach { item -> validateDateWithinRange(item.date, startDate, endDate) }
        return copy(
            name = name,
            startDate = startDate,
            endDate = endDate,
            visibility = visibility,
            itineraryItems = remappedItems,
        )
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
                items = itineraryItems.filter { !it.isInPlacesToVisit && isSameDate(it.date, current) },
            )
            current = current.plusDays(1)
            dayNumber++
        }
        return days
    }

    fun placesToVisitItems(): List<ItineraryItem> =
        itineraryItems.filter { it.isInPlacesToVisit }

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
            isInPlacesToVisit = false,
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
            date = startDate,
            isInPlacesToVisit = true,
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
        val itemUuid = parseItemId(itemId)
        val index = itineraryItems.indexOfFirst { it.id == itemUuid }
        require(index >= 0) { "Itinerary item not found" }
        val current = itineraryItems[index]
        val targetDate = dayNumber?.let { dayNumberToDate(it) } ?: current.date
        val updated = itineraryItems[index].copy(
            placeName = placeName.trim(),
            notes = notes.trim(),
            latitude = latitude,
            longitude = longitude,
            date = targetDate,
            isInPlacesToVisit = dayNumber == null,
        )
        return updateItineraryItem(index, updated)
    }

    fun removeItineraryItemById(itemId: String): Trip {
        val itemUuid = parseItemId(itemId)
        val index = itineraryItems.indexOfFirst { it.id == itemUuid }
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

        val sourceItemId = parseItemId(itemId)
        val beforeUuid = beforeItemId?.let { parseItemId(it) }
        val afterUuid = afterItemId?.let { parseItemId(it) }
        val sourceIndex = itineraryItems.indexOfFirst { it.id == sourceItemId }
        require(sourceIndex >= 0) { "Itinerary item not found" }

        val movingOriginal = itineraryItems[sourceIndex]
        val targetDate = targetDayNumber?.let { dayNumberToDate(it) } ?: movingOriginal.date
        val moving = movingOriginal.copy(
            date = targetDate,
            isInPlacesToVisit = targetDayNumber == null,
        )
        val remaining = itineraryItems.toMutableList().also { it.removeAt(sourceIndex) }

        val insertAt = when {
            beforeUuid != null -> {
                val beforeIndex = remaining.indexOfFirst { it.id == beforeUuid }
                require(beforeIndex >= 0) { "beforeItemId not found" }
                require(isInTargetContainer(remaining[beforeIndex], targetDayNumber, targetDate)) {
                    "beforeItemId must be in the target container"
                }
                beforeIndex
            }
            afterUuid != null -> {
                val afterIndex = remaining.indexOfFirst { it.id == afterUuid }
                require(afterIndex >= 0) { "afterItemId not found" }
                require(isInTargetContainer(remaining[afterIndex], targetDayNumber, targetDate)) {
                    "afterItemId must be in the target container"
                }
                afterIndex + 1
            }
            else -> {
                val lastTargetIndex = remaining.indexOfLast { isInTargetContainer(it, targetDayNumber, targetDate) }
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

    fun addOwner(actorUserId: UserId, targetUserId: UserId): Trip {
        require(hasRole(actorUserId, TripRole.OWNER)) { "Only owners can add owners" }

        val updatedMemberships = memberships.toMutableList()
        val targetIndex = updatedMemberships.indexOfFirst { it.userId == targetUserId }
        if (targetIndex >= 0) {
            updatedMemberships[targetIndex] = updatedMemberships[targetIndex].copy(role = TripRole.OWNER)
        } else {
            updatedMemberships += TripMembership(userId = targetUserId, role = TripRole.OWNER)
        }
        return copy(memberships = updatedMemberships)
    }

    fun removeMember(actorUserId: UserId, targetUserId: UserId): Trip {
        require(hasRole(actorUserId, TripRole.OWNER)) { "Only owners can remove members" }
        require(isMember(targetUserId)) { "Target user is not a member" }

        val targetMembership = memberships.first { it.userId == targetUserId }
        if (targetMembership.role == TripRole.OWNER && targetUserId != actorUserId) {
            throw IllegalArgumentException("Owners cannot remove other owners")
        }
        if (targetMembership.role == TripRole.OWNER && ownerCount() <= 1) {
            throw IllegalArgumentException("Trip must have at least one owner")
        }
        if (targetUserId == userId) {
            throw IllegalArgumentException("Primary owner must assign another owner before leaving")
        }

        return copy(memberships = memberships.filterNot { it.userId == targetUserId })
    }

    fun leaveTrip(memberUserId: UserId, successorOwnerUserId: UserId? = null): Trip {
        require(isMember(memberUserId)) { "User is not a member" }

        val leavingIsOwner = hasRole(memberUserId, TripRole.OWNER)
        if (!leavingIsOwner) {
            return copy(memberships = memberships.filterNot { it.userId == memberUserId })
        }

        val ownerCount = ownerCount()
        if (ownerCount <= 1 && successorOwnerUserId == null) {
            throw IllegalArgumentException("Owner must assign another owner before leaving")
        }

        val updatedMemberships = memberships.toMutableList()
        if (successorOwnerUserId != null) {
            require(successorOwnerUserId != memberUserId) {
                "Successor owner must be different from leaving owner"
            }
            val successorIndex = updatedMemberships.indexOfFirst { it.userId == successorOwnerUserId }
            require(successorIndex >= 0) { "Successor owner must be an existing member" }
            updatedMemberships[successorIndex] = updatedMemberships[successorIndex].copy(role = TripRole.OWNER)
        }

        val primaryOwnerLeaving = memberUserId == userId
        if (primaryOwnerLeaving && successorOwnerUserId == null) {
            throw IllegalArgumentException("Primary owner must assign another owner before leaving")
        }

        val membershipsAfterLeave = updatedMemberships.filterNot { it.userId == memberUserId }
        require(membershipsAfterLeave.any { it.role == TripRole.OWNER }) {
            "Trip must have at least one owner"
        }

        return copy(
            userId = if (primaryOwnerLeaving) successorOwnerUserId!! else userId,
            memberships = membershipsAfterLeave,
        )
    }

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

    private fun isSameDate(left: LocalDate, right: LocalDate): Boolean =
        left.isEqual(right)

    private fun isInTargetContainer(item: ItineraryItem, targetDayNumber: Int?, targetDate: LocalDate): Boolean {
        if (targetDayNumber == null) return item.isInPlacesToVisit
        return !item.isInPlacesToVisit && isSameDate(item.date, targetDate)
    }

    private fun parseItemId(itemId: String): UUID =
        try {
            UUID.fromString(itemId)
        } catch (_: IllegalArgumentException) {
            throw IllegalArgumentException("Invalid itinerary item id")
        }

    private fun ownerCount(): Int =
        memberships.count { it.role == TripRole.OWNER }
}

data class TripDayContainer(
    val dayNumber: Int,
    val date: LocalDate,
    val items: List<ItineraryItem>,
)
