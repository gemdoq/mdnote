package com.everforest.mdnote.user

import com.everforest.mdnote.user.dto.GitHubSettingsRequest
import com.everforest.mdnote.user.dto.UserProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/user")
class UserController(
    private val userRepository: UserRepository
) {

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
        val u = userRepository.findById(user.username.toLong()).get()
        u.githubToken = request.githubToken
        u.githubRepo = request.githubRepo
        userRepository.save(u)
        return ResponseEntity.ok().build()
    }
}
