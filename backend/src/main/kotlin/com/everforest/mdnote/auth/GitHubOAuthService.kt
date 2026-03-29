package com.everforest.mdnote.auth

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestTemplate
import org.springframework.web.server.ResponseStatusException

@Service
class GitHubOAuthService(
    @Value("\${github.api-url}") private val apiUrl: String,
    @Value("\${github.oauth.client-id}") private val clientId: String,
    @Value("\${github.oauth.client-secret}") private val clientSecret: String,
    @Value("\${github.oauth.redirect-uri}") private val redirectUri: String
) {

    private val restTemplate = RestTemplate()

    companion object {
        private val log = LoggerFactory.getLogger(GitHubOAuthService::class.java)
        private const val AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
        private const val TOKEN_URL = "https://github.com/login/oauth/access_token"
    }

    fun getAuthorizationUrl(state: String): String {
        return "$AUTHORIZE_URL?client_id=$clientId&redirect_uri=$redirectUri&scope=repo%20user:email&state=$state"
    }

    fun exchangeCodeForToken(code: String): String {
        val headers = HttpHeaders().apply {
            accept = listOf(MediaType.APPLICATION_JSON)
            contentType = MediaType.APPLICATION_JSON
        }
        val body = mapOf(
            "client_id" to clientId,
            "client_secret" to clientSecret,
            "code" to code
        )

        log.info("GitHub OAuth: access_token 교환 요청")
        return try {
            val response = restTemplate.exchange(
                TOKEN_URL, HttpMethod.POST, HttpEntity(body, headers), GitHubTokenResponse::class.java
            )
            val accessToken = response.body?.accessToken
            if (accessToken.isNullOrBlank()) {
                val error = response.body?.error ?: "알 수 없는 오류"
                log.error("GitHub OAuth: access_token 교환 실패 - error={}", error)
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub 인증에 실패했습니다: $error")
            }
            log.info("GitHub OAuth: access_token 교환 성공")
            accessToken
        } catch (e: HttpClientErrorException) {
            log.error("GitHub OAuth: access_token 교환 HTTP 오류 - status={}", e.statusCode, e)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub 인증에 실패했습니다.")
        }
    }

    fun getGitHubUser(accessToken: String): GitHubUserInfo {
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
            accept = listOf(MediaType.APPLICATION_JSON)
        }

        log.info("GitHub OAuth: 사용자 정보 조회")
        return try {
            val response = restTemplate.exchange(
                "$apiUrl/user", HttpMethod.GET, HttpEntity<Void>(headers), GitHubUserInfo::class.java
            )
            val userInfo = response.body
                ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub 사용자 정보를 가져올 수 없습니다.")

            // 이메일이 null인 경우 /user/emails API로 primary email 조회
            if (userInfo.email == null) {
                log.info("GitHub OAuth: 이메일이 비공개 설정됨, /user/emails API로 조회")
                val primaryEmail = getPrimaryEmail(accessToken, headers)
                userInfo.copy(email = primaryEmail)
            } else {
                userInfo
            }
        } catch (e: HttpClientErrorException) {
            log.error("GitHub OAuth: 사용자 정보 조회 실패 - status={}", e.statusCode, e)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub 사용자 정보를 가져올 수 없습니다.")
        }
    }

    private fun getPrimaryEmail(accessToken: String, headers: HttpHeaders): String? {
        return try {
            val response = restTemplate.exchange(
                "$apiUrl/user/emails", HttpMethod.GET, HttpEntity<Void>(headers), Array<GitHubEmail>::class.java
            )
            response.body?.firstOrNull { it.primary }?.email
        } catch (e: HttpClientErrorException) {
            log.warn("GitHub OAuth: 이메일 목록 조회 실패 - status={}", e.statusCode)
            null
        }
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubTokenResponse(
    @JsonProperty("access_token") val accessToken: String?,
    @JsonProperty("token_type") val tokenType: String?,
    val error: String?,
    @JsonProperty("error_description") val errorDescription: String?
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubUserInfo(
    val id: Long,
    val login: String,
    val email: String?,
    val name: String?
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubEmail(
    val email: String,
    val primary: Boolean,
    val verified: Boolean
)
