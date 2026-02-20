package com.travelcompanion.infrastructure.audit

import com.fasterxml.jackson.databind.ObjectMapper
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.persistence.AuditEventJpaEntity
import com.travelcompanion.infrastructure.persistence.SpringDataAuditEventRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

class AuditQueryServiceTest {

    private val repo = mock<SpringDataAuditEventRepository>()
    private val service = AuditQueryService(repo)
    private val mapper = ObjectMapper()

    @Test
    fun `search maps repository entities to views`() {
        val actorId = UserId.generate()
        val event = AuditEventJpaEntity(
            id = UUID.randomUUID(),
            actorId = actorId.value,
            action = "TRIP_UPDATED",
            entityType = "TRIP",
            entityId = "trip-1",
            occurredAt = Instant.parse("2026-01-01T00:00:00Z"),
            beforeState = mapper.readTree("""{"name":"Old"}"""),
            afterState = mapper.readTree("""{"name":"New"}"""),
            metadata = mapper.readTree("""{"source":"unit"}"""),
        )
        whenever(repo.search(eq("TRIP"), eq("trip-1"), eq(actorId.value), any<Pageable>()))
            .thenReturn(listOf(event))

        val result = service.search("TRIP", "trip-1", actorId, 50)

        assertEquals(1, result.size)
        assertEquals(event.id.toString(), result[0].id)
        assertEquals(actorId.toString(), result[0].actorId)
        assertEquals("TRIP_UPDATED", result[0].action)
        assertEquals("Old", result[0].beforeState?.get("name")?.asText())
        assertEquals("New", result[0].afterState?.get("name")?.asText())
        assertEquals("unit", result[0].metadata.get("source").asText())
    }

    @Test
    fun `search coerces low limit to one`() {
        whenever(repo.search(eq(null), eq(null), eq(null), any<Pageable>())).thenReturn(emptyList())

        service.search(null, null, null, 0)

        val pageableCaptor = argumentCaptor<Pageable>()
        verify(repo).search(eq(null), eq(null), eq(null), pageableCaptor.capture())
        assertEquals(1, pageableCaptor.firstValue.pageSize)
    }

    @Test
    fun `search coerces high limit to five hundred`() {
        whenever(repo.search(eq(null), eq(null), eq(null), any<Pageable>())).thenReturn(emptyList())

        service.search(null, null, null, 5_000)

        val pageableCaptor = argumentCaptor<Pageable>()
        verify(repo).search(eq(null), eq(null), eq(null), pageableCaptor.capture())
        assertEquals(500, pageableCaptor.firstValue.pageSize)
    }
}

