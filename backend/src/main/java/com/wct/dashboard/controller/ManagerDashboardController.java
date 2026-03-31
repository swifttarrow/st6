package com.wct.dashboard.controller;

import com.wct.auth.Role;
import com.wct.auth.RoleGuard;
import com.wct.dashboard.dto.TeamOverviewResponse;
import com.wct.dashboard.service.ManagerDashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<TeamOverviewResponse> getTeamOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam List<String> memberIds) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        TeamOverviewResponse response = managerDashboardService.getTeamOverview(memberIds, date);
        return ResponseEntity.ok(response);
    }
}
