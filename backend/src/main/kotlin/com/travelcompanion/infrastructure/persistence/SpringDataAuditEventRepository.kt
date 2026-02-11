package com.travelcompanion.infrastructure.persistence

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface SpringDataAuditEventRepository : JpaRepository<AuditEventJpaEntity, UUID> {

    @Query(
        """
        SELECT e FROM AuditEventJpaEntity e
        WHERE (:entityType IS NULL OR e.entityType = :entityType)
          AND (:entityId IS NULL OR e.entityId = :entityId)
          AND (:actorId IS NULL OR e.actorId = :actorId)
        ORDER BY e.occurredAt DESC
        """
    )
    fun search(
        @Param("entityType") entityType: String?,
        @Param("entityId") entityId: String?,
        @Param("actorId") actorId: UUID?,
        pageable: Pageable,
    ): List<AuditEventJpaEntity>
}

