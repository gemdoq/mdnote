package com.everforest.mdnote.note.dto

data class NoteUpdateRequest(
    val content: String,
    val sha: String
)
