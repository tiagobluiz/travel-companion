package com.travelcompanion.support

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper

object JsonAssertions {
    private val objectMapper = ObjectMapper()

    fun read(json: String): JsonNode = objectMapper.readTree(json)

    fun stringAt(json: String, field: String): String {
        val value = field.split('.').fold(read(json)) { node, segment -> node.path(segment) }
        require(!value.isMissingNode && !value.isNull) { "Missing non-null field: $field" }
        return value.asText()
    }
}
