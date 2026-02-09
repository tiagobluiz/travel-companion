package com.travelcompanion.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ItineraryControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `itinerary add update remove works end to end`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "2026-08-08", "2026-08-16")

        mockMvc.post("/trips/$tripId/itinerary") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"placeName":"Museum","date":"2026-08-10","notes":"visit","latitude":10.1,"longitude":20.2}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.itineraryItems[0].placeName") { value("Museum") }
            jsonPath("$.itineraryItems[0].date") { value("2026-08-10") }
        }

        mockMvc.put("/trips/$tripId/itinerary/0") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"placeName":"Park","date":"2026-08-11","notes":"walk","latitude":11.0,"longitude":21.0}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.itineraryItems[0].placeName") { value("Park") }
            jsonPath("$.itineraryItems[0].date") { value("2026-08-11") }
        }

        mockMvc.delete("/trips/$tripId/itinerary/0") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.itineraryItems.length()") { value(0) }
        }
    }

    @Test
    fun `itinerary rejects date outside trip range`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "2026-08-08", "2026-08-16")

        mockMvc.post("/trips/$tripId/itinerary") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"placeName":"Invalid","date":"2025-01-01","notes":"x","latitude":1.0,"longitude":1.0}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.message") { exists() }
        }
    }

    private fun registerAndGetToken(): String {
        val email = "itinerary-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Itinerary User"}"""
        }.andReturn()
        return extractJsonValue(response.response.contentAsString, "token")
    }

    private fun createTrip(token: String, startDate: String, endDate: String): String {
        val response = mockMvc.post("/trips") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Trip","startDate":"$startDate","endDate":"$endDate"}"""
        }.andReturn()
        return extractJsonValue(response.response.contentAsString, "id")
    }

    private fun extractJsonValue(json: String, field: String): String =
        """"$field":"([^"]+)"""".toRegex().find(json)!!.groupValues[1]
}
