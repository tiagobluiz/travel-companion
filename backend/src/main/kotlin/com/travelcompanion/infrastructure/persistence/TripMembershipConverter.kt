package com.travelcompanion.infrastructure.persistence

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class TripMembershipConverter : AttributeConverter<List<TripMembership>, String> {

    private val objectMapper = ObjectMapper().apply {
        registerModule(KotlinModule.Builder().build())
    }

    private val typeRef = object : TypeReference<List<TripMembershipDto>>() {}

    override fun convertToDatabaseColumn(attribute: List<TripMembership>?): String {
        if (attribute == null || attribute.isEmpty()) return "[]"
        val dtos = attribute.map {
            TripMembershipDto(
                userId = it.userId.toString(),
                role = it.role.name,
            )
        }
        return objectMapper.writeValueAsString(dtos)
    }

    override fun convertToEntityAttribute(dbData: String?): List<TripMembership> {
        if (dbData == null || dbData.isBlank()) return emptyList()
        val dtos = objectMapper.readValue(dbData, typeRef)
        return dtos.map {
            TripMembership(
                userId = UserId.fromString(it.userId)
                    ?: throw IllegalArgumentException("Invalid membership user id: ${it.userId}"),
                role = TripRole.valueOf(it.role),
            )
        }
    }

    data class TripMembershipDto(
        val userId: String,
        val role: String,
    )
}

