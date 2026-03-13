package com.everforest.mdnote.note

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserFavoriteRepository : JpaRepository<UserFavorite, Long> {
    fun findByUserId(userId: Long): List<UserFavorite>
    fun findByUserIdAndFilename(userId: Long, filename: String): Optional<UserFavorite>
    fun deleteByUserIdAndFilename(userId: Long, filename: String)
    fun existsByUserIdAndFilename(userId: Long, filename: String): Boolean
}
