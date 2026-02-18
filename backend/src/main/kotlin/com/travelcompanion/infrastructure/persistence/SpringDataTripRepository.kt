package com.travelcompanion.infrastructure.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

/**
 * Spring Data JPA repository for [TripJpaEntity].
 *
 * Provides database access for trip persistence. Used by [JpaTripRepository]
 * to implement the domain [com.travelcompanion.domain.trip.TripRepository].
 */
interface SpringDataTripRepository : JpaRepository<TripJpaEntity, UUID> {

    @Query(
        """
        select distinct t
        from TripJpaEntity t
        left join TripMembershipJpaEntity m on m.tripId = t.id and m.userId = :userId
        where t.ownerId = :userId or m.userId is not null
        order by t.createdAt desc
        """
    )
    fun findAccessibleByUserIdOrderByCreatedAtDesc(@Param("userId") userId: UUID): List<TripJpaEntity>

    @Query(
        """
        select distinct t from TripJpaEntity t
        join TripInviteJpaEntity i on i.tripId = t.id
        where lower(i.email) = lower(:email)
        """
    )
    fun findByInviteEmailIgnoreCase(@Param("email") email: String): List<TripJpaEntity>

    fun existsByIdAndOwnerId(id: UUID, ownerId: UUID): Boolean
}
