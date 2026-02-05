package com.travelcompanion.infrastructure.auth

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Filter that extracts JWT from the Authorization header or cookie and authenticates
 * the request.
 *
 * If a valid JWT is found, sets the authentication in the SecurityContext.
 * The token can be provided as "Bearer <token>" in the Authorization header or
 * in the configured cookie.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    @Value("\${app.jwt.cookie-name:access_token}")
    private val cookieName: String,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val token = extractToken(request) ?: run {
            filterChain.doFilter(request, response)
            return
        }

        try {
            val claims = jwtService.parseToken(token)
            val userId = claims.subject
            val email = claims["email"] as? String ?: ""

            if (SecurityContextHolder.getContext().authentication == null) {
                val auth = UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    emptyList(),
                ).apply {
                    details = WebAuthenticationDetailsSource().buildDetails(request)
                }
                request.setAttribute("userId", userId)
                request.setAttribute("userEmail", email)
                SecurityContextHolder.getContext().authentication = auth
            }
        } catch (_: Exception) {
            // Invalid or expired token - do not authenticate
        }

        filterChain.doFilter(request, response)
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val authHeader = request.getHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).takeIf { it.isNotBlank() }
        }
        request.cookies?.find { it.name == cookieName }?.value?.takeIf { it.isNotBlank() }
        return null
    }
}
