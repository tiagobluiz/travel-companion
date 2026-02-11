package com.travelcompanion.domain.trip

import com.travelcompanion.domain.user.UserId

data class TripMembership(
    val userId: UserId,
    val role: TripRole,
)

