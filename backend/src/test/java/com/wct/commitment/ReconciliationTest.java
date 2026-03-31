package com.wct.commitment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.dto.BulkReconcileRequest;
import com.wct.commitment.dto.CreateCommitmentRequest;
import com.wct.commitment.dto.ReconcileCommitmentRequest;
import com.wct.plan.dto.PlanTransitionRequest;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ReconciliationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void singleReconcile_setsActualStatus() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(ActualStatus.COMPLETED, "Done well");

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.reconciliationNotes").value("Done well"));
    }

    @Test
    void bulkReconcile_setsActualStatusOnMultiple() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "Task A", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Task B", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        BulkReconcileRequest req = new BulkReconcileRequest(List.of(
                new BulkReconcileRequest.BulkReconcileItem(UUID.fromString(c1), ActualStatus.COMPLETED, "All done"),
                new BulkReconcileRequest.BulkReconcileItem(UUID.fromString(c2), ActualStatus.DROPPED, "Dropped it")
        ));

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].actualStatus").value("COMPLETED"))
                .andExpect(jsonPath("$[0].reconciliationNotes").value("All done"))
                .andExpect(jsonPath("$[1].actualStatus").value("DROPPED"))
                .andExpect(jsonPath("$[1].reconciliationNotes").value("Dropped it"));
    }

    @Test
    void reconcileOnDraftPlan_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);

        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(ActualStatus.COMPLETED, null);

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void reconcileOnLockedPlan_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");

        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(ActualStatus.COMPLETED, null);

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void transitionToReconciled_withAllAnnotated_succeeds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "Task A", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Task B", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        // Reconcile both
        reconcileCommitment(planId, "user-1", c1, ActualStatus.COMPLETED, null);
        reconcileCommitment(planId, "user-1", c2, ActualStatus.NOT_STARTED, null);

        // Transition to RECONCILED
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECONCILED"));
    }

    @Test
    void transitionToReconciled_withUnannotated_returns409WithIds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "Task A", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Task B", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        // Only reconcile one
        reconcileCommitment(planId, "user-1", c1, ActualStatus.COMPLETED, null);

        // Try to transition to RECONCILED - should fail
        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILED"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INCOMPLETE_RECONCILIATION"))
                .andExpect(jsonPath("$.unannotatedCommitmentIds", hasSize(1)))
                .andExpect(jsonPath("$.unannotatedCommitmentIds[0]").value(c2));
    }

    @Test
    void transitionToReconciled_emptyPlan_succeeds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        mockMvc.perform(post("/api/plans/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECONCILED"));
    }

    @Test
    void reconciliationNotes_areOptional() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(ActualStatus.COMPLETED, null);

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.reconciliationNotes").doesNotExist());
    }

    @Test
    void icCanUpdateActualStatusMultipleTimes() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        // First reconcile
        reconcileCommitment(planId, "user-1", commitmentId, ActualStatus.COMPLETED, "First pass");

        // Update again
        ReconcileCommitmentRequest req2 = new ReconcileCommitmentRequest(ActualStatus.PARTIALLY_COMPLETED, "Changed my mind");

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualStatus").value("PARTIALLY_COMPLETED"))
                .andExpect(jsonPath("$.reconciliationNotes").value("Changed my mind"));
    }

    @Test
    void nonOwnerIC_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task A", outcomeId);
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        ReconcileCommitmentRequest req = new ReconcileCommitmentRequest(ActualStatus.COMPLETED, null);

        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
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
