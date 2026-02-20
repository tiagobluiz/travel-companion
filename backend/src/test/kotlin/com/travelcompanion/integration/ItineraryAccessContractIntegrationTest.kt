package com.travelcompanion.integration

import com.travelcompanion.support.ApiIntegrationFixture
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
class ItineraryAccessContractIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `itinerary contract matrix distinguishes forbidden and not found`() {
        val owner = ApiIntegrationFixture.register(mockMvc, "itn-owner")
        val outsider = ApiIntegrationFixture.register(mockMvc, "itn-outsider")
        val tripId = ApiIntegrationFixture.createTrip(
            mockMvc = mockMvc,
            token = owner.token,
            name = "Itinerary Matrix",
            startDate = "2026-08-10",
            endDate = "2026-08-15",
        )

        mockMvc.get("/trips/$tripId/itinerary/v2") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId/itinerary/v2") {
            header("Authorization", "Bearer ${outsider.token}")
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.get("/trips/$tripId/itinerary/v2").andExpect {
            status { isUnauthorized() }
        }

        mockMvc.get("/trips/${UUID.randomUUID()}/itinerary/v2") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isNotFound() }
        }

        mockMvc.post("/trips/$tripId/itinerary/v2/items") {
            header("Authorization", "Bearer ${outsider.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"placeName":"Museum","notes":"Visit","latitude":10.0,"longitude":20.0,"dayNumber":1}"""
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.post("/trips/$tripId/itinerary/v2/items") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"placeName":"Museum","notes":"Visit","latitude":10.0,"longitude":20.0,"dayNumber":1}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }
}
