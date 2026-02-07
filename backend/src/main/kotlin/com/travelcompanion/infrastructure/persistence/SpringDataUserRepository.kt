package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

/**
 * Spring Data JPA repository for [UserJpaEntity].
 *
 * Provides database access for user persistence. Used by [JpaUserRepository]
 * to implement the domain [com.travelcompanion.domain.user.UserRepository].
 */
interface SpringDataUserRepository : JpaRepository<UserJpaEntity, UUID> {

    @Query("SELECT u FROM UserJpaEntity u WHERE LOWER(u.email) = LOWER(:email)")
    fun findByEmailIgnoreCase(email: String): UserJpaEntity?

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserJpaEntity u WHERE LOWER(u.email) = LOWER(:email)")
    fun existsByEmailIgnoreCase(email: String): Boolean
}
