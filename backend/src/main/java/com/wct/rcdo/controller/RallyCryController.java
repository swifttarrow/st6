package com.wct.rcdo.controller;

import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.RallyCryResponse;
import com.wct.rcdo.dto.UpdateRallyCryRequest;
import com.wct.rcdo.service.RallyCryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public RallyCryResponse create(@Valid @RequestBody CreateRallyCryRequest request) {
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
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public RallyCryResponse update(@PathVariable UUID id,
                                   @Valid @RequestBody UpdateRallyCryRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public RallyCryResponse archive(@PathVariable UUID id) {
        return service.archive(id);
    }

    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('MANAGER', 'LEADERSHIP')")
    public RallyCryResponse unarchive(@PathVariable UUID id) {
        return service.unarchive(id);
    }
}
