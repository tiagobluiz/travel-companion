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
class ExpenseControllerRouteInvariantIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `update and delete reject expense when it does not belong to trip path`() {
        val token = registerAndGetToken()
        val tripA = createTrip(token, "Trip A", "2026-08-08", "2026-08-16")
        val tripB = createTrip(token, "Trip B", "2026-09-08", "2026-09-16")
        val expenseId = createExpense(token, tripA, "2026-08-10")

        mockMvc.put("/trips/$tripB/expenses/$expenseId") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"description":"invalid update path"}"""
        }.andExpect {
            status { isNotFound() }
        }

        mockMvc.delete("/trips/$tripB/expenses/$expenseId") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `update succeeds when expense belongs to trip path`() {
        val token = registerAndGetToken()
        val tripId = createTrip(token, "Trip Match", "2026-10-01", "2026-10-05")
        val expenseId = createExpense(token, tripId, "2026-10-03")

        mockMvc.put("/trips/$tripId/expenses/$expenseId") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"description":"valid update path"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.description") { value("valid update path") }
        }
    }

    private fun registerAndGetToken(): String {
        val email = "expense-route-${UUID.randomUUID()}@example.com"
        val response = mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","password":"password123","displayName":"Expense Route User"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
        }.andReturn()
        return extractJsonValue(response.response.contentAsString, "token")
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

    private fun createExpense(token: String, tripId: String, date: String): String {
        val response = mockMvc.post("/trips/$tripId/expenses") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":10.00,"currency":"USD","description":"route-check","date":"$date"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
        }.andReturn()
        return extractJsonValue(response.response.contentAsString, "id")
    }

    private fun extractJsonValue(json: String, field: String): String =
        """"$field":"([^"]+)"""".toRegex().find(json)!!.groupValues[1]
}

