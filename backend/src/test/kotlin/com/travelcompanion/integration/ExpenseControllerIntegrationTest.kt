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
class ExpenseControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `expense create list update delete works end to end`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "2026-08-08", "2026-08-16")

        val createResponse = mockMvc.post("/trips/$tripId/expenses") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":120.50,"currency":"usd","description":"Hotel","date":"2026-08-10"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.currency") { value("USD") }
            jsonPath("$.description") { value("Hotel") }
        }.andReturn()
        val expenseId = extractJsonValue(createResponse.response.contentAsString, "id")

        mockMvc.get("/trips/$tripId/expenses") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(expenseId) }
        }

        mockMvc.put("/trips/$tripId/expenses/$expenseId") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"description":"Updated hotel"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.description") { value("Updated hotel") }
        }

        mockMvc.delete("/trips/$tripId/expenses/$expenseId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isNoContent() }
        }
    }

    @Test
    fun `expense rejects date outside trip range`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "2026-08-08", "2026-08-16")

        mockMvc.post("/trips/$tripId/expenses") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":10.00,"currency":"USD","description":"Invalid","date":"2025-01-01"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.message") { exists() }
        }
    }

    private fun registerAndGetToken(): String {
        val email = "expense-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Expense User"}"""
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
