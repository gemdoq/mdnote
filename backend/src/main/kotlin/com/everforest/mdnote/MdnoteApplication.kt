package com.everforest.mdnote

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching

@SpringBootApplication
@EnableCaching
class MdnoteApplication

fun main(args: Array<String>) {
    runApplication<MdnoteApplication>(*args)
}
