package com.everforest.mdnote.note

import jakarta.persistence.*

@Entity
@Table(name = "user_favorites", uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "filename"])])
class UserFavorite(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(name = "user_id", nullable = false)
    val userId: Long,
    @Column(nullable = false)
    val filename: String
)
