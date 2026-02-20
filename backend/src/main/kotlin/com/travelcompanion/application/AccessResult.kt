package com.travelcompanion.application

sealed interface AccessResult<out T> {
    data class Success<T>(val value: T) : AccessResult<T>
    data object NotFound : AccessResult<Nothing>
    data object Forbidden : AccessResult<Nothing>
}

