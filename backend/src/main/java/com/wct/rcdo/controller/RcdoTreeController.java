package com.wct.rcdo.controller;

import com.wct.rcdo.dto.RcdoSearchResult;
import com.wct.rcdo.dto.RcdoTreeResponse;
import com.wct.rcdo.service.RcdoTreeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rcdo")
public class RcdoTreeController {

    private final RcdoTreeService service;

    public RcdoTreeController(RcdoTreeService service) {
        this.service = service;
    }

    @GetMapping("/tree")
    public List<RcdoTreeResponse> getTree(
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.getTree(includeArchived);
    }

    @GetMapping("/outcomes/search")
    public ResponseEntity<List<RcdoSearchResult>> searchOutcomes(
            @RequestParam(name = "q", required = false) String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.searchOutcomes(query));
    }
}
