package com.travelcompanion.application.trip

import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripStatus

enum class TripListStatusFilter {
    ACTIVE,
    ARCHIVED,
    ALL,
    ;

    fun matches(trip: Trip): Boolean = when (this) {
        ACTIVE -> trip.status == TripStatus.ACTIVE
        ARCHIVED -> trip.status == TripStatus.ARCHIVED
        ALL -> true
    }
}
