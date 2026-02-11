package com.travelcompanion.domain.trip

import java.time.Instant

data class TripInvite(
    val email: String,
    val role: TripRole,
    val status: InviteStatus,
    val createdAt: Instant,
) {
    init {
        require(email.isNotBlank()) { "Invite email cannot be blank" }
    }
}

