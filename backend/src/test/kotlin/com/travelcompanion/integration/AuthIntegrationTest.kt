package com.travelcompanion.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID

/**
 * Integration tests for auth endpoints.
 *
 * Uses Testcontainers via jdbc:tc URL in application-integ.yml. Requires Docker.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integ")
class AuthIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `register creates user and returns token`() {
        val email = randomEmail()
        mockMvc.post("/auth/register") {
            content = """{"email":"$email","password":"password123","displayName":"Test User"}"""
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
            jsonPath("$.user.email") { value(email) }
            jsonPath("$.user.displayName") { value("Test User") }
        }
    }

    @Test
    fun `login returns token for valid credentials`() {
        val email = randomEmail()
        register(email, "pass1234", "Login User")

        mockMvc.post("/auth/login") {
            content = """{"email":"$email","password":"pass1234"}"""
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }
    }

    @Test
    fun `me endpoint returns authenticated user`() {
        val email = randomEmail()
        val token = register(email, "password123", "Current User")

        mockMvc.get("/auth/me") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.email") { value(email) }
            jsonPath("$.displayName") { value("Current User") }
        }
    }

    private fun register(email: String, password: String, displayName: String): String {
        val response = mockMvc.post("/auth/register") {
            content = """{"email":"$email","password":"$password","displayName":"$displayName"}"""
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()

        val body = response.response.contentAsString
        return """"token":"([^"]+)"""".toRegex().find(body)!!.groupValues[1]
    }

    private fun randomEmail() = "test-${UUID.randomUUID()}@example.com"
}
