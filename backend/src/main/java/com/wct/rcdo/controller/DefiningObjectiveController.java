package com.wct.rcdo.controller;

import com.wct.auth.Role;
import com.wct.auth.RoleGuard;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.DefiningObjectiveResponse;
import com.wct.rcdo.dto.UpdateDefiningObjectiveRequest;
import com.wct.rcdo.service.DefiningObjectiveService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rcdo/defining-objectives")
public class DefiningObjectiveController {

    private final DefiningObjectiveService service;

    public DefiningObjectiveController(DefiningObjectiveService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DefiningObjectiveResponse create(@RequestBody CreateDefiningObjectiveRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.create(request);
    }

    @GetMapping
    public List<DefiningObjectiveResponse> findAll(
            @RequestParam UUID rallyCryId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.findAll(rallyCryId, includeArchived);
    }

    @GetMapping("/{id}")
    public DefiningObjectiveResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public DefiningObjectiveResponse update(@PathVariable UUID id,
                                            @RequestBody UpdateDefiningObjectiveRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    public DefiningObjectiveResponse archive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    public DefiningObjectiveResponse unarchive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.unarchive(id);
    }
}
