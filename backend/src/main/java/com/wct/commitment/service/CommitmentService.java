package com.wct.commitment.service;

import com.wct.auth.UserContext;
import com.wct.commitment.dto.*;
import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.plan.PlanStatus;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.service.WeeklyPlanService;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommitmentService {

    private final CommitmentRepository commitmentRepository;
    private final WeeklyPlanService weeklyPlanService;
    private final OutcomeRepository outcomeRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final RallyCryRepository rallyCryRepository;
    private final EntityManager entityManager;

    public CommitmentService(CommitmentRepository commitmentRepository,
                             WeeklyPlanService weeklyPlanService,
                             OutcomeRepository outcomeRepository,
                             DefiningObjectiveRepository definingObjectiveRepository,
                             RallyCryRepository rallyCryRepository,
                             EntityManager entityManager) {
        this.commitmentRepository = commitmentRepository;
        this.weeklyPlanService = weeklyPlanService;
        this.outcomeRepository = outcomeRepository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.rallyCryRepository = rallyCryRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public CommitmentResponse create(UUID planId, CreateCommitmentRequest req, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyDraft(plan);

        if (req.description() == null || req.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must not be blank");
        }

        Outcome outcome = outcomeRepository.findById(req.outcomeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Outcome not found"));

        if (outcome.getArchivedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Outcome is archived");
        }

        long count = commitmentRepository.countByWeeklyPlanId(planId);

        Commitment commitment = new Commitment();
        commitment.setWeeklyPlanId(planId);
        commitment.setOutcomeId(req.outcomeId());
        commitment.setDescription(req.description());
        commitment.setNotes(req.notes());
        commitment.setPriority((int) count + 1);

        commitment = commitmentRepository.saveAndFlush(commitment);
        entityManager.refresh(commitment);
        return buildResponse(commitment);
    }

    public List<CommitmentResponse> listByPlan(UUID planId, UserContext user) {
        weeklyPlanService.getPlanWithAuthCheck(planId, user);
        List<Commitment> commitments = commitmentRepository.findByWeeklyPlanIdOrderByPriority(planId);
        return commitments.stream().map(this::buildResponse).collect(Collectors.toList());
    }

    public CommitmentResponse getById(UUID planId, UUID commitmentId, UserContext user) {
        weeklyPlanService.getPlanWithAuthCheck(planId, user);
        Commitment commitment = commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found"));

        if (!commitment.getWeeklyPlanId().equals(planId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found in this plan");
        }

        return buildResponse(commitment);
    }

    @Transactional
    public CommitmentResponse update(UUID planId, UUID commitmentId, UpdateCommitmentRequest req, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyDraft(plan);

        Commitment commitment = commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found"));

        if (!commitment.getWeeklyPlanId().equals(planId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found in this plan");
        }

        if (req.description() != null) {
            if (req.description().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must not be blank");
            }
            commitment.setDescription(req.description());
        }

        if (req.outcomeId() != null) {
            Outcome outcome = outcomeRepository.findById(req.outcomeId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Outcome not found"));
            if (outcome.getArchivedAt() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Outcome is archived");
            }
            commitment.setOutcomeId(req.outcomeId());
        }

        if (req.notes() != null) {
            commitment.setNotes(req.notes());
        }

        commitment = commitmentRepository.saveAndFlush(commitment);
        entityManager.refresh(commitment);
        return buildResponse(commitment);
    }

    @Transactional
    public void delete(UUID planId, UUID commitmentId, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyDraft(plan);

        Commitment commitment = commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found"));

        if (!commitment.getWeeklyPlanId().equals(planId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found in this plan");
        }

        commitmentRepository.delete(commitment);

        // Recompact priorities
        List<Commitment> remaining = commitmentRepository.findByWeeklyPlanIdOrderByPriority(planId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPriority(i + 1);
        }
        commitmentRepository.saveAll(remaining);
    }

    @Transactional
    public List<CommitmentResponse> reorder(UUID planId, ReorderCommitmentsRequest req, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyDraft(plan);

        List<Commitment> existing = commitmentRepository.findByWeeklyPlanIdOrderByPriority(planId);
        Set<UUID> existingIds = existing.stream().map(Commitment::getId).collect(Collectors.toSet());
        Set<UUID> requestedIds = new LinkedHashSet<>(req.orderedCommitmentIds());

        if (existingIds.size() != requestedIds.size() || !existingIds.equals(requestedIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ordered commitment IDs must match exactly the commitments in this plan");
        }

        Map<UUID, Commitment> byId = existing.stream().collect(Collectors.toMap(Commitment::getId, c -> c));
        List<Commitment> reordered = new ArrayList<>();
        int priority = 1;
        for (UUID id : req.orderedCommitmentIds()) {
            Commitment c = byId.get(id);
            c.setPriority(priority++);
            reordered.add(c);
        }
        commitmentRepository.saveAll(reordered);

        return reordered.stream().map(this::buildResponse).collect(Collectors.toList());
    }

    @Transactional
    public CommitmentResponse reconcile(UUID planId, UUID commitmentId, ReconcileCommitmentRequest req, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyReconciling(plan);

        Commitment commitment = commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found"));

        if (!commitment.getWeeklyPlanId().equals(planId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found in this plan");
        }

        commitment.setActualStatus(req.actualStatus());
        commitment.setReconciliationNotes(req.reconciliationNotes());

        commitment = commitmentRepository.saveAndFlush(commitment);
        entityManager.refresh(commitment);
        return buildResponse(commitment);
    }

    @Transactional
    public List<CommitmentResponse> bulkReconcile(UUID planId, BulkReconcileRequest req, UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanById(planId);
        verifyOwnership(plan, user);
        verifyReconciling(plan);

        List<CommitmentResponse> results = new ArrayList<>();
        for (BulkReconcileRequest.BulkReconcileItem item : req.items()) {
            Commitment commitment = commitmentRepository.findById(item.commitmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Commitment not found: " + item.commitmentId()));

            if (!commitment.getWeeklyPlanId().equals(planId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Commitment not found in this plan: " + item.commitmentId());
            }

            commitment.setActualStatus(item.actualStatus());
            commitment.setReconciliationNotes(item.reconciliationNotes());
            commitment = commitmentRepository.saveAndFlush(commitment);
            entityManager.refresh(commitment);
            results.add(buildResponse(commitment));
        }
        return results;
    }

    public List<Commitment> getUnannotatedCommitments(UUID planId) {
        return commitmentRepository.findByWeeklyPlanIdAndActualStatusIsNull(planId);
    }

    private CommitmentResponse buildResponse(Commitment commitment) {
        Outcome outcome = outcomeRepository.findById(commitment.getOutcomeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Outcome not found"));
        DefiningObjective defObj = definingObjectiveRepository.findById(outcome.getDefiningObjectiveId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Defining objective not found"));
        RallyCry rallyCry = rallyCryRepository.findById(defObj.getRallyCryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Rally cry not found"));

        return CommitmentResponse.from(commitment, outcome, defObj, rallyCry);
    }

    private void verifyOwnership(WeeklyPlan plan, UserContext user) {
        if (!plan.getUserId().equals(user.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private void verifyDraft(WeeklyPlan plan) {
        if (plan.getStatus() != PlanStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plan is not in DRAFT status");
        }
    }

    private void verifyReconciling(WeeklyPlan plan) {
        if (plan.getStatus() != PlanStatus.RECONCILING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plan is not in RECONCILING status");
        }
    }
}
