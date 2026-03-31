package com.wct.rcdo.controller;

import com.wct.auth.Role;
import com.wct.auth.RoleGuard;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.OutcomeResponse;
import com.wct.rcdo.dto.UpdateOutcomeRequest;
import com.wct.rcdo.service.OutcomeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rcdo/outcomes")
public class OutcomeController {

    private final OutcomeService service;

    public OutcomeController(OutcomeService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OutcomeResponse create(@RequestBody CreateOutcomeRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.create(request);
    }

    @GetMapping
    public List<OutcomeResponse> findAll(
            @RequestParam UUID definingObjectiveId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.findAll(definingObjectiveId, includeArchived);
    }

    @GetMapping("/{id}")
    public OutcomeResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public OutcomeResponse update(@PathVariable UUID id,
                                  @RequestBody UpdateOutcomeRequest request) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    public OutcomeResponse archive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    public OutcomeResponse unarchive(@PathVariable UUID id) {
        RoleGuard.requireRole(Role.MANAGER, Role.LEADERSHIP);
        return service.unarchive(id);
    }
}
