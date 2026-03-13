package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.*
import com.everforest.mdnote.user.UserRepository
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

    fun updateNote(userId: Long, filename: String, request: NoteUpdateRequest): NoteResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val result = githubApiClient.updateFile(token, repo, filename, request.content, request.sha)
        val tags = parseFrontmatterTags(request.content)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha, tags = tags)
    }

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
