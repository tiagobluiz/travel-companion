package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.travelcompanion.domain.trip.ItineraryItem
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.time.LocalDate

/**
 * JPA attribute converter for [ItineraryItem] list to/from JSONB.
 *
 * Serializes itinerary items as JSON for storage in PostgreSQL jsonb column.
 */
@Converter
class ItineraryItemConverter : AttributeConverter<List<ItineraryItem>, String> {

    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
    }

    private val typeRef = object : TypeReference<List<ItineraryItemDto>>() {}

    override fun convertToDatabaseColumn(attribute: List<ItineraryItem>?): String {
        if (attribute == null || attribute.isEmpty()) return "[]"
        val dtos = attribute.map {
            ItineraryItemDto(
                placeName = it.placeName,
                date = it.date.toString(),
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
        return dtos.map {
            ItineraryItem(
                placeName = it.placeName,
                date = LocalDate.parse(it.date),
                notes = it.notes ?: "",
                latitude = it.latitude ?: throw IllegalArgumentException("Latitude is required"),
                longitude = it.longitude ?: throw IllegalArgumentException("Longitude is required"),
            )
        }
    }

    private data class ItineraryItemDto(
        val placeName: String,
        val date: String,
        val notes: String? = "",
        val latitude: Double? = null,
        val longitude: Double? = null,
    )
}

