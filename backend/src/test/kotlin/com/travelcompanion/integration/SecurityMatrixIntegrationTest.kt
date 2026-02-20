package com.travelcompanion.integration

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.InviteStatus
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
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.time.Instant
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integ")
class SecurityMatrixIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var tripRepository: TripRepository

    @Test
    fun `private trip read matrix covers owner editor viewer anonymous`() {
        val owner = registerAndGetAuth("owner")
        val editor = registerAndGetAuth("editor")
        val viewer = registerAndGetAuth("viewer")
        val tripId = createTrip(owner.first, "Matrix Trip", "2026-12-20", "2026-12-25")

        addMembership(tripId, editor.second, TripRole.EDITOR)
        addMembership(tripId, viewer.second, TripRole.VIEWER)

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${owner.first}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${editor.first}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${viewer.first}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `pending invite cannot read private trip`() {
        val owner = registerAndGetAuth("owner")
        val invitee = registerAndGetAuth("pending")
        val tripId = createTrip(owner.first, "Invite Pending", "2026-12-21", "2026-12-25")

        setInviteState(tripId, invitee.third, InviteStatus.PENDING)

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${invitee.first}")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `accepted invite can read private trip`() {
        val owner = registerAndGetAuth("owner")
        val invitee = registerAndGetAuth("accepted")
        val tripId = createTrip(owner.first, "Invite Accepted", "2026-12-22", "2026-12-25")

        setInviteState(tripId, invitee.third, InviteStatus.ACCEPTED)
        addMembership(tripId, invitee.second, TripRole.VIEWER)

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${invitee.first}")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `declined invite cannot read private trip`() {
        val owner = registerAndGetAuth("owner")
        val invitee = registerAndGetAuth("declined")
        val tripId = createTrip(owner.first, "Invite Declined", "2026-12-23", "2026-12-25")

        setInviteState(tripId, invitee.third, InviteStatus.DECLINED)

        mockMvc.get("/trips/$tripId") {
            header("Authorization", "Bearer ${invitee.first}")
        }.andExpect {
            status { isNotFound() }
        }
    }

    private fun registerAndGetAuth(prefix: String): Triple<String, UserId, String> {
        val email = "$prefix-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"$prefix User"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()

        val body = response.response.contentAsString
        val token = extractJsonValue(body, "token")
        val userId = UserId.fromString(extractNthJsonValue(body, "id", 0))!!
        return Triple(token, userId, email)
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

    private fun setInviteState(tripId: String, email: String, status: InviteStatus) {
        val domainTripId = TripId.fromString(tripId)!!
        val trip = tripRepository.findById(domainTripId)!!
        val updated = trip.copy(
            invites = listOf(
                TripInvite(
                    email = email,
                    role = TripRole.VIEWER,
                    status = status,
                    createdAt = Instant.now(),
                )
            )
        )
        tripRepository.save(updated)
    }
}
