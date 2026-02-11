package com.travelcompanion.interfaces.rest

import com.travelcompanion.domain.user.UserId
import com.travelcompanion.infrastructure.audit.AuditQueryService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/audit/events")
class AuditController(
    private val auditQueryService: AuditQueryService,
) {

    @GetMapping
    fun search(
        authentication: Authentication,
        @RequestParam(required = false) entityType: String?,
        @RequestParam(required = false) entityId: String?,
        @RequestParam(required = false) actorId: String?,
        @RequestParam(required = false, defaultValue = "100") limit: Int,
    ): ResponseEntity<Any> {
        authentication.principal as? String ?: return ResponseEntity.status(401).build()
        val parsedActor = actorId?.let {
            UserId.fromString(it) ?: return ResponseEntity.badRequest().body(
                mapOf("message" to "Invalid actorId")
            )
        }

        val events = auditQueryService.search(
            entityType = entityType,
            entityId = entityId,
            actorId = parsedActor,
            limit = limit,
        )
        return ResponseEntity.ok(events)
    }
}
