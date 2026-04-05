package com.wct.support;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class TestJwtAuth {

    private TestJwtAuth() {
    }

    public static RequestPostProcessor jwtAuth(String userId, String role) {
        return jwtAuth(userId, role, null);
    }

    public static RequestPostProcessor jwtAuth(String userId, String role, String teamId) {
        return jwtAuth(userId, role, teamId, null);
    }

    public static RequestPostProcessor jwtAuth(String userId,
                                               String role,
                                               String teamId,
                                               String fourthValue,
                                               String... remainingValues) {
        String normalizedRole = role.toUpperCase(Locale.US);
        return SecurityMockMvcRequestPostProcessors.jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_" + normalizedRole))
                .jwt(jwt -> {
            jwt.subject(userId);
            jwt.claim("role", role);
            if (teamId != null && !teamId.isBlank()) {
                jwt.claim("team_id", teamId);
            }

            if ("IC".equals(normalizedRole)) {
                if (fourthValue != null && !fourthValue.isBlank()) {
                    jwt.claim("manager_id", fourthValue);
                }
                if (remainingValues.length > 0) {
                    jwt.claim("direct_reports", List.of(remainingValues));
                }
                return;
            }

            List<String> directReports = new ArrayList<>();
            if (fourthValue != null && !fourthValue.isBlank()) {
                directReports.add(fourthValue);
            }
            for (String value : remainingValues) {
                if (value != null && !value.isBlank()) {
                    directReports.add(value);
                }
            }
            if (!directReports.isEmpty()) {
                jwt.claim("direct_reports", List.copyOf(directReports));
            }
        });
    }
}
