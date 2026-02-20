package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant
import java.util.Optional

class JpaUserRepositoryTest {

    private val springRepo = mock<SpringDataUserRepository>()
    private val auditEventWriter = mock<AuditEventWriter>()
    private val repository = JpaUserRepository(springRepo, auditEventWriter)

    @Test
    fun `save writes user created audit on new user`() {
        val user = user()
        whenever(springRepo.findById(user.id.value)).thenReturn(Optional.empty())
        whenever(springRepo.save(any<UserJpaEntity>())).thenAnswer { it.arguments[0] as UserJpaEntity }

        val saved = repository.save(user)

        assertEquals(user, saved)
        verify(auditEventWriter).record(
            action = eq("USER_CREATED"),
            entityType = eq("USER"),
            entityId = eq(user.id.toString()),
            beforeState = eq(null),
            afterState = any<User>(),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `save writes user updated audit on existing user`() {
        val user = user()
        val existing = UserJpaEntity(
            id = user.id.value,
            email = user.email,
            passwordHash = "old-hash",
            displayName = "Old Name",
            createdAt = user.createdAt.minusSeconds(120),
        )
        whenever(springRepo.findById(user.id.value)).thenReturn(Optional.of(existing))
        whenever(springRepo.save(any<UserJpaEntity>())).thenAnswer { it.arguments[0] as UserJpaEntity }

        repository.save(user)

        verify(auditEventWriter).record(
            action = eq("USER_UPDATED"),
            entityType = eq("USER"),
            entityId = eq(user.id.toString()),
            beforeState = any<User>(),
            afterState = any<User>(),
            metadata = any<Map<String, Any?>>(),
        )
    }

    @Test
    fun `findByEmail delegates to case-insensitive spring query`() {
        val user = user()
        whenever(springRepo.findByEmailIgnoreCase("USER@EXAMPLE.COM")).thenReturn(
            UserJpaEntity(
                id = user.id.value,
                email = user.email,
                passwordHash = user.passwordHash,
                displayName = user.displayName,
                createdAt = user.createdAt,
            )
        )

        val found = repository.findByEmail("USER@EXAMPLE.COM")

        assertEquals(user.email, found?.email)
        verify(springRepo).findByEmailIgnoreCase("USER@EXAMPLE.COM")
    }

    @Test
    fun `findById returns null when user missing`() {
        val id = UserId.generate()
        whenever(springRepo.findById(id.value)).thenReturn(Optional.empty())

        val found = repository.findById(id)

        assertNull(found)
    }

    @Test
    fun `existsByEmail delegates to spring repository`() {
        whenever(springRepo.existsByEmailIgnoreCase("user@example.com")).thenReturn(true)

        val exists = repository.existsByEmail("user@example.com")

        assertEquals(true, exists)
        verify(springRepo).existsByEmailIgnoreCase("user@example.com")
    }

    private fun user() = User(
        id = UserId.generate(),
        email = "user@example.com",
        passwordHash = "hash",
        displayName = "User Name",
        createdAt = Instant.parse("2026-01-01T00:00:00Z"),
    )
}

