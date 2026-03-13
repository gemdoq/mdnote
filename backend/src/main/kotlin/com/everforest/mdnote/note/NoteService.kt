package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.*
import com.everforest.mdnote.user.UserRepository
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.Caching
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

@Service
class NoteService(
    private val userRepository: UserRepository,
    private val githubApiClient: GitHubApiClient,
    private val userFavoriteRepository: UserFavoriteRepository,
    private val sharedNoteRepository: SharedNoteRepository
) {

    @Cacheable("noteList", key = "#userId")
    fun listNotes(userId: Long, sort: String = "date", order: String = "desc"): List<NoteListResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val pinnedFilenames = userFavoriteRepository.findByUserId(userId)
            .map { it.filename }
            .toSet()

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
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

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
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

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
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val result = githubApiClient.updateFile(token, repo, filename, request.content, request.sha)
        val tags = parseFrontmatterTags(request.content)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha, tags = tags)
    }

    @Caching(evict = [
        CacheEvict(value = ["noteList"], allEntries = true),
        CacheEvict(value = ["noteDetail"], allEntries = true)
    ])
    fun deleteNote(userId: Long, filename: String) {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val file = githubApiClient.getFileContent(token, repo, filename)
        githubApiClient.deleteFile(token, repo, filename, file.sha)
    }

    fun searchNotes(userId: Long, query: String): List<NoteListResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val pinnedFilenames = userFavoriteRepository.findByUserId(userId)
            .map { it.filename }
            .toSet()

        return githubApiClient.searchFiles(token, repo, query)
            .map { NoteListResponse(filename = it.name, path = it.path, pinned = pinnedFilenames.contains(it.name)) }
    }

    @Transactional
    fun togglePin(userId: Long, filename: String): PinResponse {
        val existing = userFavoriteRepository.findByUserIdAndFilename(userId, filename)
        return if (existing.isPresent) {
            userFavoriteRepository.deleteByUserIdAndFilename(userId, filename)
            PinResponse(pinned = false)
        } else {
            userFavoriteRepository.save(UserFavorite(userId = userId, filename = filename))
            PinResponse(pinned = true)
        }
    }

    fun uploadImage(userId: Long, file: MultipartFile): ImageUploadResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val timestamp = System.currentTimeMillis()
        val originalFilename = file.originalFilename ?: "image"
        val filename = "${timestamp}_${originalFilename}"
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
        return ShareResponse(token = shareToken)
    }

    @Transactional
    fun deleteShareLink(userId: Long, filename: String) {
        sharedNoteRepository.deleteByUserIdAndFilename(userId, filename)
    }

    fun getSharedNote(token: String): SharedNoteResponse {
        val shared = sharedNoteRepository.findByToken(token)
            .orElseThrow { IllegalArgumentException("공유 링크를 찾을 수 없습니다.") }

        val user = userRepository.findById(shared.userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val githubToken = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val file = githubApiClient.getFileContent(githubToken, repo, shared.filename)
        return SharedNoteResponse(filename = shared.filename, content = file.content)
    }

    fun getNoteHistory(userId: Long, filename: String): List<NoteHistoryResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

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
