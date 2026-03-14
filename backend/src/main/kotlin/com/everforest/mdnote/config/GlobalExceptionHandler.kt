package com.everforest.mdnote.config

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

@RestControllerAdvice
class GlobalExceptionHandler {

    companion object {
        private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    }

    data class ErrorResponse(
        val status: Int,
        val error: String,
        val message: String,
        val timestamp: String
    )

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(e: ResponseStatusException): ResponseEntity<ErrorResponse> {
        log.error("ResponseStatusException: status={}, message={}", e.statusCode, e.reason)
        return ResponseEntity.status(e.statusCode).body(
            ErrorResponse(
                status = e.statusCode.value(),
                error = e.statusCode.toString(),
                message = e.reason ?: "오류가 발생했습니다.",
                timestamp = LocalDateTime.now().toString()
            )
        )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(e: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        log.error("IllegalArgumentException: {}", e.message)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                status = 400,
                error = "Bad Request",
                message = e.message ?: "잘못된 요청입니다.",
                timestamp = LocalDateTime.now().toString()
            )
        )
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(e: IllegalStateException): ResponseEntity<ErrorResponse> {
        log.error("IllegalStateException: {}", e.message)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                status = 400,
                error = "Bad Request",
                message = e.message ?: "잘못된 상태입니다.",
                timestamp = LocalDateTime.now().toString()
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(e: Exception): ResponseEntity<ErrorResponse> {
        log.error("Unhandled exception", e)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse(
                status = 500,
                error = "Internal Server Error",
                message = e.message ?: "서버 내부 오류가 발생했습니다.",
                timestamp = LocalDateTime.now().toString()
            )
        )
    }
}
