package com.wct.commitment.controller;

import com.wct.auth.UserContext;
import com.wct.auth.UserContextHolder;
import com.wct.commitment.dto.*;
import com.wct.commitment.service.CommitmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans/{planId}/commitments")
public class CommitmentController {

    private final CommitmentService commitmentService;

    public CommitmentController(CommitmentService commitmentService) {
        this.commitmentService = commitmentService;
    }

    @PostMapping
    public ResponseEntity<CommitmentResponse> create(@PathVariable UUID planId,
                                                     @RequestBody CreateCommitmentRequest request) {
        UserContext user = UserContextHolder.get();
        CommitmentResponse response = commitmentService.create(planId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CommitmentResponse>> list(@PathVariable UUID planId) {
        List<CommitmentResponse> responses = commitmentService.listByPlan(planId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{commitmentId}")
    public ResponseEntity<CommitmentResponse> getById(@PathVariable UUID planId,
                                                      @PathVariable UUID commitmentId) {
        CommitmentResponse response = commitmentService.getById(planId, commitmentId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{commitmentId}")
    public ResponseEntity<CommitmentResponse> update(@PathVariable UUID planId,
                                                     @PathVariable UUID commitmentId,
                                                     @RequestBody UpdateCommitmentRequest request) {
        UserContext user = UserContextHolder.get();
        CommitmentResponse response = commitmentService.update(planId, commitmentId, request, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commitmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID planId,
                                       @PathVariable UUID commitmentId) {
        UserContext user = UserContextHolder.get();
        commitmentService.delete(planId, commitmentId, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<List<CommitmentResponse>> reorder(@PathVariable UUID planId,
                                                            @RequestBody ReorderCommitmentsRequest request) {
        UserContext user = UserContextHolder.get();
        List<CommitmentResponse> responses = commitmentService.reorder(planId, request, user);
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{commitmentId}/reconcile")
    public ResponseEntity<CommitmentResponse> reconcile(@PathVariable UUID planId,
                                                        @PathVariable UUID commitmentId,
                                                        @RequestBody ReconcileCommitmentRequest request) {
        UserContext user = UserContextHolder.get();
        CommitmentResponse response = commitmentService.reconcile(planId, commitmentId, request, user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reconcile")
    public ResponseEntity<List<CommitmentResponse>> bulkReconcile(@PathVariable UUID planId,
                                                                   @RequestBody BulkReconcileRequest request) {
        UserContext user = UserContextHolder.get();
        List<CommitmentResponse> responses = commitmentService.bulkReconcile(planId, request, user);
        return ResponseEntity.ok(responses);
    }
}
