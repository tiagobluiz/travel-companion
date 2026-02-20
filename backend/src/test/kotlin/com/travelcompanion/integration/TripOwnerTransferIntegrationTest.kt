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
import org.springframework.test.web.servlet.post
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integ")
class TripOwnerTransferIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var tripRepository: TripRepository

    @Test
    fun `owner transfer persists and successor can perform owner-only delete`() {
        val originalOwner = registerAndGetAuth("owner")
        val successorOwner = registerAndGetAuth("successor")
        val tripId = createTrip(originalOwner.first, "2026-11-01", "2026-11-04")

        addMembership(tripId, successorOwner.second, TripRole.VIEWER)

        mockMvc.delete("/trips/$tripId/members/me") {
            header("Authorization", "Bearer ${originalOwner.first}")
            param("successorOwnerUserId", successorOwner.second.toString())
        }.andExpect {
            status { isOk() }
        }

        mockMvc.delete("/trips/$tripId") {
            header("Authorization", "Bearer ${successorOwner.first}")
        }.andExpect {
            status { isNoContent() }
        }
    }

    private fun registerAndGetAuth(prefix: String): Pair<String, UserId> {
        val email = "$prefix-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"$prefix user"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()

        val body = response.response.contentAsString
        val token = extractJsonValue(body, "token")
        val userId = UserId.fromString(extractNthJsonValue(body, "id", 0))!!
        return token to userId
    }

    private fun createTrip(token: String, startDate: String, endDate: String): String {
        val response = mockMvc.post("/trips") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Owner Transfer Trip","startDate":"$startDate","endDate":"$endDate"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
        }.andReturn()
        return extractJsonValue(response.response.contentAsString, "id")
    }

    private fun addMembership(tripId: String, userId: UserId, role: TripRole) {
        val domainTripId = TripId.fromString(tripId)!!
        val trip = tripRepository.findById(domainTripId)!!
        val updated = trip.copy(memberships = trip.memberships + TripMembership(userId = userId, role = role))
        tripRepository.save(updated)
    }

    private fun extractJsonValue(json: String, field: String): String =
        """"$field":"([^"]+)"""".toRegex().find(json)!!.groupValues[1]

    private fun extractNthJsonValue(json: String, field: String, index: Int): String {
        val matches = """"$field":"([^"]+)"""".toRegex().findAll(json).toList()
        if (index < 0 || index >= matches.size) {
            throw IllegalStateException(
                "Expected field \"$field\" at index $index, but found ${matches.size} matches in response: $json"
            )
        }
        return matches[index].groupValues[1]
    }
}

