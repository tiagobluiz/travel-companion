package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.domain.trip.ItineraryItem
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.time.LocalDate
import java.util.UUID

/**
 * JPA attribute converter for [ItineraryItem] list to/from JSONB.
 *
 * Serializes itinerary items as JSON for storage in PostgreSQL jsonb column.
 */
@Converter
class ItineraryItemConverter : AttributeConverter<List<ItineraryItem>, String> {

    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
        registerModule(KotlinModule.Builder().build())
    }

    private val typeRef = object : TypeReference<List<ItineraryItemDto>>() {}

    override fun convertToDatabaseColumn(attribute: List<ItineraryItem>?): String {
        if (attribute == null || attribute.isEmpty()) return "[]"
        val dtos = attribute.map {
            ItineraryItemDto(
                id = it.id.toString(),
                placeName = it.placeName,
                date = it.date.toString(),
                isInPlacesToVisit = it.isInPlacesToVisit,
                notes = it.notes,
                latitude = it.latitude,
                longitude = it.longitude,
            )
        }
        return objectMapper.writeValueAsString(dtos)
    }

    override fun convertToEntityAttribute(dbData: String?): List<ItineraryItem> {
        if (dbData == null || dbData.isBlank()) return emptyList()
        val dtos = objectMapper.readValue(dbData, typeRef)
        return dtos.mapIndexed { index, it ->
            ItineraryItem(
                placeName = it.placeName,
                date = it.date?.let { value -> LocalDate.parse(value) } ?: throw IllegalArgumentException("Date is required"),
                isInPlacesToVisit = it.isInPlacesToVisit ?: false,
                notes = it.notes ?: "",
                latitude = it.latitude ?: throw IllegalArgumentException("Latitude is required"),
                longitude = it.longitude ?: throw IllegalArgumentException("Longitude is required"),
                id = it.id?.let(UUID::fromString) ?: legacyStableId(it, index),
            )
        }
    }

    private fun legacyStableId(item: ItineraryItemDto, index: Int): UUID {
        val seed = "${item.placeName}|${item.date}|${item.notes}|${item.latitude}|${item.longitude}|$index"
        return UUID.nameUUIDFromBytes(seed.toByteArray())
    }

    data class ItineraryItemDto(
        val id: String? = null,
        val placeName: String,
        val date: String? = null,
        val isInPlacesToVisit: Boolean? = null,
        val notes: String? = "",
        val latitude: Double? = null,
        val longitude: Double? = null,
    )
}

