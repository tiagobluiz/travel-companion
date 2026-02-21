package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import com.travelcompanion.infrastructure.audit.AuditEventWriter
import org.springframework.stereotype.Repository

/**
 * JPA implementation of [UserRepository].
 *
 * Maps between domain [User] and [UserJpaEntity], delegating persistence
 * to [SpringDataUserRepository].
 */
@Repository
class JpaUserRepository(
    private val springRepo: SpringDataUserRepository,
    private val auditEventWriter: AuditEventWriter,
) : UserRepository {

    override fun save(user: User): User {
        val existing = springRepo.findById(user.id.value).orElse(null)?.let { toDomain(it) }
        val entity = toEntity(user)
        val saved = springRepo.save(entity)
        val savedDomain = toDomain(saved)

        auditEventWriter.record(
            action = if (existing == null) "USER_CREATED" else "USER_UPDATED",
            entityType = "USER",
            entityId = savedDomain.id.toString(),
            beforeState = existing?.copy(passwordHash = "***redacted***"),
            afterState = savedDomain.copy(passwordHash = "***redacted***"),
            metadata = mapOf("email" to savedDomain.email),
        )
        return savedDomain
    }

    override fun findById(id: UserId): User? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

    override fun findByIds(ids: Set<UserId>): Map<UserId, User> {
        if (ids.isEmpty()) return emptyMap()
        return springRepo.findAllById(ids.map { it.value })
            .map { toDomain(it) }
            .associateBy { it.id }
    }

    override fun findByEmail(email: String): User? =
        springRepo.findByEmailIgnoreCase(email)?.let { toDomain(it) }

    override fun existsByEmail(email: String): Boolean =
        springRepo.existsByEmailIgnoreCase(email)

    private fun toEntity(user: User) = UserJpaEntity(
        id = user.id.value,
        email = user.email,
        passwordHash = user.passwordHash,
        displayName = user.displayName,
        createdAt = user.createdAt,
    )

    private fun toDomain(entity: UserJpaEntity) = User(
        id = UserId(entity.id),
        email = entity.email,
        passwordHash = entity.passwordHash,
        displayName = entity.displayName,
        createdAt = entity.createdAt,
    )
}
