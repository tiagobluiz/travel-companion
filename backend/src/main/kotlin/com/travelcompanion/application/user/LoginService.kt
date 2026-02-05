package com.travelcompanion.application.user

import com.travelcompanion.domain.user.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

/**
 * Handles the use case of authenticating a user by email and password.
 *
 * Looks up the user by email, verifies the password against the stored hash,
 * and returns the user if valid. The caller (e.g., AuthController) is responsible
 * for issuing the JWT.
 */
@Service
class LoginService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    /**
     * Authenticates a user by email and password.
     *
     * @param email The user's email
     * @param password The plain-text password
     * @return The user if credentials are valid
     * @throws InvalidCredentialsException if email not found or password incorrect
     */
    fun execute(email: String, password: String): com.travelcompanion.domain.user.User {
        val normalizedEmail = email.trim().lowercase()
        val user = userRepository.findByEmail(normalizedEmail)
            ?: throw InvalidCredentialsException("Invalid email or password")

        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw InvalidCredentialsException("Invalid email or password")
        }

        return user
    }
}

/**
 * Thrown when login credentials are invalid (user not found or wrong password).
 */
class InvalidCredentialsException(message: String) : RuntimeException(message)
