package com.travelcompanion.domain.trip

/**
 * Current trip visibility levels.
 *
 * Keep this enum as the single visibility contract so adding future values
 * (for example link-only/shared scopes) remains a domain-level change.
 */
enum class TripVisibility {
    PUBLIC,
    PRIVATE,
}

