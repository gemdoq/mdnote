package com.everforest.mdnote.note.dto

data class NoteListResponse(
    val filename: String,
    val path: String,
    val pinned: Boolean = false
)
