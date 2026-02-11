package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.TripRole
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.time.Instant

@Converter
class TripInviteConverter : AttributeConverter<List<TripInvite>, String> {

    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
        registerModule(KotlinModule.Builder().build())
    }

    private val typeRef = object : TypeReference<List<TripInviteDto>>() {}

    override fun convertToDatabaseColumn(attribute: List<TripInvite>?): String {
        if (attribute == null || attribute.isEmpty()) return "[]"
        val dtos = attribute.map {
            TripInviteDto(
                email = it.email,
                role = it.role.name,
                status = it.status.name,
                createdAt = it.createdAt.toString(),
            )
        }
        return objectMapper.writeValueAsString(dtos)
    }

    override fun convertToEntityAttribute(dbData: String?): List<TripInvite> {
        if (dbData == null || dbData.isBlank()) return emptyList()
        val dtos = objectMapper.readValue(dbData, typeRef)
        return dtos.map {
            TripInvite(
                email = it.email,
                role = TripRole.valueOf(it.role),
                status = InviteStatus.valueOf(it.status),
                createdAt = Instant.parse(it.createdAt),
            )
        }
    }

    data class TripInviteDto(
        val email: String,
        val role: String,
        val status: String,
        val createdAt: String,
    )
}

