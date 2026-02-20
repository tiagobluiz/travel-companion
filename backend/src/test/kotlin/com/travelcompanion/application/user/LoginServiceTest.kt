package com.travelcompanion.application.user

import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.Instant

class LoginServiceTest {

    private val userRepository = mock<UserRepository>()
    private val passwordEncoder = mock<PasswordEncoder>()
    private val service = LoginService(userRepository, passwordEncoder)

    @Test
    fun `execute authenticates with normalized email`() {
        val user = User(
            id = UserId.generate(),
            email = "test@example.com",
            passwordHash = "hashed",
            displayName = "Test",
            createdAt = Instant.parse("2026-01-01T00:00:00Z"),
        )
        whenever(userRepository.findByEmail("test@example.com")).thenReturn(user)
        whenever(passwordEncoder.matches("secret", "hashed")).thenReturn(true)

        val result = service.execute("  Test@Example.COM ", "secret")

        assertEquals(user, result)
        verify(userRepository).findByEmail("test@example.com")
    }

    @Test
    fun `execute throws when email is not found`() {
        whenever(userRepository.findByEmail("missing@example.com")).thenReturn(null)

        assertThrows<InvalidCredentialsException> {
            service.execute("missing@example.com", "secret")
        }
    }

    @Test
    fun `execute throws when password does not match`() {
        val user = User(
            id = UserId.generate(),
            email = "test@example.com",
            passwordHash = "hashed",
            displayName = "Test",
            createdAt = Instant.parse("2026-01-01T00:00:00Z"),
        )
        whenever(userRepository.findByEmail("test@example.com")).thenReturn(user)
        whenever(passwordEncoder.matches("wrong", "hashed")).thenReturn(false)

        assertThrows<InvalidCredentialsException> {
            service.execute("test@example.com", "wrong")
        }
    }
}

