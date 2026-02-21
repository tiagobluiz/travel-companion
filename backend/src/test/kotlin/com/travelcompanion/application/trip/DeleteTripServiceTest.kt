package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.user.UserId
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class DeleteTripServiceTest {

    private val tripRepository = mock<TripRepository>()
    private val service = DeleteTripService(tripRepository)

    @Test
    fun `execute deletes trip when owner relationship exists`() {
        val tripId = TripId.generate()
        val userId = UserId.generate()
        whenever(tripRepository.existsByIdAndUserId(tripId, userId)).thenReturn(true)

        val deleted = service.execute(tripId, userId)

        assertTrue(deleted)
        verify(tripRepository).deleteById(tripId)
    }

    @Test
    fun `execute returns false when trip does not exist for user`() {
        val tripId = TripId.generate()
        val userId = UserId.generate()
        whenever(tripRepository.existsByIdAndUserId(tripId, userId)).thenReturn(false)

        val deleted = service.execute(tripId, userId)

        assertFalse(deleted)
        verify(tripRepository, never()).deleteById(tripId)
    }
}

