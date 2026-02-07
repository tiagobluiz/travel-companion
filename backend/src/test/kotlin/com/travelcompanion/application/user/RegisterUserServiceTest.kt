package com.travelcompanion.application.user

import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.Instant

/**
 * Unit tests for [RegisterUserService].
 */
class RegisterUserServiceTest {

    private val userRepository = mock<UserRepository>()
    private val passwordEncoder = mock<PasswordEncoder>()
    private val service = RegisterUserService(userRepository, passwordEncoder)

    @Test
    fun `execute creates user when email is available`() {
        whenever(userRepository.existsByEmail("test@example.com")).thenReturn(false)
        whenever(passwordEncoder.encode("password123")).thenReturn("hashed")
        whenever(userRepository.save(any())).thenAnswer { (it.arguments[0] as User) }

        service.execute("test@example.com", "password123", "Test User")

        val captor = argumentCaptor<User>()
        verify(userRepository).save(captor.capture())
        assertEquals("test@example.com", captor.firstValue.email)
        assertEquals("hashed", captor.firstValue.passwordHash)
        assertEquals("Test User", captor.firstValue.displayName)
    }

    @Test
    fun `execute throws when email already exists`() {
        whenever(userRepository.existsByEmail("existing@example.com")).thenReturn(true)

        assertThrows<EmailAlreadyExistsException> {
            service.execute("existing@example.com", "password", "User")
        }
    }

    @Test
    fun `execute normalizes email to lowercase`() {
        whenever(userRepository.existsByEmail("test@example.com")).thenReturn(false)
        whenever(passwordEncoder.encode(any())).thenReturn("hashed")
        whenever(userRepository.save(any())).thenAnswer { (it.arguments[0] as User) }

        service.execute("Test@Example.COM", "password", "User")

        val captor = argumentCaptor<User>()
        verify(userRepository).save(captor.capture())
        assertEquals("test@example.com", captor.firstValue.email)
    }
}
