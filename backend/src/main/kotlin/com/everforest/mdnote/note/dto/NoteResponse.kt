package com.everforest.mdnote.note.dto

data class NoteResponse(
    val filename: String,
    val content: String,
    val sha: String
)
