package com.travelcompanion.integration

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.get
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integ")
class ItineraryControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `itinerary v2 supports places day assignment and relative move`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "2026-08-08", "2026-08-10")

        val first = mockMvc.post("/trips/$tripId/itinerary/v2/items") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"placeName":"A","notes":"","latitude":10.0,"longitude":20.0,"dayNumber":1}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()

        val firstId = extractJsonValue(first.response.contentAsString, "id")

        val second = mockMvc.post("/trips/$tripId/itinerary/v2/items") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"placeName":"B","notes":"","latitude":11.0,"longitude":21.0,"dayNumber":1}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()

        val secondId = extractNthJsonValue(second.response.contentAsString, "id", 1)

        val places = mockMvc.post("/trips/$tripId/itinerary/v2/items") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"placeName":"Wishlist","notes":"","latitude":12.0,"longitude":22.0}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()

        val placesId = extractNthJsonValue(places.response.contentAsString, "id", 2)

        mockMvc.post("/trips/$tripId/itinerary/v2/items/$placesId/move") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetDayNumber":1,"beforeItemId":"$firstId"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.days[0].items[0].id") { value(placesId) }
        }

        mockMvc.post("/trips/$tripId/itinerary/v2/items/$firstId/move") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetDayNumber":1,"afterItemId":"$secondId"}"""
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId/itinerary/v2") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.days[0].items[0].id") { value(placesId) }
            jsonPath("$.days[0].items[1].id") { value(secondId) }
            jsonPath("$.days[0].items[2].id") { value(firstId) }
            jsonPath("$.placesToVisit.items.length()") { value(0) }
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

    private fun extractNthJsonValue(json: String, field: String, index: Int): String =
        """"$field":"([^"]+)"""".toRegex().findAll(json).toList()[index].groupValues[1]
}
