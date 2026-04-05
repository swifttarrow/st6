package com.wct.rcdo.controller;

import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.DefiningObjectiveResponse;
import com.wct.rcdo.dto.UpdateDefiningObjectiveRequest;
import com.wct.rcdo.service.DefiningObjectiveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public DefiningObjectiveResponse create(@Valid @RequestBody CreateDefiningObjectiveRequest request) {
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public DefiningObjectiveResponse update(@PathVariable UUID id,
                                            @Valid @RequestBody UpdateDefiningObjectiveRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public DefiningObjectiveResponse archive(@PathVariable UUID id) {
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public DefiningObjectiveResponse unarchive(@PathVariable UUID id) {
        return service.unarchive(id);
    }
}
