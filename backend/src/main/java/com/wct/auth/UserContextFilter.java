package com.wct.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class UserContextFilter extends OncePerRequestFilter {

    private final AuthenticatedUserContextMapper contextMapper;

    public UserContextFilter(AuthenticatedUserContextMapper contextMapper) {
        this.contextMapper = contextMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            UserContext userContext = resolveUserContext();
            if (userContext == null) {
                filterChain.doFilter(request, response);
                return;
            }

            UserContextHolder.set(userContext);
            filterChain.doFilter(request, response);
        } catch (RuntimeException ex) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, ex.getMessage());
        } finally {
            UserContextHolder.clear();
        }
    }

    private UserContext resolveUserContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserContext context) {
            return context;
        }
        if (principal instanceof Jwt jwt) {
            return contextMapper.fromJwt(jwt);
        }
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return contextMapper.fromJwt(jwtAuthenticationToken.getToken());
        }
        if (authentication.getCredentials() instanceof Jwt jwt) {
            return contextMapper.fromJwt(jwt);
        }
        if (authentication.getDetails() instanceof Jwt jwt) {
            return contextMapper.fromJwt(jwt);
        }
        if (principal != null) {
            throw new IllegalStateException("Unsupported authenticated principal: " + principal.getClass().getName());
        }
        return null;
    }
}
