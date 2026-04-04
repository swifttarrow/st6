package com.wct.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
public class AuthenticatedUserContextMapper {

    private final AuthProperties authProperties;

    public AuthenticatedUserContextMapper(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    public UserContext fromJwt(Jwt jwt) {
        AuthProperties.Claims claims = authProperties.getClaims();

        String userId = requiredClaim(jwt, claims.getUserId(), "JWT missing user identifier claim");
        Role role = parseRole(requiredRoleClaim(jwt, claims.getRole()));
        String teamId = optionalClaim(jwt, claims.getTeamId());
        String managerId = optionalClaim(jwt, claims.getManagerId());
        List<String> directReports = parseClaimList(jwt.getClaim(claims.getDirectReports()));

        return new UserContext(userId, role, teamId, managerId, directReports);
    }

    private String requiredClaim(Jwt jwt, String claimName, String message) {
        String value = optionalClaim(jwt, claimName);
        if (!StringUtils.hasText(value)) {
            throw new BadCredentialsException(message + ": " + claimName);
        }
        return value;
    }

    private String optionalClaim(Jwt jwt, String claimName) {
        return trimToNull(jwt.getClaimAsString(claimName));
    }

    private String requiredRoleClaim(Jwt jwt, String claimName) {
        Object raw = jwt.getClaim(claimName);
        if (raw instanceof String value && StringUtils.hasText(value)) {
            return value;
        }
        if (raw instanceof Collection<?> values) {
            for (Object value : values) {
                if (value instanceof String stringValue && StringUtils.hasText(stringValue)) {
                    return stringValue;
                }
            }
        }
        throw new BadCredentialsException("JWT missing role claim: " + claimName);
    }

    private Role parseRole(String rawRole) {
        try {
            return Role.valueOf(rawRole.trim().toUpperCase(Locale.US));
        } catch (IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid role: " + rawRole);
        }
    }

    private List<String> parseClaimList(Object raw) {
        if (raw == null) {
            return List.of();
        }
        if (raw instanceof Collection<?> collection) {
            return collection.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .map(this::trimToNull)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        }
        if (raw instanceof String value) {
            return parseStringList(value);
        }
        throw new BadCredentialsException("Unsupported direct reports claim format");
    }

    private List<String> parseStringList(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (String token : raw.split(",")) {
            String trimmed = trimToNull(token);
            if (trimmed != null && !values.contains(trimmed)) {
                values.add(trimmed);
            }
        }
        return List.copyOf(values);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
