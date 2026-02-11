package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.databind.JsonNode
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "audit_events")
class AuditEventJpaEntity(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID,

    @Column(name = "actor_id")
    val actorId: UUID?,

    @Column(name = "action", nullable = false)
    val action: String,

    @Column(name = "entity_type", nullable = false)
    val entityType: String,

    @Column(name = "entity_id", nullable = false)
    val entityId: String,

    @Column(name = "occurred_at", nullable = false, updatable = false)
    val occurredAt: Instant,

    @Column(name = "before_state", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    val beforeState: JsonNode? = null,

    @Column(name = "after_state", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    val afterState: JsonNode? = null,

    @Column(name = "metadata", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    val metadata: JsonNode,
)

