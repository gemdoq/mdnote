package com.everforest.mdnote.auth

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Component
class TokenCleanupScheduler(
    private val refreshTokenRepository: RefreshTokenRepository
) {

    companion object {
        private val log = LoggerFactory.getLogger(TokenCleanupScheduler::class.java)
    }

    @Scheduled(fixedRate = 3600000) // 1시간마다
    @Transactional
    fun cleanupExpiredTokens() {
        val now = LocalDateTime.now()
        refreshTokenRepository.deleteByExpiresAtBefore(now)
        log.info("만료된 리프레시 토큰 정리 완료: before={}", now)
    }
}
