package com.everforest.mdnote.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime
import java.util.Optional

interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByToken(token: String): Optional<RefreshToken>
    fun deleteByUserId(userId: Long)
    fun deleteByExpiresAtBefore(now: LocalDateTime)
}
