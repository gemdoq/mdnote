package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.*
import com.everforest.mdnote.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.Caching
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.io.ByteArrayOutputStream
import java.util.UUID
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

@Service
class NoteService(
    private val userRepository: UserRepository,
    private val githubApiClient: GitHubApiClient,
    private val userFavoriteRepository: UserFavoriteRepository,
    private val sharedNoteRepository: SharedNoteRepository
) {

    companion object {
        private val log = LoggerFactory.getLogger(NoteService::class.java)
        private const val MAX_IMAGE_SIZE = 5L * 1024 * 1024 // 5MB
        private val ALLOWED_IMAGE_TYPES = setOf("image/png", "image/jpeg", "image/gif", "image/webp")
    }

    private data class GitHubCredentials(val token: String, val repo: String)

    private fun getGitHubCredentials(userId: Long): GitHubCredentials {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken
        val repo = user.githubRepo

        if (token.isNullOrBlank() || repo.isNullOrBlank()) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "GitHub 설정을 먼저 해주세요. 설정 > GitHub 연동에서 토큰과 저장소를 입력해주세요."
            )
        }

        return GitHubCredentials(token, repo)
    }

    @Cacheable("noteList", key = "#userId")
    fun listNotes(userId: Long, sort: String = "date", order: String = "desc"): List<NoteListResponse> {
        val (token, repo) = getGitHubCredentials(userId)

        val pinnedFilenames = userFavoriteRepository.findByUserId(userId)
            .map { it.filename }
            .toSet()

        log.info("노트 목록 조회: userId={}", userId)
        val notes = githubApiClient.listMarkdownFiles(token, repo)
            .map { NoteListResponse(filename = it.name, path = it.path, pinned = pinnedFilenames.contains(it.name)) }

        val sorted = when (sort) {
            "title" -> if (order == "asc") notes.sortedBy { it.filename } else notes.sortedByDescending { it.filename }
            else -> if (order == "asc") notes.sortedBy { it.filename } else notes.sortedByDescending { it.filename }
        }

        return sorted.sortedByDescending { it.pinned }
    }

    fun listNotesPaged(userId: Long, sort: String, order: String, page: Int, size: Int): NotePageResponse {
        val allNotes = listNotes(userId, sort, order)
        val totalElements = allNotes.size
        val totalPages = if (totalElements == 0) 0 else (totalElements + size - 1) / size
        val fromIndex = (page * size).coerceAtMost(totalElements)
        val toIndex = ((page + 1) * size).coerceAtMost(totalElements)
        val content = if (fromIndex < totalElements) allNotes.subList(fromIndex, toIndex) else emptyList()

        return NotePageResponse(
            content = content,
            totalElements = totalElements,
            totalPages = totalPages,
            page = page,
            size = size
        )
    }

    @Cacheable("noteDetail", key = "#userId + '-' + #filename")
    fun getNote(userId: Long, filename: String): NoteResponse {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("노트 조회: userId={}, filename={}", userId, filename)
        val file = githubApiClient.getFileContent(token, repo, filename)
        val tags = parseFrontmatterTags(file.content)
        return NoteResponse(
            filename = filename,
            content = file.content,
            sha = file.sha,
            tags = tags
        )
    }

    @Caching(evict = [
        CacheEvict(value = ["noteList"], allEntries = true),
        CacheEvict(value = ["noteDetail"], allEntries = true)
    ])
    fun createNote(userId: Long, request: NoteCreateRequest): NoteResponse {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("노트 생성: userId={}, filename={}", userId, request.filename)
        val filename = request.filename
        val result = githubApiClient.createFile(token, repo, filename, request.content)
        val tags = parseFrontmatterTags(request.content)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha, tags = tags)
    }

    @Caching(evict = [
        CacheEvict(value = ["noteList"], allEntries = true),
        CacheEvict(value = ["noteDetail"], allEntries = true)
    ])
    fun updateNote(userId: Long, filename: String, request: NoteUpdateRequest): NoteResponse {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("노트 수정: userId={}, filename={}", userId, filename)
        val result = githubApiClient.updateFile(token, repo, filename, request.content, request.sha)
        val tags = parseFrontmatterTags(request.content)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha, tags = tags)
    }

    @Caching(evict = [
        CacheEvict(value = ["noteList"], allEntries = true),
        CacheEvict(value = ["noteDetail"], allEntries = true)
    ])
    fun deleteNote(userId: Long, filename: String) {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("노트 삭제: userId={}, filename={}", userId, filename)
        val file = githubApiClient.getFileContent(token, repo, filename)
        githubApiClient.deleteFile(token, repo, filename, file.sha)
    }

    fun searchNotes(userId: Long, query: String): List<NoteListResponse> {
        val (token, repo) = getGitHubCredentials(userId)

        val pinnedFilenames = userFavoriteRepository.findByUserId(userId)
            .map { it.filename }
            .toSet()

        log.info("노트 검색: userId={}, query={}", userId, query)
        return githubApiClient.searchFiles(token, repo, query)
            .map { NoteListResponse(filename = it.name, path = it.path, pinned = pinnedFilenames.contains(it.name)) }
    }

    fun searchNotesPaged(userId: Long, query: String, page: Int, size: Int): NotePageResponse {
        val allNotes = searchNotes(userId, query)
        val totalElements = allNotes.size
        val totalPages = if (totalElements == 0) 0 else (totalElements + size - 1) / size
        val fromIndex = (page * size).coerceAtMost(totalElements)
        val toIndex = ((page + 1) * size).coerceAtMost(totalElements)
        val content = if (fromIndex < totalElements) allNotes.subList(fromIndex, toIndex) else emptyList()

        return NotePageResponse(
            content = content,
            totalElements = totalElements,
            totalPages = totalPages,
            page = page,
            size = size
        )
    }

    @Transactional
    fun togglePin(userId: Long, filename: String): PinResponse {
        val existing = userFavoriteRepository.findByUserIdAndFilename(userId, filename)
        return if (existing.isPresent) {
            userFavoriteRepository.deleteByUserIdAndFilename(userId, filename)
            log.info("노트 핀 해제: userId={}, filename={}", userId, filename)
            PinResponse(pinned = false)
        } else {
            userFavoriteRepository.save(UserFavorite(userId = userId, filename = filename))
            log.info("노트 핀 설정: userId={}, filename={}", userId, filename)
            PinResponse(pinned = true)
        }
    }

    fun uploadImage(userId: Long, file: MultipartFile): ImageUploadResponse {
        // 파일 크기 검증
        if (file.size > MAX_IMAGE_SIZE) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지 파일 크기는 5MB를 초과할 수 없습니다.")
        }

        // 파일 타입 검증
        val contentType = file.contentType
        if (contentType == null || contentType !in ALLOWED_IMAGE_TYPES) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "허용되지 않는 파일 형식입니다. PNG, JPEG, GIF, WebP만 업로드할 수 있습니다."
            )
        }

        val (token, repo) = getGitHubCredentials(userId)

        val timestamp = System.currentTimeMillis()
        val originalFilename = file.originalFilename ?: "image"
        val filename = "${timestamp}_${originalFilename}"
        log.info("이미지 업로드: userId={}, filename={}", userId, filename)
        val url = githubApiClient.uploadImage(token, repo, filename, file.bytes)
        return ImageUploadResponse(url = url)
    }

    @Transactional
    fun createShareLink(userId: Long, filename: String): ShareResponse {
        val existing = sharedNoteRepository.findByUserIdAndFilename(userId, filename)
        if (existing.isPresent) {
            return ShareResponse(token = existing.get().token)
        }
        val shareToken = UUID.randomUUID().toString()
        sharedNoteRepository.save(SharedNote(userId = userId, filename = filename, token = shareToken))
        log.info("공유 링크 생성: userId={}, filename={}", userId, filename)
        return ShareResponse(token = shareToken)
    }

    @Transactional
    fun deleteShareLink(userId: Long, filename: String) {
        sharedNoteRepository.deleteByUserIdAndFilename(userId, filename)
        log.info("공유 링크 삭제: userId={}, filename={}", userId, filename)
    }

    fun getSharedNote(token: String): SharedNoteResponse {
        val shared = sharedNoteRepository.findByToken(token)
            .orElseThrow { IllegalArgumentException("공유 링크를 찾을 수 없습니다.") }

        val user = userRepository.findById(shared.userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val githubToken = user.githubToken
        val repo = user.githubRepo

        if (githubToken.isNullOrBlank() || repo.isNullOrBlank()) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "GitHub 설정을 먼저 해주세요. 설정 > GitHub 연동에서 토큰과 저장소를 입력해주세요."
            )
        }

        val file = githubApiClient.getFileContent(githubToken, repo, shared.filename)
        return SharedNoteResponse(filename = shared.filename, content = file.content)
    }

    fun getNoteHistory(userId: Long, filename: String): List<NoteHistoryResponse> {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("노트 히스토리 조회: userId={}, filename={}", userId, filename)
        return githubApiClient.getFileHistory(token, repo, filename)
    }

    fun exportNoteAsHtml(userId: Long, filename: String): String {
        val note = getNote(userId, filename)
        val parser = org.commonmark.parser.Parser.builder().build()
        val renderer = org.commonmark.renderer.html.HtmlRenderer.builder().build()
        val document = parser.parse(note.content)
        val htmlBody = renderer.render(document)

        return """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.filename}</title>
    <style>
        body {
            background-color: #1e1e1e;
            color: #d4d4d4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #e0e0e0;
            border-bottom: 1px solid #333;
            padding-bottom: 0.3rem;
        }
        a { color: #569cd6; }
        code {
            background-color: #2d2d2d;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Consolas', 'Courier New', monospace;
        }
        pre {
            background-color: #2d2d2d;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
        }
        pre code { padding: 0; background: none; }
        blockquote {
            border-left: 4px solid #569cd6;
            margin-left: 0;
            padding-left: 1rem;
            color: #9e9e9e;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #444;
            padding: 0.5rem;
        }
        th { background-color: #2d2d2d; }
        img { max-width: 100%; }
    </style>
</head>
<body>
$htmlBody
</body>
</html>"""
    }

    fun exportAllNotesAsZip(userId: Long): ByteArray {
        val (token, repo) = getGitHubCredentials(userId)

        log.info("전체 노트 ZIP 내보내기: userId={}", userId)
        val files = githubApiClient.listMarkdownFiles(token, repo)

        val baos = ByteArrayOutputStream()
        ZipOutputStream(baos).use { zos ->
            for (file in files) {
                try {
                    val fileContent = githubApiClient.getFileContent(token, repo, file.name)
                    val entry = ZipEntry(file.name)
                    zos.putNextEntry(entry)
                    zos.write(fileContent.content.toByteArray(Charsets.UTF_8))
                    zos.closeEntry()
                } catch (e: Exception) {
                    log.error("ZIP 내보내기 중 파일 처리 실패: filename={}", file.name, e)
                }
            }
        }

        return baos.toByteArray()
    }

    fun parseFrontmatterTags(content: String): List<String> {
        val lines = content.lines()
        if (lines.isEmpty() || lines[0].trim() != "---") return emptyList()

        val endIndex = lines.drop(1).indexOfFirst { it.trim() == "---" }
        if (endIndex == -1) return emptyList()

        val frontmatterLines = lines.subList(1, endIndex + 1)
        for (line in frontmatterLines) {
            val trimmed = line.trim()
            if (trimmed.startsWith("tags:")) {
                val value = trimmed.removePrefix("tags:").trim()
                if (value.startsWith("[") && value.endsWith("]")) {
                    return value.removeSurrounding("[", "]")
                        .split(",")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                }
                // YAML list format
                val tags = mutableListOf<String>()
                val tagStartIndex = frontmatterLines.indexOf(line)
                for (i in tagStartIndex + 1 until frontmatterLines.size) {
                    val tagLine = frontmatterLines[i].trim()
                    if (tagLine.startsWith("- ")) {
                        tags.add(tagLine.removePrefix("- ").trim())
                    } else {
                        break
                    }
                }
                return tags
            }
        }
        return emptyList()
    }
}
