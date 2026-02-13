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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `audit events endpoint returns queryable trip audit records`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "Audit Trip", "2026-09-01", "2026-09-05")

        mockMvc.get("/audit/events") {
            header("Authorization", "Bearer $token")
            param("entityType", "TRIP")
            param("entityId", tripId)
            param("limit", "10")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].entityType") { value("TRIP") }
            jsonPath("$[0].entityId") { value(tripId) }
            jsonPath("$[0].action") { value("TRIP_CREATED") }
            jsonPath("$[0].metadata.aggregate") { value("trip") }
        }
    }

    @Test
    fun `audit events rejects invalid actorId filter`() {
        val token = registerAndGetToken()

        mockMvc.get("/audit/events") {
            header("Authorization", "Bearer $token")
            param("actorId", "invalid-uuid")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.message") { value("Invalid actorId") }
        }
    }

    private fun registerAndGetToken(): String {
        val email = "audit-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Audit User"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()

        return extractJsonValue(response.response.contentAsString, "token")
    }

    private fun createTrip(token: String, name: String, startDate: String, endDate: String): String {
        val response = mockMvc.post("/trips") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name","startDate":"$startDate","endDate":"$endDate"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
        }.andReturn()

        return extractJsonValue(response.response.contentAsString, "id")
    }

    private fun extractJsonValue(json: String, field: String): String =
        """"$field":"([^"]+)"""".toRegex().find(json)!!.groupValues[1]
}
