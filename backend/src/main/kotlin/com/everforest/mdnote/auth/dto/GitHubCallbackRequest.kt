package com.everforest.mdnote.auth.dto

data class GitHubCallbackRequest(
    val code: String,
    val state: String
)
