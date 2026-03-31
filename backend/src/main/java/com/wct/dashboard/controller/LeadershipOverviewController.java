package com.wct.dashboard.controller;

import com.wct.auth.Role;
import com.wct.auth.RoleGuard;
import com.wct.dashboard.dto.OrgOverviewResponse;
import com.wct.dashboard.service.LeadershipOverviewService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
public class LeadershipOverviewController {

    private final LeadershipOverviewService leadershipOverviewService;

    public LeadershipOverviewController(LeadershipOverviewService leadershipOverviewService) {
        this.leadershipOverviewService = leadershipOverviewService;
    }

    @GetMapping("/leadership")
    public ResponseEntity<OrgOverviewResponse> getOrgOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        RoleGuard.requireRole(Role.LEADERSHIP);
        OrgOverviewResponse response = leadershipOverviewService.getOrgOverview(date);
        return ResponseEntity.ok(response);
    }
}
