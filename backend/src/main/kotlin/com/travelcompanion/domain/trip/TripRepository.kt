package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId

/**
 * Port for persisting and retrieving [Trip] aggregates.
 *
 * This interface defines the contract for trip storage. The infrastructure layer
 * provides the implementation via JPA.
 */
interface TripRepository {
    /**
     * Saves a trip to persistence.
     *
     * @param trip The trip to save
     * @return The saved trip (possibly with updated fields)
     */
    fun save(trip: Trip): Trip

    /**
     * Finds a trip by its unique identifier.
     *
     * @param id The trip ID
     * @return The trip if found, null otherwise
     */
    fun findById(id: TripId): Trip?

    /**
     * Finds all trips accessible by a given user, ordered by creation date descending.
     *
     * @param userId The requesting user's ID
     * @return List of trips (may be empty)
     */
    fun findByUserId(userId: UserId): List<Trip>

    /**
     * Finds all trips where an invite exists for the given email (case-insensitive exact match).
     *
     * @param email Invitee email
     * @return List of trips (may be empty)
     */
    fun findByInviteEmail(email: String): List<Trip>

    /**
     * Deletes a trip by ID.
     *
     * @param id The trip ID to delete
     */
    fun deleteById(id: TripId)

    /**
     * Checks whether a trip exists and is owned by the given user.
     *
     * @param tripId The trip ID
     * @param userId The user ID
     * @return true if the trip exists and belongs to the user
     */
    fun existsByIdAndUserId(tripId: TripId, userId: UserId): Boolean
}
