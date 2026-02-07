package com.travelcompanion.domain.user

/**
 * Port for persisting and retrieving [User] aggregates.
 *
 * This interface belongs to the domain layer and defines the contract for user storage.
 * The infrastructure layer provides the implementation (e.g., via JPA).
 */
interface UserRepository {
    /**
     * Saves a user to persistence.
     *
     * @param user The user to save
     * @return The saved user (possibly with updated fields)
     */
    fun save(user: User): User

    /**
     * Finds a user by their unique identifier.
     *
     * @param id The user ID
     * @return The user if found, null otherwise
     */
    fun findById(id: UserId): User?

    /**
     * Finds a user by their email address.
     *
     * @param email The email (case-insensitive)
     * @return The user if found, null otherwise
     */
    fun findByEmail(email: String): User?

    /**
     * Checks whether a user exists with the given email.
     *
     * @param email The email to check
     * @return true if a user with this email exists
     */
    fun existsByEmail(email: String): Boolean
}
