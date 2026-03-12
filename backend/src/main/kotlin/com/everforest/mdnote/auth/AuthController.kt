package com.everforest.mdnote.auth

import com.everforest.mdnote.auth.dto.LoginRequest
import com.everforest.mdnote.auth.dto.RegisterRequest
import com.everforest.mdnote.auth.dto.AuthResponse
import com.everforest.mdnote.user.AuthProvider
import com.everforest.mdnote.user.User
import com.everforest.mdnote.user.UserRepository
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider
) {

    @PostMapping("/register")
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

        val token = jwtProvider.generateToken(user.id, user.username)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(AuthResponse(token = token, username = user.username))
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        return try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.username, request.password)
            )
            val user = userRepository.findByUsername(request.username).get()
            val token = jwtProvider.generateToken(user.id, user.username, request.rememberMe)
            ResponseEntity.ok(AuthResponse(token = token, username = user.username))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse(error = "사용자명 또는 비밀번호가 올바르지 않습니다."))
        }
    }
}
