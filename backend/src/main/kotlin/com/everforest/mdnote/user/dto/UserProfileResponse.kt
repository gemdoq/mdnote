package com.everforest.mdnote.user.dto

data class UserProfileResponse(
    val username: String,
    val email: String,
    val githubRepo: String?,
    val hasGithubToken: Boolean
)
