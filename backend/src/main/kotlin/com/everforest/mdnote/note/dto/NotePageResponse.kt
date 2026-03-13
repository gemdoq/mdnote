package com.everforest.mdnote.note.dto

data class NotePageResponse(
    val content: List<NoteListResponse>,
    val totalElements: Int,
    val totalPages: Int,
    val page: Int,
    val size: Int
)
