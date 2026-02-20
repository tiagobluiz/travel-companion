package com.travelcompanion.support

import com.travelcompanion.domain.user.UserId
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import java.util.UUID

object ApiIntegrationFixture {

    data class AuthFixture(
        val token: String,
        val userId: UserId,
        val email: String,
    )

    fun register(mockMvc: MockMvc, prefix: String = "user"): AuthFixture {
        val email = "$prefix-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"$prefix user"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
            jsonPath("$.user.id") { exists() }
        }.andReturn()

        val body = response.response.contentAsString
        val token = JsonAssertions.stringAt(body, "token")
        val userId = UserId.fromString(JsonAssertions.stringAt(body, "user.id"))!!
        return AuthFixture(token = token, userId = userId, email = email)
    }

    fun createTrip(
        mockMvc: MockMvc,
        token: String,
        name: String = "Trip",
        startDate: String,
        endDate: String,
    ): String {
        val response = mockMvc.post("/trips") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name","startDate":"$startDate","endDate":"$endDate"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
        }.andReturn()
        return JsonAssertions.stringAt(response.response.contentAsString, "id")
    }
}

