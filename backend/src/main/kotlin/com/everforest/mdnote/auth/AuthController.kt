package com.everforest.mdnote.auth

import com.everforest.mdnote.auth.dto.AuthResponse
import com.everforest.mdnote.auth.dto.LoginRequest
import com.everforest.mdnote.auth.dto.RefreshRequest
import com.everforest.mdnote.auth.dto.RegisterRequest
import com.everforest.mdnote.user.AuthProvider
import com.everforest.mdnote.user.User
import com.everforest.mdnote.user.UserRepository
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime
import java.util.UUID

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
    private val refreshTokenRepository: RefreshTokenRepository
) {

    companion object {
        private const val REMEMBER_ME_REFRESH_DAYS = 30L
        private const val DEFAULT_REFRESH_HOURS = 24L
    }

    @PostMapping("/register")
    @Transactional
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        if (userRepository.existsByUsername(request.username)) {
            return ResponseEntity.badRequest()
                .body(AuthResponse(error = "이미 사용 중인 사용자명입니다."))
        }
        if (userRepository.existsByEmail(request.email)) {
            return ResponseEntity.badRequest()
                .body(AuthResponse(error = "이미 사용 중인 이메일입니다."))
        }

        val user = userRepository.save(
            User(
                username = request.username,
                password = passwordEncoder.encode(request.password),
                email = request.email,
                provider = AuthProvider.LOCAL
            )
        )

        val accessToken = jwtProvider.generateAccessToken(user.id, user.username)
        val refreshToken = createRefreshToken(user.id, false)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(AuthResponse(accessToken = accessToken, refreshToken = refreshToken, username = user.username))
    }

    @PostMapping("/login")
    @Transactional
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        return try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.username, request.password)
            )
            val user = userRepository.findByUsername(request.username).get()
            val accessToken = jwtProvider.generateAccessToken(user.id, user.username)
            val refreshToken = createRefreshToken(user.id, request.rememberMe)
            ResponseEntity.ok(AuthResponse(accessToken = accessToken, refreshToken = refreshToken, username = user.username))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse(error = "사용자명 또는 비밀번호가 올바르지 않습니다."))
        }
    }

    @PostMapping("/refresh")
    @Transactional
    fun refresh(@RequestBody request: RefreshRequest): ResponseEntity<AuthResponse> {
        val storedToken = refreshTokenRepository.findByToken(request.refreshToken)
            .orElse(null)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse(error = "유효하지 않은 리프레시 토큰입니다."))

        if (storedToken.expiresAt.isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse(error = "만료된 리프레시 토큰입니다."))
        }

        val user = userRepository.findById(storedToken.userId)
            .orElse(null)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse(error = "사용자를 찾을 수 없습니다."))

        // 기존 리프레시 토큰 삭제 (rotation)
        refreshTokenRepository.delete(storedToken)

        val accessToken = jwtProvider.generateAccessToken(user.id, user.username)
        val newRefreshToken = createRefreshToken(user.id, false)
        return ResponseEntity.ok(AuthResponse(accessToken = accessToken, refreshToken = newRefreshToken, username = user.username))
    }

    private fun createRefreshToken(userId: Long, rememberMe: Boolean): String {
        val token = UUID.randomUUID().toString()
        val expiresAt = if (rememberMe) {
            LocalDateTime.now().plusDays(REMEMBER_ME_REFRESH_DAYS)
        } else {
            LocalDateTime.now().plusHours(DEFAULT_REFRESH_HOURS)
        }
        refreshTokenRepository.save(
            RefreshToken(userId = userId, token = token, expiresAt = expiresAt)
        )
        return token
    }
}
