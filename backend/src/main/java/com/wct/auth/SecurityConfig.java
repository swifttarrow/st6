package com.wct.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.api.ApiErrorResponseFactory;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            UserContextJwtAuthenticationConverter jwtAuthenticationConverter,
                                            ApiErrorResponseFactory apiErrorResponseFactory,
                                            ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, ex) ->
                                writeError(response, objectMapper, apiErrorResponseFactory.create(
                                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                                        "UNAUTHORIZED",
                                        resolveMessage(ex, "Unauthorized"),
                                        request.getRequestURI()
                                )))
                        .accessDeniedHandler((request, response, ex) ->
                                writeError(response, objectMapper, apiErrorResponseFactory.create(
                                        org.springframework.http.HttpStatus.FORBIDDEN,
                                        "FORBIDDEN",
                                        resolveMessage(ex, "Forbidden"),
                                        request.getRequestURI()
                                ))))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll());

        http.oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));

        return http.build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.auth", name = "hmac-secret")
    JwtDecoder hmacJwtDecoder(@Value("${app.auth.hmac-secret}") String secret) {
        SecretKey key = hmacKey(secret);
        return NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.auth", name = "hmac-secret")
    JwtEncoder hmacJwtEncoder(@Value("${app.auth.hmac-secret}") String secret) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(hmacKey(secret)));
    }

    private SecretKey hmacKey(String secret) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.auth.hmac-secret must be at least 32 bytes for HS256");
        }
        return new SecretKeySpec(secretBytes, "HmacSHA256");
    }

    private void writeError(HttpServletResponse response,
                            ObjectMapper objectMapper,
                            Map<String, Object> body) throws java.io.IOException {
        response.setStatus((Integer) body.get("status"));
        response.setContentType("application/json");
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private String resolveMessage(Exception ex, String fallback) {
        if (ex instanceof AuthenticationException authenticationException && authenticationException.getMessage() != null) {
            return authenticationException.getMessage();
        }
        if (ex instanceof AccessDeniedException accessDeniedException && accessDeniedException.getMessage() != null) {
            return accessDeniedException.getMessage();
        }
        return fallback;
    }
}
