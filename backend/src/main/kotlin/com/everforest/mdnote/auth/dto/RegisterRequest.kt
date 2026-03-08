package com.everforest.mdnote.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 3, max = 20) val username: String,
    @field:NotBlank @field:Size(min = 8) val password: String,
    @field:NotBlank @field:Email val email: String
)
