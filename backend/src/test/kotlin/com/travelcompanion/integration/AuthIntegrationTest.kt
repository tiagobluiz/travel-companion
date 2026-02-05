package com.travelcompanion.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

/**
 * Integration tests for auth endpoints.
 *
 * Uses Testcontainers via jdbc:tc URL in application-test.yml. Requires Docker.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `register creates user and returns token`() {
        mockMvc.post("/auth/register") {
            content = """{"email":"test@example.com","password":"password123","displayName":"Test User"}"""
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isCreated }
            jsonPath("$.token") { exists() }
            jsonPath("$.user.email") { value("test@example.com") }
            jsonPath("$.user.displayName") { value("Test User") }
        }
    }

    @Test
    fun `login returns token for valid credentials`() {
        mockMvc.post("/auth/register") {
            content = """{"email":"login@example.com","password":"pass123","displayName":"Login User"}"""
            contentType = MediaType.APPLICATION_JSON
        }

        mockMvc.post("/auth/login") {
            content = """{"email":"login@example.com","password":"pass123"}"""
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk }
            jsonPath("$.token") { exists() }
        }
    }
}
