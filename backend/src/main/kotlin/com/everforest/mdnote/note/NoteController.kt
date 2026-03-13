package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/notes")
class NoteController(
    private val noteService: NoteService
) {

    @GetMapping
    fun listNotes(
        @AuthenticationPrincipal user: UserDetails,
        @RequestParam(defaultValue = "date") sort: String,
        @RequestParam(defaultValue = "desc") order: String
    ): ResponseEntity<List<NoteListResponse>> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.listNotes(userId, sort, order))
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

    @PutMapping("/{filename}/pin")
    fun togglePin(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<PinResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.togglePin(userId, filename))
    }

    @PostMapping("/images")
    fun uploadImage(
        @AuthenticationPrincipal user: UserDetails,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<ImageUploadResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(noteService.uploadImage(userId, file))
    }

    @PostMapping("/{filename}/share")
    fun createShareLink(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<ShareResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.createShareLink(userId, filename))
    }

    @DeleteMapping("/{filename}/share")
    fun deleteShareLink(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<Void> {
        val userId = user.username.toLong()
        noteService.deleteShareLink(userId, filename)
        return ResponseEntity.noContent().build()
    }
}
