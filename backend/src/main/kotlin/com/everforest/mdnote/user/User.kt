package com.everforest.mdnote.user

import com.everforest.mdnote.config.EncryptedStringConverter
import jakarta.persistence.*

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(unique = true, nullable = false)
    val username: String,

    @Column(nullable = true)
    var password: String? = null,

    @Column(unique = true, nullable = false)
    val email: String,

    @Convert(converter = EncryptedStringConverter::class)
    @Column(name = "github_token")
    var githubToken: String? = null,

    @Column(name = "github_repo")
    var githubRepo: String? = null,

    @Enumerated(EnumType.STRING)
    val provider: AuthProvider = AuthProvider.LOCAL
)

enum class AuthProvider {
    LOCAL, GOOGLE, GITHUB
}
