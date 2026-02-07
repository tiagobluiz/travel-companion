package com.travelcompanion

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
 * Entry point for the Travel Companion backend application.
 *
 * This Spring Boot application provides a REST API for travel planning and expense tracking,
 * serving the mobile-first Travel Companion web client.
 */
@SpringBootApplication
class TravelCompanionApplication

fun main(args: Array<String>) {
    runApplication<TravelCompanionApplication>(*args)
}
