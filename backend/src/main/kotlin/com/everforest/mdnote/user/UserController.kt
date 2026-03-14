package com.everforest.mdnote.user

import com.everforest.mdnote.note.GitHubApiClient
import com.everforest.mdnote.user.dto.GitHubSettingsRequest
import com.everforest.mdnote.user.dto.UserProfileResponse
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/user")
class UserController(
    private val userRepository: UserRepository,
    private val githubApiClient: GitHubApiClient
) {

    companion object {
        private val log = LoggerFactory.getLogger(UserController::class.java)
        private val GITHUB_REPO_PATTERN = Regex("^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$")
    }

    @GetMapping("/me")
    fun getProfile(@AuthenticationPrincipal user: UserDetails): ResponseEntity<UserProfileResponse> {
        val u = userRepository.findById(user.username.toLong()).get()
        return ResponseEntity.ok(
            UserProfileResponse(
                username = u.username,
                email = u.email,
                githubRepo = u.githubRepo,
                hasGithubToken = u.githubToken != null
            )
        )
    }

    @PutMapping("/github-settings")
    fun updateGitHubSettings(
        @AuthenticationPrincipal user: UserDetails,
        @RequestBody request: GitHubSettingsRequest
    ): ResponseEntity<Void> {
        if (!GITHUB_REPO_PATTERN.matches(request.githubRepo)) {
            throw IllegalArgumentException("올바르지 않은 GitHub 저장소 형식입니다. 'owner/repo' 형식이어야 합니다.")
        }
        val u = userRepository.findById(user.username.toLong()).get()
        u.githubToken = request.githubToken
        u.githubRepo = request.githubRepo
        userRepository.save(u)
        log.info("GitHub 설정 업데이트: userId={}", user.username)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/github/test")
    fun testGitHubConnection(
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<Map<String, Any>> {
        val u = userRepository.findById(user.username.toLong()).get()
        val token = u.githubToken
        val repo = u.githubRepo

        if (token.isNullOrBlank() || repo.isNullOrBlank()) {
            return ResponseEntity.ok(
                mapOf("success" to false, "message" to "GitHub 토큰과 저장소가 설정되지 않았습니다.")
            )
        }

        return try {
            githubApiClient.testConnection(token, repo)
            log.info("GitHub 연결 테스트 성공: userId={}", user.username)
            ResponseEntity.ok(mapOf("success" to true, "message" to "연결 성공"))
        } catch (e: Exception) {
            log.error("GitHub 연결 테스트 실패: userId={}", user.username, e)
            ResponseEntity.ok(
                mapOf("success" to false, "message" to (e.message ?: "연결에 실패했습니다."))
            )
        }
    }
}
