package com.everforest.mdnote.user.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class ChangePasswordRequest(
    @field:NotBlank val currentPassword: String,
    @field:NotBlank
    @field:Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
        message = "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다."
    )
    val newPassword: String
)
