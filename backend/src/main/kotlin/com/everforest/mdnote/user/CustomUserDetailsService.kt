package com.everforest.mdnote.user

import org.slf4j.LoggerFactory
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    companion object {
        private val log = LoggerFactory.getLogger(CustomUserDetailsService::class.java)
    }

    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username)
            .orElseThrow { UsernameNotFoundException("사용자를 찾을 수 없습니다: $username") }
        return toUserDetails(user)
    }

    fun loadUserById(id: Long): UserDetails {
        val user = userRepository.findById(id)
            .orElseThrow { UsernameNotFoundException("사용자를 찾을 수 없습니다: $id") }
        return toUserDetails(user)
    }

    private fun toUserDetails(user: User): UserDetails {
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.id.toString())
            .password(user.password ?: "")
            .authorities(listOf(SimpleGrantedAuthority("ROLE_USER")))
            .build()
    }
}
