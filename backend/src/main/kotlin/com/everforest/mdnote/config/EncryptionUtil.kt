package com.everforest.mdnote.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

@Component
class EncryptionUtil(
    @Value("\${jwt.secret}") private val jwtSecret: String
) {

    private val secretKey: SecretKeySpec by lazy {
        val sha256 = MessageDigest.getInstance("SHA-256")
        val keyBytes = sha256.digest(jwtSecret.toByteArray())
        SecretKeySpec(keyBytes, "AES")
    }

    fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance("AES")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        val encrypted = cipher.doFinal(plainText.toByteArray())
        return Base64.getEncoder().encodeToString(encrypted)
    }

    fun decrypt(cipherText: String): String {
        val cipher = Cipher.getInstance("AES")
        cipher.init(Cipher.DECRYPT_MODE, secretKey)
        val decoded = Base64.getDecoder().decode(cipherText)
        return String(cipher.doFinal(decoded))
    }
}
