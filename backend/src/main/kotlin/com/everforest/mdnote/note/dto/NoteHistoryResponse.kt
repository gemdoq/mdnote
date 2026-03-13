package com.everforest.mdnote.note.dto

data class NoteHistoryResponse(
    val sha: String,
    val message: String,
    val date: String,
    val author: String
)
