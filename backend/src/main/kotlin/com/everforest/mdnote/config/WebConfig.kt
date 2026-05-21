package com.everforest.mdnote.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig : WebMvcConfigurer {

    companion object {
        private val ALLOWED_ORIGINS = arrayOf(
            "http://localhost:5173",
            "http://everforest.iptime.org:8089",
            "https://everforest.iptime.org:8089",
            "https://mdnote.matchhub.co.kr"
        )
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/actuator/**")
            .allowedOrigins(*ALLOWED_ORIGINS)
            .allowedMethods("GET")
            .allowedHeaders("*")
        registry.addMapping("/api/**")
            .allowedOrigins(*ALLOWED_ORIGINS)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
    }
}
