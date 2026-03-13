package com.everforest.mdnote.note

import com.everforest.mdnote.note.dto.NoteHistoryResponse
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
import java.util.Base64

@Component
class GitHubApiClient(
    @Value("\${github.api-url}") private val apiUrl: String,
    private val objectMapper: ObjectMapper
) {
    private val restTemplate = RestTemplate()

    fun listMarkdownFiles(token: String, repo: String): List<GitHubFile> {
        val url = "$apiUrl/repos/$repo/contents/"
        val headers = authHeaders(token)
        val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), Array<GitHubFile>::class.java)
        return response.body?.filter { it.name.endsWith(".md") } ?: emptyList()
    }

    fun getFileContent(token: String, repo: String, filename: String): GitHubFileContent {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), GitHubContentResponse::class.java)
        val body = response.body ?: throw IllegalStateException("파일을 찾을 수 없습니다.")
        val content = String(Base64.getMimeDecoder().decode(body.content))
        return GitHubFileContent(content = content, sha = body.sha)
    }

    fun createFile(token: String, repo: String, filename: String, content: String): GitHubFileResult {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 생성",
            "content" to Base64.getEncoder().encodeToString(content.toByteArray())
        )
        val response = restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
        return GitHubFileResult(sha = response.body?.content?.sha ?: "")
    }

    fun updateFile(token: String, repo: String, filename: String, content: String, sha: String): GitHubFileResult {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 수정",
            "content" to Base64.getEncoder().encodeToString(content.toByteArray()),
            "sha" to sha
        )
        val response = restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
        return GitHubFileResult(sha = response.body?.content?.sha ?: "")
    }

    fun deleteFile(token: String, repo: String, filename: String, sha: String) {
        val url = "$apiUrl/repos/$repo/contents/$filename"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "docs: $filename 삭제",
            "sha" to sha
        )
        restTemplate.exchange(url, HttpMethod.DELETE, HttpEntity(body, headers), Void::class.java)
    }

    fun uploadImage(token: String, repo: String, filename: String, fileBytes: ByteArray): String {
        val path = "images/$filename"
        val url = "$apiUrl/repos/$repo/contents/$path"
        val headers = authHeaders(token)
        val body = mapOf(
            "message" to "images: $filename 업로드",
            "content" to Base64.getEncoder().encodeToString(fileBytes)
        )
        restTemplate.exchange(url, HttpMethod.PUT, HttpEntity(body, headers), GitHubMutationResponse::class.java)
        val owner = repo.split("/")[0]
        val repoName = repo.split("/")[1]
        return "https://raw.githubusercontent.com/$owner/$repoName/main/$path"
    }

    fun searchFiles(token: String, repo: String, query: String): List<GitHubFile> {
        val url = "$apiUrl/search/code?q=$query+extension:md+repo:$repo"
        val headers = authHeaders(token)
        val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), GitHubSearchResponse::class.java)
        return response.body?.items ?: emptyList()
    }

    fun getFileHistory(token: String, repo: String, filename: String): List<NoteHistoryResponse> {
        val url = "$apiUrl/repos/$repo/commits?path=$filename"
        val headers = authHeaders(token)
        val response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity<Void>(headers), Array<GitHubCommitResponse>::class.java)
        return response.body?.map { commit ->
            NoteHistoryResponse(
                sha = commit.sha,
                message = commit.commit.message,
                date = commit.commit.author.date,
                author = commit.commit.author.name
            )
        } ?: emptyList()
    }

    private fun authHeaders(token: String): HttpHeaders {
        val headers = HttpHeaders()
        headers.setBearerAuth(token)
        headers.accept = listOf(MediaType.parseMediaType("application/vnd.github.v3+json"))
        return headers
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
