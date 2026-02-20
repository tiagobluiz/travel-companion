package com.travelcompanion.integration

import com.travelcompanion.support.ApiIntegrationFixture
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CollaboratorAccessContractMatrixIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `collaborator contract matrix returns expected auth outcomes`() {
        val owner = ApiIntegrationFixture.register(mockMvc, "collab-owner")
        val outsider = ApiIntegrationFixture.register(mockMvc, "collab-outsider")
        val tripId = ApiIntegrationFixture.createTrip(
            mockMvc = mockMvc,
            token = owner.token,
            name = "Collab Trip",
            startDate = "2026-11-01",
            endDate = "2026-11-05",
        )

        mockMvc.get("/trips/$tripId/collaborators") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/trips/$tripId/collaborators") {
            header("Authorization", "Bearer ${outsider.token}")
        }.andExpect {
            status { isForbidden() }
        }

        mockMvc.get("/trips/${UUID.randomUUID()}/collaborators") {
            header("Authorization", "Bearer ${owner.token}")
        }.andExpect {
            status { isNotFound() }
        }
    }
}
