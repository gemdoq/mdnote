package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.*
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
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

    companion object {
        private val FILENAME_PATTERN = Regex("^[a-zA-Z0-9가-힣._-]+\\.md$")
    }

    @GetMapping
    fun listNotes(
        @AuthenticationPrincipal user: UserDetails,
        @RequestParam(defaultValue = "date") sort: String,
        @RequestParam(defaultValue = "desc") order: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<NotePageResponse> {
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.listNotesPaged(userId, sort, order, page, size))
    }

    @GetMapping("/{filename}")
    fun getNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<NoteResponse> {
        validateFilename(filename)
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.getNote(userId, filename))
    }

    @PostMapping
    fun createNote(
        @AuthenticationPrincipal user: UserDetails,
        @RequestBody request: NoteCreateRequest
    ): ResponseEntity<NoteResponse> {
        validateFilename(request.filename)
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
        validateFilename(filename)
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.updateNote(userId, filename, request))
    }

    @DeleteMapping("/{filename}")
    fun deleteNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<Void> {
        validateFilename(filename)
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
        validateFilename(filename)
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
        validateFilename(filename)
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.createShareLink(userId, filename))
    }

    @DeleteMapping("/{filename}/share")
    fun deleteShareLink(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<Void> {
        validateFilename(filename)
        val userId = user.username.toLong()
        noteService.deleteShareLink(userId, filename)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{filename}/history")
    fun getNoteHistory(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String
    ): ResponseEntity<List<NoteHistoryResponse>> {
        validateFilename(filename)
        val userId = user.username.toLong()
        return ResponseEntity.ok(noteService.getNoteHistory(userId, filename))
    }

    @GetMapping("/{filename}/export")
    fun exportNote(
        @AuthenticationPrincipal user: UserDetails,
        @PathVariable filename: String,
        @RequestParam(defaultValue = "html") format: String
    ): ResponseEntity<String> {
        validateFilename(filename)
        val userId = user.username.toLong()
        return when (format) {
            "html" -> {
                val html = noteService.exportNoteAsHtml(userId, filename)
                ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(html)
            }
            else -> throw IllegalArgumentException("지원하지 않는 내보내기 형식입니다: $format")
        }
    }

    private fun validateFilename(filename: String) {
        if (!FILENAME_PATTERN.matches(filename)) {
            throw IllegalArgumentException("올바르지 않은 파일명입니다. 파일명은 영문, 숫자, 한글, 점, 밑줄, 하이픈만 사용할 수 있으며 .md로 끝나야 합니다.")
        }
    }
}
