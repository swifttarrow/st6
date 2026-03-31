package com.wct.auth;

public record UserContext(String userId, Role role, String teamId, String managerId) {
}
