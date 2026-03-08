package com.everforest.mdnote.auth.dto

data class AuthResponse(
    val token: String? = null,
    val username: String? = null,
    val error: String? = null
)
