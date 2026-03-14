package com.everforest.mdnote.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 3, max = 20) val username: String,
    @field:NotBlank
    @field:Size(min = 8)
    @field:Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
        message = "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다."
    )
    val password: String,
    @field:NotBlank @field:Email val email: String
)
