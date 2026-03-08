package com.everforest.mdnote

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MdnoteApplication

fun main(args: Array<String>) {
    runApplication<MdnoteApplication>(*args)
}
