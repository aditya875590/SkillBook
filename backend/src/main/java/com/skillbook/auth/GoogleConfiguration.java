package com.skillbook.auth;

import org.springframework.context.annotation.*;
import org.springframework.security.oauth2.jwt.*;

@Configuration
class GoogleConfiguration {
    @Bean JwtDecoder googleDecoder() {
        return NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
    }
}
