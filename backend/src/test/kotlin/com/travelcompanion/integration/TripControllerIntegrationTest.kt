package com.travelcompanion.integration

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
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
    @Autowired
    private lateinit var tripRepository: TripRepository

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

    @Test
    fun `anonymous user can read public trip`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "Public Trip", "2026-09-01", "2026-09-05")

        mockMvc.put("/trips/$tripId") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId").andExpect {
            status { isOk() }
            jsonPath("$.id") { value(tripId) }
            jsonPath("$.visibility") { value("PUBLIC") }
        }
    }

    @Test
    fun `anonymous user cannot read private trip`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "Private Trip", "2026-09-10", "2026-09-12")

        mockMvc.get("/trips/$tripId").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `authenticated non member cannot read private trip`() {
        val ownerToken = registerAndGetToken()
        val tripId = createTrip(ownerToken, "Private Trip", "2026-09-10", "2026-09-12")
        val otherUserToken = registerAndGetToken()

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer $otherUserToken")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `editor can list and read private member trip`() {
        val ownerToken = registerAndGetToken()
        val tripId = createTrip(ownerToken, "Team Trip", "2026-09-10", "2026-09-12")
        val editor = registerAndGetAuth()
        addMembership(tripId, editor.second, TripRole.EDITOR)

        mockMvc.get("/trips") {
            header("Authorization", "Bearer ${editor.first}")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(tripId) }
        }

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${editor.first}")
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(tripId) }
        }
    }

    private fun registerAndGetToken(): String {
        return registerAndGetAuth().first
    }

    private fun registerAndGetAuth(): Pair<String, UserId> {
        val email = "trip-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Trip User"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()

        val body = response.response.contentAsString
        val token = extractJsonValue(body, "token")
        val userId = UserId.fromString(extractNthJsonValue(body, "id", 0))!!
        return token to userId
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

    private fun extractNthJsonValue(json: String, field: String, index: Int): String =
        """"$field":"([^"]+)"""".toRegex().findAll(json).toList()[index].groupValues[1]

    private fun addMembership(tripId: String, userId: UserId, role: TripRole) {
        val domainTripId = TripId.fromString(tripId)!!
        val trip = tripRepository.findById(domainTripId)!!
        val updated = trip.copy(memberships = trip.memberships + TripMembership(userId = userId, role = role))
        tripRepository.save(updated)
    }
}
