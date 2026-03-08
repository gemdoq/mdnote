package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.NoteCreateRequest
import com.everforest.mdnote.note.dto.NoteUpdateRequest
import com.everforest.mdnote.note.dto.NoteResponse
import com.everforest.mdnote.note.dto.NoteListResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/notes")
class NoteController(
    private val noteService: NoteService
) {

    @GetMapping
    fun listNotes(@AuthenticationPrincipal user: UserDetails): ResponseEntity<List<NoteListResponse>> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.listNotes(userId))
    }

    @GetMapping("/{filename}")
    fun getNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<NoteResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.getNote(userId, filename))
    }

    @PostMapping
    fun createNote(
        @AuthenticationPrincipal user: UserDetails,
        @RequestBody request: NoteCreateRequest
    ): ResponseEntity<NoteResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(noteService.createNote(userId, request))
    }

    @PutMapping("/{filename}")
    fun updateNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String,
        @RequestBody request: NoteUpdateRequest
    ): ResponseEntity<NoteResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.updateNote(userId, filename, request))
    }

    @DeleteMapping("/{filename}")
    fun deleteNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<Void> {
        val userId = user.username.toLong()
        noteService.deleteNote(userId, filename)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/search")
    fun searchNotes(
        @AuthenticationPrincipal user: UserDetails,
        @RequestParam q: String
    ): ResponseEntity<List<NoteListResponse>> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.searchNotes(userId, q))
    }
}
