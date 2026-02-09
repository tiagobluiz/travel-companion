package com.travelcompanion.domain.trip

import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.LocalDate

class ItineraryItemTest {

    @Test
    fun `rejects blank place name`() {
        assertThrows(IllegalArgumentException::class.java) {
            ItineraryItem(
                placeName = "   ",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 48.8566,
                longitude = 2.3522,
            )
        }
    }

    @Test
    fun `rejects latitude outside valid range`() {
        assertThrows(IllegalArgumentException::class.java) {
            ItineraryItem(
                placeName = "Paris",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 91.0,
                longitude = 2.3522,
            )
        }
    }

    @Test
    fun `rejects longitude outside valid range`() {
        assertThrows(IllegalArgumentException::class.java) {
            ItineraryItem(
                placeName = "Paris",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = 48.8566,
                longitude = -181.0,
            )
        }
    }

    @Test
    fun `accepts boundary coordinates`() {
        assertDoesNotThrow {
            ItineraryItem(
                placeName = "Boundary Place",
                date = LocalDate.of(2025, 6, 5),
                notes = "",
                latitude = -90.0,
                longitude = 180.0,
            )
        }
    }
}
