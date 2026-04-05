package com.wct.dashboard.controller;

import com.wct.auth.CurrentUser;
import com.wct.auth.Role;
import com.wct.auth.UserContext;
import com.wct.dashboard.dto.TeamOverviewResponse;
import com.wct.dashboard.service.ManagerDashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class ManagerDashboardController {

    private final ManagerDashboardService managerDashboardService;

    public ManagerDashboardController(ManagerDashboardService managerDashboardService) {
        this.managerDashboardService = managerDashboardService;
    }

    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public ResponseEntity<TeamOverviewResponse> getTeamOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) List<String> memberIds,
            @CurrentUser UserContext user) {
        TeamOverviewResponse response = managerDashboardService.getTeamOverview(resolveMemberIds(user, memberIds), date);
        return ResponseEntity.ok(response);
    }

    private List<String> resolveMemberIds(UserContext user, List<String> requestedMemberIds) {
        List<String> normalized = requestedMemberIds == null
                ? List.of()
                : requestedMemberIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (user.role() == Role.LEADERSHIP) {
            if (normalized.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Leadership requests must specify memberIds"
                );
            }
            return normalized;
        }

        if (!user.directReportIds().isEmpty()) {
            if (normalized.isEmpty()) {
                return user.directReportIds();
            }
            if (!user.directReportIds().containsAll(normalized)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requested memberIds exceed manager scope");
            }
            return normalized;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Manager auth context is missing direct-report scope"
        );
    }
}
