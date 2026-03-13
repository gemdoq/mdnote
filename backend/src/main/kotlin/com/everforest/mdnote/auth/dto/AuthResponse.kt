package com.everforest.mdnote.auth.dto

data class AuthResponse(
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val username: String? = null,
    val error: String? = null
)
