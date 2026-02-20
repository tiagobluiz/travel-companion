package com.travelcompanion.integration

import com.travelcompanion.support.ApiIntegrationFixture
import com.travelcompanion.support.JsonAssertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integ")
class ExpenseAccessContractIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `expense contract matrix enforces forbidden not-found and route invariant`() {
        val owner = ApiIntegrationFixture.register(mockMvc, "exp-owner")
        val outsider = ApiIntegrationFixture.register(mockMvc, "exp-outsider")
        val tripA = ApiIntegrationFixture.createTrip(
            mockMvc = mockMvc,
            token = owner.token,
            name = "Trip A",
            startDate = "2026-12-01",
            endDate = "2026-12-05",
        )
        val tripB = ApiIntegrationFixture.createTrip(
            mockMvc = mockMvc,
            token = owner.token,
            name = "Trip B",
            startDate = "2026-12-10",
            endDate = "2026-12-15",
        )

        val createResponse = mockMvc.post("/trips/$tripA/expenses") {
            header("Authorization", "Bearer ${owner.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":50.00,"currency":"USD","description":"Dinner","date":"2026-12-02"}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val expenseId = JsonAssertions.stringAt(createResponse.response.contentAsString, "id")

        mockMvc.get("/trips/$tripA/expenses") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripA/expenses") {
            header("Authorization", "Bearer ${outsider.token}")
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.get("/trips/$tripA/expenses").andExpect {
            status { isForbidden() }
        }

        mockMvc.post("/trips/$tripA/expenses") {
            header("Authorization", "Bearer ${outsider.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":20.00,"currency":"USD","description":"Taxi","date":"2026-12-03"}"""
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.post("/trips/$tripA/expenses") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":20.00,"currency":"USD","description":"Taxi","date":"2026-12-03"}"""
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.put("/trips/$tripB/expenses/$expenseId") {
            header("Authorization", "Bearer ${owner.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":55.00,"currency":"USD","description":"Dinner+","date":"2026-12-02"}"""
        }.andExpect {
            status { isNotFound() }
        }

        mockMvc.put("/trips/$tripA/expenses/$expenseId") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":55.00,"currency":"USD","description":"Dinner+","date":"2026-12-02"}"""
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.put("/trips/${UUID.randomUUID()}/expenses/${UUID.randomUUID()}") {
            header("Authorization", "Bearer ${owner.token}")
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount":10.00,"currency":"USD","description":"X","date":"2026-12-01"}"""
        }.andExpect {
            status { isNotFound() }
        }
    }
}
