package com.wct.demo;

import com.wct.auth.Role;

import java.util.List;

public record DemoHostContextResponse(String persona,
                                      String label,
                                      String summary,
                                      String defaultRoute,
                                      String accessToken,
                                      String userId,
                                      Role role,
                                      String teamId,
                                      String managerId,
                                      List<String> directReportIds) {
}
