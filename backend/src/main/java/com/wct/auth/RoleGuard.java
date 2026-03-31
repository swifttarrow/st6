package com.wct.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Set;

public final class RoleGuard {

    private RoleGuard() {}

    public static void requireRole(Role... allowed) {
        UserContext ctx = UserContextHolder.get();
        if (ctx == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No user context");
        }
        Set<Role> allowedSet = Set.copyOf(Arrays.asList(allowed));
        if (!allowedSet.contains(ctx.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role");
        }
    }
}
