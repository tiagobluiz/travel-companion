package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.user.User
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
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
) : UserRepository {

    override fun save(user: User): User {
        val entity = toEntity(user)
        val saved = springRepo.save(entity)
        return toDomain(saved)
    }

    override fun findById(id: UserId): User? =
        springRepo.findById(id.value).orElse(null)?.let { toDomain(it) }

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
