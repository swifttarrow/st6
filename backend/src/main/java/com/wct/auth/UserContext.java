package com.wct.auth;

import java.util.List;

public record UserContext(String userId,
                          Role role,
                          String teamId,
                          String managerId,
                          List<String> directReportIds) {

    public UserContext {
        directReportIds = directReportIds == null ? List.of() : List.copyOf(directReportIds);
    }
}
