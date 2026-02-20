package com.travelcompanion.interfaces.rest.support

import com.travelcompanion.domain.user.UserId
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component

@Component
class AuthPrincipalResolver {

    fun userId(authentication: Authentication?): UserId? {
        val principal = authentication?.principal as? String ?: return null
        return UserId.fromString(principal)
    }
}

