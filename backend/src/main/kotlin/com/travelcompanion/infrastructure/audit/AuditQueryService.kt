package com.travelcompanion.infrastructure.audit

import com.fasterxml.jackson.databind.JsonNode
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.persistence.SpringDataAuditEventRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class AuditQueryService(
    private val repo: SpringDataAuditEventRepository,
) {

    fun search(
        entityType: String?,
        entityId: String?,
        actorId: UserId?,
        limit: Int,
    ): List<AuditEventView> {
        val safeLimit = limit.coerceIn(1, 500)
        return repo.search(
            entityType = entityType,
            entityId = entityId,
            actorId = actorId?.value,
            pageable = PageRequest.of(0, safeLimit),
        ).map { entity ->
            AuditEventView(
                id = entity.id.toString(),
                actorId = entity.actorId?.toString(),
                action = entity.action,
                entityType = entity.entityType,
                entityId = entity.entityId,
                occurredAt = entity.occurredAt,
                beforeState = entity.beforeState,
                afterState = entity.afterState,
                metadata = entity.metadata,
            )
        }
    }
}

data class AuditEventView(
    val id: String,
    val actorId: String?,
    val action: String,
    val entityType: String,
    val entityId: String,
    val occurredAt: Instant,
    val beforeState: JsonNode?,
    val afterState: JsonNode?,
    val metadata: JsonNode,
)

