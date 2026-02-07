package com.travelcompanion.interfaces.rest.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Request body for user registration.
 *
 * @property email The user's email (used as login)
 * @property password The plain-text password (min 8 chars)
 * @property displayName The user's display name
 */
data class RegisterRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    @field:NotBlank(message = "Display name is required")
    @field:Size(max = 255)
    val displayName: String,
)

/**
 * Request body for user login.
 *
 * @property email The user's email
 * @property password The plain-text password
 */
data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String,
)

/**
 * Response containing the JWT and user info after login or register.
 */
data class AuthResponse(
    val token: String,
    val user: UserResponse,
)

/**
 * User info returned to the client (excludes password hash).
 */
data class UserResponse(
    val id: String,
    val email: String,
    val displayName: String,
)
