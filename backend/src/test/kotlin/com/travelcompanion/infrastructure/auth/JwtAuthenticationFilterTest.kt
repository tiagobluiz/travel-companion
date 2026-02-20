package com.travelcompanion.infrastructure.auth

import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder

class JwtAuthenticationFilterTest {

    private val jwtService = JwtService(
        secret = "0123456789abcdef0123456789abcdef",
        expirationMs = 60_000,
    )
    private val filter = JwtAuthenticationFilter(jwtService, "access_token")

    @AfterEach
    fun clearSecurityContext() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `uses bearer token when header and cookie are both present`() {
        val headerToken = jwtService.createToken("user-header", "header@example.com")
        val cookieToken = jwtService.createToken("user-cookie", "cookie@example.com")
        val request = MockHttpServletRequest().apply {
            addHeader("Authorization", "Bearer $headerToken")
            setCookies(Cookie("access_token", cookieToken))
        }

        filter.doFilter(request, MockHttpServletResponse(), MockFilterChain())

        assertEquals("user-header", SecurityContextHolder.getContext().authentication?.principal)
    }

    @Test
    fun `authenticates using cookie token when header is absent`() {
        val cookieToken = jwtService.createToken("user-cookie", "cookie@example.com")
        val request = MockHttpServletRequest().apply {
            setCookies(Cookie("access_token", cookieToken))
        }

        filter.doFilter(request, MockHttpServletResponse(), MockFilterChain())

        assertEquals("user-cookie", SecurityContextHolder.getContext().authentication?.principal)
    }

    @Test
    fun `does not authenticate when cookie token is invalid`() {
        val request = MockHttpServletRequest().apply {
            setCookies(Cookie("access_token", "invalid-token"))
        }

        filter.doFilter(request, MockHttpServletResponse(), MockFilterChain())

        assertNull(SecurityContextHolder.getContext().authentication)
    }
}

