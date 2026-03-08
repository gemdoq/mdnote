package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.NoteCreateRequest
import com.everforest.mdnote.note.dto.NoteUpdateRequest
import com.everforest.mdnote.note.dto.NoteResponse
import com.everforest.mdnote.note.dto.NoteListResponse
import com.everforest.mdnote.user.UserRepository
import org.springframework.stereotype.Service

@Service
class NoteService(
    private val userRepository: UserRepository,
    private val githubApiClient: GitHubApiClient
) {

    fun listNotes(userId: Long): List<NoteListResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        return githubApiClient.listMarkdownFiles(token, repo)
            .sortedByDescending { it.name }
            .map { NoteListResponse(filename = it.name, path = it.path) }
    }

    fun getNote(userId: Long, filename: String): NoteResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val file = githubApiClient.getFileContent(token, repo, filename)
        return NoteResponse(
            filename = filename,
            content = file.content,
            sha = file.sha
        )
    }

    fun createNote(userId: Long, request: NoteCreateRequest): NoteResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val filename = request.filename
        val result = githubApiClient.createFile(token, repo, filename, request.content)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha)
    }

    fun updateNote(userId: Long, filename: String, request: NoteUpdateRequest): NoteResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        val token = user.githubToken ?: throw IllegalStateException("GitHub 토큰이 설정되지 않았습니다.")
        val repo = user.githubRepo ?: throw IllegalStateException("GitHub 저장소가 설정되지 않았습니다.")

        val result = githubApiClient.updateFile(token, repo, filename, request.content, request.sha)
        return NoteResponse(filename = filename, content = request.content, sha = result.sha)
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

        return githubApiClient.searchFiles(token, repo, query)
            .map { NoteListResponse(filename = it.name, path = it.path) }
    }
}
