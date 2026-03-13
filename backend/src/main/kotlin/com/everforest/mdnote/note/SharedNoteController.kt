package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.SharedNoteResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/shared")
class SharedNoteController(
    private val noteService: NoteService
) {

    @GetMapping("/{token}")
    fun getSharedNote(@PathVariable token: String): ResponseEntity<SharedNoteResponse> {
        return ResponseEntity.ok(noteService.getSharedNote(token))
    }
}
