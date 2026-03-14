package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.NoteHistoryResponse
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Component
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestTemplate
import org.springframework.web.server.ResponseStatusException
import java.util.Base64

@Component
class GitHubApiClient(
    @Value("\${github.api-url}") private val apiUrl: String,
    private val objectMapper: ObjectMapper
) {
    private val restTemplate = RestTemplate()

    companion object {
        private val log = LoggerFactory.getLogger(GitHubApiClient::class.java)
    }

    fun listMarkdownFiles(token: String, repo: String): List<GitHubFile> {
        val url = "$apiUrl/repos/$repo/contents/"
        val headers = authHeaders(token)
        log.info("GitHub API 호출: 마크다운 파일 목록 조회 - repo={}", repo)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), Array<GitHubFile>::class.java)
            response.body?.filter { it.name.endsWith(".md") } ?: emptyList()
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun getFileContent(token: String, repo: String, filename: String): GitHubFileContent {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        log.info("GitHub API 호출: 파일 내용 조회 - repo={}, filename={}", repo, filename)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), GitHubContentResponse::class.java)
            val body = response.body ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.")
            val content = String(Base64.getMimeDecoder().decode(body.content))
            GitHubFileContent(content = content, sha = body.sha)
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun createFile(token: String, repo: String, filename: String, content: String): GitHubFileResult {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 생성",
            "content" to Base64.getEncoder().encodeToString(content.toByteArray())
        )
        log.info("GitHub API 호출: 파일 생성 - repo={}, filename={}", repo, filename)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
            GitHubFileResult(sha = response.body?.content?.sha ?: "")
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun updateFile(token: String, repo: String, filename: String, content: String, sha: String): GitHubFileResult {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 수정",
            "content" to Base64.getEncoder().encodeToString(content.toByteArray()),
            "sha" to sha
        )
        log.info("GitHub API 호출: 파일 수정 - repo={}, filename={}", repo, filename)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
            GitHubFileResult(sha = response.body?.content?.sha ?: "")
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun deleteFile(token: String, repo: String, filename: String, sha: String) {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 삭제",
            "sha" to sha
        )
        log.info("GitHub API 호출: 파일 삭제 - repo={}, filename={}", repo, filename)
        try {
            restTemplate.exchange(url, HttpMethod.DELETE, HttpEntity(body, headers), Void::class.java)
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun uploadImage(token: String, repo: String, filename: String, fileBytes: ByteArray): String {
        val path = "images/$filename"
        val url = "$apiUrl/repos/$repo/contents/$path"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "images: $filename 업로드",
            "content" to Base64.getEncoder().encodeToString(fileBytes)
        )
        log.info("GitHub API 호출: 이미지 업로드 - repo={}, filename={}", repo, filename)
        try {
            restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
        val owner = repo.split("/")[0]
        val repoName = repo.split("/")[1]
        return "https://raw.githubusercontent.com/$owner/$repoName/main/$path"
    }

    fun searchFiles(token: String, repo: String, query: String): List<GitHubFile> {
        val url = "$apiUrl/search/code?q=$query+extension:md+repo:$repo"
        val headers = authHeaders(token)
        log.info("GitHub API 호출: 파일 검색 - repo={}, query={}", repo, query)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), GitHubSearchResponse::class.java)
            response.body?.items ?: emptyList()
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun getFileHistory(token: String, repo: String, filename: String): List<NoteHistoryResponse> {
        val url = "$apiUrl/repos/$repo/commits?path=$filename"
        val headers = authHeaders(token)
        log.info("GitHub API 호출: 파일 히스토리 조회 - repo={}, filename={}", repo, filename)
        return try {
            val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), Array<GitHubCommitResponse>::class.java)
            response.body?.map { commit ->
                NoteHistoryResponse(
                    sha = commit.sha,
                    message = commit.commit.message,
                    date = commit.commit.author.date,
                    author = commit.commit.author.name
                )
            } ?: emptyList()
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    fun testConnection(token: String, repo: String) {
        val url = "$apiUrl/repos/$repo"
        val headers = authHeaders(token)
        log.info("GitHub API 호출: 연결 테스트 - repo={}", repo)
        try {
            restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), Void::class.java)
        } catch (e: HttpClientErrorException) {
            throw handleGitHubError(e)
        }
    }

    private fun authHeaders(token: String): HttpHeaders {
        val headers = HttpHeaders()
        headers.setBearerAuth(token)
        headers.accept = listOf(MediaType.parseMediaType("application/vnd.github.v3+json"))
        return headers
    }

    private fun handleGitHubError(e: HttpClientErrorException): ResponseStatusException {
        val message = when (e.statusCode) {
            HttpStatus.UNAUTHORIZED -> "GitHub 토큰이 만료되었거나 유효하지 않습니다."
            HttpStatus.NOT_FOUND -> "GitHub 저장소를 찾을 수 없습니다."
            HttpStatus.TOO_MANY_REQUESTS -> "GitHub API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요."
            else -> "GitHub API 오류가 발생했습니다."
        }
        log.error("GitHub API 오류: status={}, message={}", e.statusCode, message, e)
        return ResponseStatusException(e.statusCode as HttpStatus, message)
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubFile(val name: String, val path: String, val sha: String = "")

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubContentResponse(val content: String, val sha: String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubMutationResponse(val content: GitHubFile?)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubSearchResponse(val items: List<GitHubFile>)

data class GitHubFileContent(val content: String, val sha: String)
data class GitHubFileResult(val sha: String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubCommitResponse(
    val sha: String,
    val commit: GitHubCommitDetail
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubCommitDetail(
    val message: String,
    val author: GitHubCommitAuthor
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubCommitAuthor(
    val name: String,
    val date: String
)
