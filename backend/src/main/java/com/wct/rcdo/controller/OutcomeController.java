package com.wct.rcdo.controller;

import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.OutcomeResponse;
import com.wct.rcdo.dto.UpdateOutcomeRequest;
import com.wct.rcdo.service.OutcomeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public OutcomeResponse create(@Valid @RequestBody CreateOutcomeRequest request) {
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public OutcomeResponse update(@PathVariable UUID id,
                                  @Valid @RequestBody UpdateOutcomeRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public OutcomeResponse archive(@PathVariable UUID id) {
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public OutcomeResponse unarchive(@PathVariable UUID id) {
        return service.unarchive(id);
    }
}
