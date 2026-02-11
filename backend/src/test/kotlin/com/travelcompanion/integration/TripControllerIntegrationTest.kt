package com.travelcompanion.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TripControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `trip CRUD works end to end`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "Summer Trip", "2026-08-08", "2026-08-16")

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(tripId) }
            jsonPath("$.name") { value("Summer Trip") }
            jsonPath("$.startDate") { value("2026-08-08") }
            jsonPath("$.endDate") { value("2026-08-16") }
            jsonPath("$.visibility") { value("PRIVATE") }
        }

        mockMvc.put("/trips/$tripId") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated Trip","visibility":"PUBLIC"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Updated Trip") }
            jsonPath("$.visibility") { value("PUBLIC") }
        }

        mockMvc.get("/trips") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(tripId) }
        }

        mockMvc.delete("/trips/$tripId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isNoContent() }
        }
    }

    @Test
    fun `trip endpoints require authentication`() {
        mockMvc.get("/trips").andExpect {
            status { is4xxClientError() }
        }
    }

    private fun registerAndGetToken(): String {
        val email = "trip-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Trip User"}"""
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
