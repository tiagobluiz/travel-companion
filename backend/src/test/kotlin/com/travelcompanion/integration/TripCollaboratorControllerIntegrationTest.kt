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
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TripCollaboratorControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var tripRepository: TripRepository

    @Test
    fun `pending invite is visible and role can be changed`() {
        val ownerToken = registerAndGetToken()
        val tripId = createTrip(ownerToken, "Team Trip", "2026-10-01", "2026-10-10")

        mockMvc.post("/trips/$tripId/invites") {
            header("Authorization", "Bearer $ownerToken")
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"pending@example.com","role":"VIEWER"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.invites[0].email") { value("pending@example.com") }
            jsonPath("$.invites[0].status") { value("PENDING") }
        }

        mockMvc.patch("/trips/$tripId/invites/role?email=pending@example.com") {
            header("Authorization", "Bearer $ownerToken")
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"EDITOR"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.invites[0].role") { value("EDITOR") }
            jsonPath("$.invites[0].status") { value("PENDING") }
        }

        mockMvc.get("/trips/$tripId/collaborators") {
            header("Authorization", "Bearer $ownerToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.invites[0].status") { value("PENDING") }
        }
    }

    @Test
    fun `owner can remove pending user invite`() {
        val ownerToken = registerAndGetToken()
        val tripId = createTrip(ownerToken, "Team Trip", "2026-11-01", "2026-11-04")

        mockMvc.post("/trips/$tripId/invites") {
            header("Authorization", "Bearer $ownerToken")
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"pending-remove@example.com","role":"VIEWER"}"""
        }.andExpect {
            status { isOk() }
        }

        mockMvc.delete("/trips/$tripId/invites?email=pending-remove@example.com") {
            header("Authorization", "Bearer $ownerToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.invites.length()") { value(0) }
        }
    }

    @Test
    fun `member can self remove via leave endpoint`() {
        val ownerToken = registerAndGetToken()
        val tripId = createTrip(ownerToken, "Team Trip", "2026-12-01", "2026-12-04")
        val member = registerAndGetAuth()

        addMembership(tripId, member.second, TripRole.VIEWER)

        mockMvc.delete("/trips/$tripId/members/me") {
            header("Authorization", "Bearer ${member.first}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId/collaborators") {
            header("Authorization", "Bearer $ownerToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.memberships[?(@.userId=='${member.second}')]") { isEmpty() }
        }
    }

    private fun registerAndGetToken(): String = registerAndGetAuth().first

    private fun registerAndGetAuth(): Pair<String, UserId> {
        val email = "collab-${UUID.randomUUID()}@example.com"
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
        "\"$field\":\"([^\"]+)\"".toRegex().find(json)!!.groupValues[1]

    private fun extractNthJsonValue(json: String, field: String, index: Int): String {
        val matches = "\"$field\":\"([^\"]+)\"".toRegex().findAll(json).toList()
        if (index < 0 || index >= matches.size) {
            throw IllegalStateException(
                "Expected field \"$field\" at index $index, but found ${matches.size} matches in response: $json"
            )
        }
        return matches[index].groupValues[1]
    }

    private fun addMembership(tripId: String, userId: UserId, role: TripRole) {
        val domainTripId = TripId.fromString(tripId)!!
        val trip = tripRepository.findById(domainTripId)!!
        val updated = trip.copy(memberships = trip.memberships + TripMembership(userId = userId, role = role))
        tripRepository.save(updated)
    }
}
