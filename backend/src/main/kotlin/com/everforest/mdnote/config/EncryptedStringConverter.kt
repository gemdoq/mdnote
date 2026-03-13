package com.everforest.mdnote.config

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import org.springframework.stereotype.Component

@Converter
@Component
class EncryptedStringConverter(
    private val encryptionUtil: EncryptionUtil
) : AttributeConverter<String?, String?> {

    override fun convertToDatabaseColumn(attribute: String?): String? {
        return attribute?.let { encryptionUtil.encrypt(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): String? {
        return dbData?.let {
            try {
                encryptionUtil.decrypt(it)
            } catch (e: Exception) {
                it
            }
        }
    }
}
