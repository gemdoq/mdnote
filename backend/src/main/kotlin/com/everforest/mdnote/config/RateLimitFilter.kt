package com.everforest.mdnote.config

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.concurrent.ConcurrentHashMap

@Component
class RateLimitFilter(
    private val objectMapper: ObjectMapper
) : OncePerRequestFilter() {

    private val requestCounts = ConcurrentHashMap<String, MutableList<Long>>()

    companion object {
        private const val MAX_REQUESTS = 10
        private const val TIME_WINDOW_MS = 60_000L
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI
        if (!path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response)
            return
        }

        val clientIp = getClientIp(request)
        val now = System.currentTimeMillis()

        val timestamps = requestCounts.computeIfAbsent(clientIp) { mutableListOf() }
        synchronized(timestamps) {
            timestamps.removeAll { now - it > TIME_WINDOW_MS }

            if (timestamps.size >= MAX_REQUESTS) {
                response.status = HttpStatus.TOO_MANY_REQUESTS.value()
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                response.characterEncoding = "UTF-8"
                val errorBody = mapOf("error" to "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.")
                response.writer.write(objectMapper.writeValueAsString(errorBody))
                return
            }

            timestamps.add(now)
        }

        filterChain.doFilter(request, response)
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (!xForwardedFor.isNullOrBlank()) {
            xForwardedFor.split(",")[0].trim()
        } else {
            request.remoteAddr
        }
    }
}
