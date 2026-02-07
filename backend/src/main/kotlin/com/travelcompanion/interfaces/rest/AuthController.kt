package com.travelcompanion.interfaces.rest

import com.travelcompanion.application.user.EmailAlreadyExistsException
import com.travelcompanion.application.user.InvalidCredentialsException
import com.travelcompanion.application.user.LoginService
import com.travelcompanion.application.user.RegisterUserService
import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import com.travelcompanion.infrastructure.auth.JwtService
import com.travelcompanion.interfaces.rest.dto.AuthResponse
import com.travelcompanion.interfaces.rest.dto.LoginRequest
import com.travelcompanion.interfaces.rest.dto.RegisterRequest
import com.travelcompanion.interfaces.rest.dto.UserResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST controller for authentication endpoints.
 *
 * Exposes register, login, and me (current user) endpoints.
 * Passwords are never returned; only hashed values are stored.
 */
@RestController
@RequestMapping("/auth")
class AuthController(
    private val registerUserService: RegisterUserService,
    private val loginService: LoginService,
    private val userRepository: UserRepository,
    private val jwtService: JwtService,
) {

    /**
     * Registers a new user and returns a JWT.
     */
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<Any> {
        return try {
            val user = registerUserService.execute(request.email, request.password, request.displayName)
            val token = jwtService.createToken(user.id.toString(), user.email)
            ResponseEntity.ok(AuthResponse(token = token, user = toUserResponse(user)))
        } catch (e: EmailAlreadyExistsException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf("error" to e.message))
        }
    }

    /**
     * Authenticates a user and returns a JWT.
     */
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<Any> {
        return try {
            val user = loginService.execute(request.email, request.password)
            val token = jwtService.createToken(user.id.toString(), user.email)
            ResponseEntity.ok(AuthResponse(token = token, user = toUserResponse(user)))
        } catch (e: InvalidCredentialsException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("error" to e.message))
        }
    }

    /**
     * Returns the currently authenticated user.
     *
     * Requires a valid JWT. The user ID is set as the principal by JwtAuthenticationFilter.
     */
    @GetMapping("/me")
    fun me(authentication: Authentication): ResponseEntity<Any> {
        val userIdStr = authentication.principal as? String ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val userId = UserId.fromString(userIdStr) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val user = userRepository.findById(userId) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        return ResponseEntity.ok(toUserResponse(user))
    }

    private fun toUserResponse(user: User) = UserResponse(
        id = user.id.toString(),
        email = user.email,
        displayName = user.displayName,
    )
}
