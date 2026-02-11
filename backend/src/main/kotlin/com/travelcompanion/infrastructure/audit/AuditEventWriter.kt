package com.travelcompanion.infrastructure.audit

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.travelcompanion.infrastructure.persistence.AuditEventJpaEntity
import com.travelcompanion.infrastructure.persistence.SpringDataAuditEventRepository
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

@Component
class AuditEventWriter(
    private val repo: SpringDataAuditEventRepository,
    private val objectMapper: ObjectMapper,
    private val actorResolver: AuditActorResolver,
) {

    fun record(
        action: String,
        entityType: String,
        entityId: String,
        beforeState: Any? = null,
        afterState: Any? = null,
        metadata: Map<String, Any?> = emptyMap(),
    ) {
        val metadataNode = toJsonNode(metadata) as? ObjectNode ?: objectMapper.createObjectNode()
        val event = AuditEventJpaEntity(
            id = UUID.randomUUID(),
            actorId = actorResolver.currentActorId()?.value,
            action = action,
            entityType = entityType,
            entityId = entityId,
            occurredAt = Instant.now(),
            beforeState = toJsonNode(beforeState),
            afterState = toJsonNode(afterState),
            metadata = metadataNode,
        )
        repo.save(event)
    }

    private fun toJsonNode(value: Any?): JsonNode? {
        if (value == null) return null
        return objectMapper.valueToTree(value)
    }
}

