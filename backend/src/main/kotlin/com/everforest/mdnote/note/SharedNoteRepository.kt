package com.everforest.mdnote.note

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface SharedNoteRepository : JpaRepository<SharedNote, Long> {
    fun findByToken(token: String): Optional<SharedNote>
    fun findByUserIdAndFilename(userId: Long, filename: String): Optional<SharedNote>
    fun deleteByUserIdAndFilename(userId: Long, filename: String)
}
