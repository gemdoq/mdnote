package com.everforest.mdnote.note

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "shared_notes")
class SharedNote(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(name = "user_id", nullable = false)
    val userId: Long,
    @Column(nullable = false)
    val filename: String,
    @Column(unique = true, nullable = false)
    val token: String,
    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
