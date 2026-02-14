package com.travelcompanion.application.user

import com.travelcompanion.application.trip.LinkPendingInvitesOnRegistrationService
import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * Handles the use case of registering a new user.
 *
 * Validates that the email is not already taken, hashes the password with BCrypt,
 * creates the user aggregate, and persists it.
 */
@Service
class RegisterUserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val linkPendingInvitesOnRegistrationService: LinkPendingInvitesOnRegistrationService,
) {

    /**
     * Registers a new user with the given email, password, and display name.
     *
     * @param email The user's email (used as login identifier)
     * @param password The plain-text password (will be hashed)
     * @param displayName The user's display name
     * @return The created user (without password hash in typical DTO mapping)
     * @throws EmailAlreadyExistsException if the email is already registered
     */
    @Transactional
    fun execute(email: String, password: String, displayName: String): User {
        val normalizedEmail = email.trim().lowercase()
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw EmailAlreadyExistsException("Email already registered: $normalizedEmail")
        }

        val user = User(
            id = UserId.generate(),
            email = normalizedEmail,
            passwordHash = passwordEncoder.encode(password),
            displayName = displayName.trim(),
            createdAt = Instant.now(),
        )
        val saved = userRepository.save(user)
        linkPendingInvitesOnRegistrationService.execute(saved)
        return saved
    }
}

/**
 * Thrown when attempting to register with an email that is already in use.
 */
class EmailAlreadyExistsException(message: String) : RuntimeException(message)
