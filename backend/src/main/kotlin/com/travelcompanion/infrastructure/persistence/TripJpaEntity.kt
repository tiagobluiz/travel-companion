package com.travelcompanion.infrastructure.persistence

import com.travelcompanion.domain.trip.ItineraryItem
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * JPA entity mapping for [com.travelcompanion.domain.trip.Trip].
 *
 * Persists trips with name, dates, and itinerary items stored as JSONB.
 * Itinerary items are serialized/deserialized via [ItineraryItemConverter].
 */
@Entity
@Table(name = "trips")
class TripJpaEntity(
    @Id
    @Column(name = "id", updatable = false)
    val id: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "itinerary_items", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = ItineraryItemConverter::class)
    var itineraryItems: MutableList<ItineraryItem> = mutableListOf(),

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant,
)
