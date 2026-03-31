package com.wct.commitment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.dto.CreateCommitmentRequest;
import com.wct.commitment.dto.ReconcileCommitmentRequest;
import com.wct.commitment.dto.UpdateCommitmentRequest;
import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.plan.dto.PlanTransitionRequest;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.repository.OutcomeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class CarryForwardTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OutcomeRepository outcomeRepository;

    @Autowired
    private CommitmentRepository commitmentRepository;

    @Test
    void firstAccessToNextWeek_afterReconciliation_createsCarryForwardCommitments() throws Exception {
        String outcomeId = createFullRcdoPath();

        // Create week 1 plan, add commitments, reconcile with mixed statuses
        String plan1Id = createPlan("user-1", "2026-03-23");
        String c1 = createCommitment(plan1Id, "user-1", "Task A", outcomeId);
        String c2 = createCommitment(plan1Id, "user-1", "Task B", outcomeId);
        String c3 = createCommitment(plan1Id, "user-1", "Task C", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        transitionPlan(plan1Id, "user-1", "RECONCILING");

        reconcileCommitment(plan1Id, "user-1", c1, ActualStatus.COMPLETED, null);
        reconcileCommitment(plan1Id, "user-1", c2, ActualStatus.PARTIALLY_COMPLETED, "Half done");
        reconcileCommitment(plan1Id, "user-1", c3, ActualStatus.NOT_STARTED, null);

        transitionPlan(plan1Id, "user-1", "RECONCILED");

        // Access next week - should trigger carry forward
        String plan2Id = createPlan("user-1", "2026-03-30");

        // List commitments on week 2 plan
        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].description").value("Task B"))
                .andExpect(jsonPath("$[0].carriedForward").value(true))
                .andExpect(jsonPath("$[0].carriedForwardFromId").value(c2))
                .andExpect(jsonPath("$[0].priority").value(1))
                .andExpect(jsonPath("$[1].description").value("Task C"))
                .andExpect(jsonPath("$[1].carriedForward").value(true))
                .andExpect(jsonPath("$[1].carriedForwardFromId").value(c3))
                .andExpect(jsonPath("$[1].priority").value(2));
    }

    @Test
    void onlyPartiallyCompletedAndNotStarted_areCarriedForward() throws Exception {
        String outcomeId = createFullRcdoPath();

        String plan1Id = createPlan("user-1", "2026-03-23");
        String c1 = createCommitment(plan1Id, "user-1", "Completed task", outcomeId);
        String c2 = createCommitment(plan1Id, "user-1", "Dropped task", outcomeId);
        String c3 = createCommitment(plan1Id, "user-1", "Partial task", outcomeId);
        String c4 = createCommitment(plan1Id, "user-1", "Not started task", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        transitionPlan(plan1Id, "user-1", "RECONCILING");

        reconcileCommitment(plan1Id, "user-1", c1, ActualStatus.COMPLETED, null);
        reconcileCommitment(plan1Id, "user-1", c2, ActualStatus.DROPPED, null);
        reconcileCommitment(plan1Id, "user-1", c3, ActualStatus.PARTIALLY_COMPLETED, null);
        reconcileCommitment(plan1Id, "user-1", c4, ActualStatus.NOT_STARTED, null);

        transitionPlan(plan1Id, "user-1", "RECONCILED");

        String plan2Id = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].description").value("Partial task"))
                .andExpect(jsonPath("$[1].description").value("Not started task"));
    }

    @Test
    void carriedForwardCommitments_haveCarriedForwardFromIdSet() throws Exception {
        String outcomeId = createFullRcdoPath();

        String plan1Id = createPlan("user-1", "2026-03-23");
        String c1 = createCommitment(plan1Id, "user-1", "Task A", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        transitionPlan(plan1Id, "user-1", "RECONCILING");
        reconcileCommitment(plan1Id, "user-1", c1, ActualStatus.NOT_STARTED, null);
        transitionPlan(plan1Id, "user-1", "RECONCILED");

        String plan2Id = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].carriedForwardFromId").value(c1))
                .andExpect(jsonPath("$[0].carriedForward").value(true));
    }

    @Test
    void carryForward_isIdempotent_secondGetDoesNotDuplicate() throws Exception {
        String outcomeId = createFullRcdoPath();

        String plan1Id = createPlan("user-1", "2026-03-23");
        String c1 = createCommitment(plan1Id, "user-1", "Task A", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        transitionPlan(plan1Id, "user-1", "RECONCILING");
        reconcileCommitment(plan1Id, "user-1", c1, ActualStatus.NOT_STARTED, null);
        transitionPlan(plan1Id, "user-1", "RECONCILED");

        // First access creates plan + carry forward
        String plan2Id = createPlan("user-1", "2026-03-30");

        // Second access should return same plan, no duplicates
        String plan2IdAgain = createPlan("user-1", "2026-03-30");

        // Should be same plan
        assert plan2Id.equals(plan2IdAgain);

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void ifPriorWeekIsLocked_noCarryForward() throws Exception {
        String outcomeId = createFullRcdoPath();

        String plan1Id = createPlan("user-1", "2026-03-23");
        createCommitment(plan1Id, "user-1", "Task A", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        // Not reconciled - just LOCKED

        String plan2Id = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void ifPriorWeekDoesNotExist_noCarryForward() throws Exception {
        // No prior week plan at all, just create next week's plan
        String plan2Id = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void carriedForwardItem_withArchivedOutcome_hasOutcomeArchivedTrue() throws Exception {
        String outcomeId = createFullRcdoPath();

        String plan1Id = createPlan("user-1", "2026-03-23");
        String c1 = createCommitment(plan1Id, "user-1", "Task A", outcomeId);

        transitionPlan(plan1Id, "user-1", "LOCKED");
        transitionPlan(plan1Id, "user-1", "RECONCILING");
        reconcileCommitment(plan1Id, "user-1", c1, ActualStatus.NOT_STARTED, null);
        transitionPlan(plan1Id, "user-1", "RECONCILED");

        // Archive the outcome after reconciliation
        mockMvc.perform(patch("/api/rcdo/outcomes/" + outcomeId + "/archive")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());

        // Access next week
        String plan2Id = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + plan2Id + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].outcomeArchived").value(true));
    }

    @Test
    void lockingPlan_withArchivedOutcomeCommitments_returns409() throws Exception {
        String outcomeId = createFullRcdoPath();

        String planId = createPlan("user-1", "2026-03-30");
        createCommitment(planId, "user-1", "Task A", outcomeId);

        // Archive the outcome directly via repository to bypass active-commitment guard
        Outcome outcome = outcomeRepository.findById(UUID.fromString(outcomeId)).orElseThrow();
        outcome.setArchivedAt(OffsetDateTime.now());
        outcomeRepository.saveAndFlush(outcome);

        // Try to lock - should fail
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("LOCKED"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("ARCHIVED_OUTCOME_REFERENCES"))
                .andExpect(jsonPath("$.commitmentIds", hasSize(1)));
    }

    @Test
    void afterRelinkingToActiveOutcome_lockingSucceeds() throws Exception {
        String outcomeId = createFullRcdoPath();
        String outcomeId2 = createOutcomeOnExistingPath();

        String planId = createPlan("user-1", "2026-03-30");
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);

        // Archive the first outcome directly via repository to bypass active-commitment guard
        Outcome outcome = outcomeRepository.findById(UUID.fromString(outcomeId)).orElseThrow();
        outcome.setArchivedAt(OffsetDateTime.now());
        outcomeRepository.saveAndFlush(outcome);

        // Try to lock - should fail
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("LOCKED"))))
                .andExpect(status().isConflict());

        // Re-link commitment to active outcome
        UpdateCommitmentRequest updateReq = new UpdateCommitmentRequest(null, UUID.fromString(outcomeId2), null);
        mockMvc.perform(put("/api/plans/" + planId + "/commitments/" + commitmentId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Now locking should succeed
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("LOCKED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCKED"));
    }

    // --- Helpers ---

    private String createPlan(String userId, String date) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/plans")
                        .param("date", date)
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private void transitionPlan(String planId, String userId, String targetStatus) throws Exception {
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest(targetStatus))))
                .andExpect(status().isOk());
    }

    private String lastRallyCryId;
    private String lastDefObjId;

    private String createFullRcdoPath() throws Exception {
        MvcResult rcResult = mockMvc.perform(post("/api/rcdo/rally-cries")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRallyCryRequest("Test RC", "RC desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        lastRallyCryId = objectMapper.readTree(rcResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult doResult = mockMvc.perform(post("/api/rcdo/defining-objectives")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateDefiningObjectiveRequest(UUID.fromString(lastRallyCryId), "Test DO", "DO desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        lastDefObjId = objectMapper.readTree(doResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult outcomeResult = mockMvc.perform(post("/api/rcdo/outcomes")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOutcomeRequest(UUID.fromString(lastDefObjId), "Test Outcome", "Outcome desc"))))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(outcomeResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createOutcomeOnExistingPath() throws Exception {
        MvcResult outcomeResult = mockMvc.perform(post("/api/rcdo/outcomes")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOutcomeRequest(UUID.fromString(lastDefObjId), "Second Outcome", "desc"))))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(outcomeResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createCommitment(String planId, String userId, String description, String outcomeId) throws Exception {
        CreateCommitmentRequest req = new CreateCommitmentRequest(description, UUID.fromString(outcomeId), null);

        MvcResult result = mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private void reconcileCommitment(String planId, String userId, String commitmentId,
                                     ActualStatus status, String notes) throws Exception {
        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(status, notes);

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
