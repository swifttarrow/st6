package com.wct.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String userRole = request.getHeader("X-User-Role");

        if (userId == null || userId.isBlank() || userRole == null || userRole.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing required headers");
            return;
        }

        Role role;
        try {
            role = Role.valueOf(userRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid role");
            return;
        }

        String teamId = request.getHeader("X-Team-Id");
        String managerId = request.getHeader("X-Manager-Id");

        UserContext context = new UserContext(userId, role, teamId, managerId);
        UserContextHolder.set(context);

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }
}
