package com.wct.rcdo.controller;

import com.wct.auth.Role;
import com.wct.auth.RoleGuard;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.RallyCryResponse;
import com.wct.rcdo.dto.UpdateRallyCryRequest;
import com.wct.rcdo.service.RallyCryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rcdo/rally-cries")
public class RallyCryController {

    private final RallyCryService service;

    public RallyCryController(RallyCryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RallyCryResponse create(@RequestBody CreateRallyCryRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.create(request);
    }

    @GetMapping
    public List<RallyCryResponse> findAll(
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.findAll(includeArchived);
    }

    @GetMapping("/{id}")
    public RallyCryResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public RallyCryResponse update(@PathVariable UUID id,
                                   @RequestBody UpdateRallyCryRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    public RallyCryResponse archive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    public RallyCryResponse unarchive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.unarchive(id);
    }
}
