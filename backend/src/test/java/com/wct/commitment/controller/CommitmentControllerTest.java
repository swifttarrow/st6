package com.wct.commitment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.dto.CreateCommitmentRequest;
import com.wct.commitment.dto.ReorderCommitmentsRequest;
import com.wct.commitment.dto.UpdateCommitmentRequest;
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
class CommitmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- Create tests ---

    @Test
    void createOnDraftPlan_returns201() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();

        CreateCommitmentRequest req = new CreateCommitmentRequest("Write tests", UUID.fromString(outcomeId), "some notes");

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.description").value("Write tests"))
                .andExpect(jsonPath("$.priority").value(1))
                .andExpect(jsonPath("$.notes").value("some notes"))
                .andExpect(jsonPath("$.outcomeId").value(outcomeId))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void createOnLockedPlan_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");
        String outcomeId = createFullRcdoPath();

        CreateCommitmentRequest req = new CreateCommitmentRequest("Write tests", UUID.fromString(outcomeId), null);

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void createWithArchivedOutcome_returns400() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();

        // Archive the outcome
        mockMvc.perform(patch("/api/rcdo/outcomes/" + outcomeId + "/archive")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());

        CreateCommitmentRequest req = new CreateCommitmentRequest("Write tests", UUID.fromString(outcomeId), null);

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createWithNonExistentOutcome_returns404() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        CreateCommitmentRequest req = new CreateCommitmentRequest("Write tests", UUID.randomUUID(), null);

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createWithBlankDescription_returns400() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();

        CreateCommitmentRequest req = new CreateCommitmentRequest("   ", UUID.fromString(outcomeId), null);

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- Update tests ---

    @Test
    void updateDescriptionAndOutcome_succeeds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId1 = createFullRcdoPath();
        String outcomeId2 = createOutcomeOnExistingPath();
        String commitmentId = createCommitment(planId, "user-1", "Original", outcomeId1);

        UpdateCommitmentRequest req = new UpdateCommitmentRequest("Updated", UUID.fromString(outcomeId2), null);

        mockMvc.perform(put("/api/plans/" + planId + "/commitments/" + commitmentId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated"))
                .andExpect(jsonPath("$.outcomeId").value(outcomeId2));
    }

    // --- Delete tests ---

    @Test
    void deleteRecompactsPriorities() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "First", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Second", outcomeId);
        String c3 = createCommitment(planId, "user-1", "Third", outcomeId);

        // Delete the middle one
        mockMvc.perform(delete("/api/plans/" + planId + "/commitments/" + c2)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isNoContent());

        // Verify remaining have priorities 1 and 2
        mockMvc.perform(get("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(c1))
                .andExpect(jsonPath("$[0].priority").value(1))
                .andExpect(jsonPath("$[1].id").value(c3))
                .andExpect(jsonPath("$[1].priority").value(2));
    }

    // --- Reorder tests ---

    @Test
    void reorderWithValidIds_works() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "First", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Second", outcomeId);
        String c3 = createCommitment(planId, "user-1", "Third", outcomeId);

        ReorderCommitmentsRequest req = new ReorderCommitmentsRequest(
                List.of(UUID.fromString(c3), UUID.fromString(c1), UUID.fromString(c2)));

        mockMvc.perform(put("/api/plans/" + planId + "/commitments/reorder")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(c3))
                .andExpect(jsonPath("$[0].priority").value(1))
                .andExpect(jsonPath("$[1].id").value(c1))
                .andExpect(jsonPath("$[1].priority").value(2))
                .andExpect(jsonPath("$[2].id").value(c2))
                .andExpect(jsonPath("$[2].priority").value(3));
    }

    @Test
    void reorderWithMissingIds_returns400() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        createCommitment(planId, "user-1", "First", outcomeId);
        String c2 = createCommitment(planId, "user-1", "Second", outcomeId);

        // Only include one of two commitments
        ReorderCommitmentsRequest req = new ReorderCommitmentsRequest(
                List.of(UUID.fromString(c2)));

        mockMvc.perform(put("/api/plans/" + planId + "/commitments/reorder")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reorderWithExtraIds_returns400() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String c1 = createCommitment(planId, "user-1", "First", outcomeId);

        ReorderCommitmentsRequest req = new ReorderCommitmentsRequest(
                List.of(UUID.fromString(c1), UUID.randomUUID()));

        mockMvc.perform(put("/api/plans/" + planId + "/commitments/reorder")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- Auth tests ---

    @Test
    void nonOwnerIC_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();

        CreateCommitmentRequest req = new CreateCommitmentRequest("Write tests", UUID.fromString(outcomeId), null);

        mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonOwnerIC_listCommitments_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    @Test
    void manager_listCommitments_forOtherUserPlan_returns200() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void nonOwnerIC_getCommitment_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "Task", outcomeId);

        mockMvc.perform(get("/api/plans/" + planId + "/commitments/" + commitmentId)
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    // --- RCDO path tests ---

    @Test
    void responseIncludesRcdoPathNames() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        String outcomeId = createFullRcdoPath();
        String commitmentId = createCommitment(planId, "user-1", "My commitment", outcomeId);

        mockMvc.perform(get("/api/plans/" + planId + "/commitments/" + commitmentId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcomeName").value("Test Outcome"))
                .andExpect(jsonPath("$.definingObjectiveName").value("Test DO"))
                .andExpect(jsonPath("$.rallyCryName").value("Test RC"))
                .andExpect(jsonPath("$.outcomeId").exists())
                .andExpect(jsonPath("$.definingObjectiveId").exists())
                .andExpect(jsonPath("$.rallyCryId").exists());
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

    // Store the IDs so we can reuse for creating a second outcome on same path
    private String lastRallyCryId;
    private String lastDefObjId;

    /**
     * Creates a full Rally Cry -> Defining Objective -> Outcome path and returns the Outcome ID.
     */
    private String createFullRcdoPath() throws Exception {
        // Create Rally Cry
        MvcResult rcResult = mockMvc.perform(post("/api/rcdo/rally-cries")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRallyCryRequest("Test RC", "RC desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        lastRallyCryId = objectMapper.readTree(rcResult.getResponse().getContentAsString()).get("id").asText();

        // Create Defining Objective
        MvcResult doResult = mockMvc.perform(post("/api/rcdo/defining-objectives")
                        .header("X-User-Id", "mgr-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateDefiningObjectiveRequest(UUID.fromString(lastRallyCryId), "Test DO", "DO desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        lastDefObjId = objectMapper.readTree(doResult.getResponse().getContentAsString()).get("id").asText();

        // Create Outcome
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

    /**
     * Creates a second Outcome on the existing DO (requires createFullRcdoPath to have been called first).
     */
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
}
