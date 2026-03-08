package com.everforest.mdnote.user.dto

data class GitHubSettingsRequest(
    val githubToken: String,
    val githubRepo: String
)
