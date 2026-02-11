package com.travelcompanion.infrastructure.audit

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.infrastructure.persistence.AuditEventJpaEntity
import com.travelcompanion.infrastructure.persistence.SpringDataAuditEventRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID

class AuditEventWriterTest {

    private val repo = mock<SpringDataAuditEventRepository>()
    private val actorResolver = AuditActorResolver()
    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
        registerModule(KotlinModule.Builder().build())
    }
    private val writer = AuditEventWriter(repo, objectMapper, actorResolver)

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `record stores actor action entity and snapshots`() {
        val actorId = UUID.randomUUID().toString()
        SecurityContextHolder.getContext().authentication =
            UsernamePasswordAuthenticationToken(actorId, null, emptyList())

        whenever(repo.save(any<AuditEventJpaEntity>())).thenAnswer { it.arguments[0] as AuditEventJpaEntity }

        writer.record(
            action = "TRIP_UPDATED",
            entityType = "TRIP",
            entityId = "trip-1",
            beforeState = mapOf("name" to "Old"),
            afterState = mapOf("name" to "New"),
            metadata = mapOf("source" to "unit-test"),
        )

        val captor = argumentCaptor<AuditEventJpaEntity>()
        verify(repo).save(captor.capture())
        val saved = captor.firstValue
        assertEquals("TRIP_UPDATED", saved.action)
        assertEquals("TRIP", saved.entityType)
        assertEquals("trip-1", saved.entityId)
        assertEquals(actorId, saved.actorId?.toString())
        assertEquals("Old", saved.beforeState?.get("name")?.asText())
        assertEquals("New", saved.afterState?.get("name")?.asText())
        assertEquals("unit-test", saved.metadata.get("source").asText())
        assertNotNull(saved.occurredAt)
    }

    @Test
    fun `record supports anonymous actor`() {
        whenever(repo.save(any<AuditEventJpaEntity>())).thenAnswer { it.arguments[0] as AuditEventJpaEntity }

        writer.record(
            action = "SYSTEM_WRITE",
            entityType = "SYSTEM",
            entityId = "bootstrap",
            metadata = mapOf("scope" to "test"),
        )

        val captor = argumentCaptor<AuditEventJpaEntity>()
        verify(repo).save(captor.capture())
        assertEquals(null, captor.firstValue.actorId)
    }
}

