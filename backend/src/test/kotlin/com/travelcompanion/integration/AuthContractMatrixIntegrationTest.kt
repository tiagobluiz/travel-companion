package com.travelcompanion.integration

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthContractMatrixIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `auth contract matrix covers register login and me`() {
        val registered = ApiIntegrationFixture.register(mockMvc, "auth-matrix")

        mockMvc.post("/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"${registered.email}","password":"password123","displayName":"dup"}"""
        }.andExpect {
            status { isConflict() }
        }

        mockMvc.post("/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"${registered.email}","password":"wrong"}"""
        }.andExpect {
            status { isUnauthorized() }
        }

        mockMvc.get("/auth/me").andExpect {
            status { isForbidden() }
        }

        mockMvc.get("/auth/me") {
            header("Authorization", "Bearer ${registered.token}")
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(registered.userId.toString()) }
            jsonPath("$.email") { value(registered.email) }
        }
    }
}
