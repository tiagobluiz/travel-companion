package com.travelcompanion.integration

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
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
class TripAccessContractMatrixIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var tripRepository: TripRepository

    @Test
    fun `trip access matrix enforces private and public read contracts`() {
        val owner = ApiIntegrationFixture.register(mockMvc, "trip-owner")
        val member = ApiIntegrationFixture.register(mockMvc, "trip-member")
        val outsider = ApiIntegrationFixture.register(mockMvc, "trip-outsider")

        val privateTripId = ApiIntegrationFixture.createTrip(
            mockMvc = mockMvc,
            token = owner.token,
            name = "Private",
            startDate = "2026-09-01",
            endDate = "2026-09-05",
        )

        addMembership(privateTripId, member.userId, TripRole.VIEWER)

        mockMvc.get("/trips/$privateTripId") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$privateTripId") {
            header("Authorization", "Bearer ${member.token}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$privateTripId") {
            header("Authorization", "Bearer ${outsider.token}")
        }.andExpect {
            status { isNotFound() }
        }

        mockMvc.get("/trips/$privateTripId").andExpect {
            status { isNotFound() }
        }

        val publicTripResponse = mockMvc.post("/trips") {
            header("Authorization", "Bearer ${owner.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Public","startDate":"2026-10-01","endDate":"2026-10-03","visibility":"PUBLIC"}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val publicTripId = com.travelcompanion.support.JsonAssertions.stringAt(publicTripResponse.response.contentAsString, "id")

        mockMvc.get("/trips/$publicTripId").andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/${UUID.randomUUID()}") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isNotFound() }
        }
    }

    private fun addMembership(tripId: String, userId: com.travelcompanion.domain.user.UserId, role: TripRole) {
        val domainTripId = TripId.fromString(tripId)!!
        val trip = tripRepository.findById(domainTripId)!!
        val updated = trip.copy(memberships = trip.memberships + TripMembership(userId = userId, role = role))
        tripRepository.save(updated)
    }
}
