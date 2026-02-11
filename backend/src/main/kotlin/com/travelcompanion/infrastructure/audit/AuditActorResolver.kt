package com.travelcompanion.infrastructure.audit

import com.travelcompanion.domain.user.UserId
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class AuditActorResolver {

    fun currentActorId(): UserId? {
        val principal = SecurityContextHolder.getContext().authentication?.principal as? String ?: return null
        return UserId.fromString(principal)
    }
}

