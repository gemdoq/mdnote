package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.SharedNoteResponse
import org.springframework.http.MediaType
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

    @GetMapping("/{token}/og", produces = [MediaType.TEXT_HTML_VALUE])
    fun getSharedNoteOg(@PathVariable token: String): ResponseEntity<String> {
        val note = noteService.getSharedNote(token)
        val title = note.filename.removeSuffix(".md").replace("-", " ")
        val preview = note.content.take(200).replace("\"", "&quot;").replace("<", "&lt;")
        val ogUrl = "http://everforest.iptime.org:8089/shared/$token"
        val html = """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta property="og:title" content="$title - mdnote" />
                <meta property="og:description" content="$preview" />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="$ogUrl" />
                <meta name="description" content="$preview" />
                <title>$title - mdnote</title>
                <meta http-equiv="refresh" content="0;url=$ogUrl" />
            </head>
            <body><p>Redirecting...</p></body>
            </html>
        """.trimIndent()
        return ResponseEntity.ok(html)
    }
}
