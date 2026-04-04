package com.wct.plan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.dto.CreateCommitmentRequest;
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

import java.util.UUID;

import static com.wct.support.TestJwtAuth.jwtAuth;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ManagerUnlockTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String BASE_URL = "/api/plans";

    // --- Unlock tests ---

    @Test
    void managerUnlocksLockedPlan_returns200AndDraft() throws Exception {
        String planId = createLockedPlan();

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.id").value(planId));
    }

    @Test
    void icAttemptingUnlock_returns403() throws Exception {
        String planId = createLockedPlan();

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("ic-1", "IC", "team-1", "mgr-1")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unlockingDraftPlan_returns409() throws Exception {
        String planId = createPlan();

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Plan can only be unlocked from LOCKED state"));
    }

    @Test
    void unlockingReconcilingPlan_returns409() throws Exception {
        String planId = createLockedPlan();
        transitionPlan(planId, "ic-1", "RECONCILING");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Plan can only be unlocked from LOCKED state"));
    }

    @Test
    void unlockingReconciledPlan_returns409() throws Exception {
        String planId = createLockedPlan();
        transitionPlan(planId, "ic-1", "RECONCILING");
        transitionPlan(planId, "ic-1", "RECONCILED");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Plan can only be unlocked from LOCKED state"));
    }

    @Test
    void transitionAuditLog_recordsLockedToDraftWithManagerUserId() throws Exception {
        String planId = createLockedPlan();

        // Unlock
        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isOk());

        // Check audit log - should have 2 entries: DRAFT->LOCKED and LOCKED->DRAFT
        mockMvc.perform(get(BASE_URL + "/" + planId + "/transitions")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].fromStatus").value("LOCKED"))
                .andExpect(jsonPath("$[1].toStatus").value("DRAFT"))
                .andExpect(jsonPath("$[1].triggeredBy").value("mgr-1"));
    }

    @Test
    void afterUnlock_icCanAddCommitment() throws Exception {
        String planId = createLockedPlan();

        // Unlock as manager
        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1")))
                .andExpect(status().isOk());

        // Create RCDO path for commitment
        String outcomeId = createFullRcdoPath();

        // IC adds commitment to the now-DRAFT plan
        CreateCommitmentRequest req = new CreateCommitmentRequest("New commitment", UUID.fromString(outcomeId), null);

        mockMvc.perform(post(BASE_URL + "/" + planId + "/commitments")
                        .with(jwtAuth("ic-1", "IC", "team-1", "mgr-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("New commitment"));
    }

    @Test
    void leadershipUnlocksLockedPlan_returns403() throws Exception {
        String planId = createLockedPlan();

        mockMvc.perform(post(BASE_URL + "/" + planId + "/unlock")
                        .with(jwtAuth("leader-1", "LEADERSHIP", "team-1")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only managers can unlock plans"));
    }

    // --- Helpers ---

    private String createPlan() throws Exception {
        MvcResult result = mockMvc.perform(get(BASE_URL)
                        .param("date", "2026-03-30")
                        .with(jwtAuth("ic-1", "IC", "team-1", "mgr-1")))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createLockedPlan() throws Exception {
        String planId = createPlan();
        transitionPlan(planId, "ic-1", "LOCKED");
        return planId;
    }

    private void transitionPlan(String planId, String userId, String targetStatus) throws Exception {
        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .with(jwtAuth(userId, "IC", "team-1", "mgr-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest(targetStatus))))
                .andExpect(status().isOk());
    }

    private String createFullRcdoPath() throws Exception {
        // Create Rally Cry
        MvcResult rcResult = mockMvc.perform(post("/api/rcdo/rally-cries")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRallyCryRequest("Test RC", "RC desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        String rallyCryId = objectMapper.readTree(rcResult.getResponse().getContentAsString()).get("id").asText();

        // Create Defining Objective
        MvcResult doResult = mockMvc.perform(post("/api/rcdo/defining-objectives")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateDefiningObjectiveRequest(UUID.fromString(rallyCryId), "Test DO", "DO desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        String defObjId = objectMapper.readTree(doResult.getResponse().getContentAsString()).get("id").asText();

        // Create Outcome
        MvcResult outcomeResult = mockMvc.perform(post("/api/rcdo/outcomes")
                        .with(jwtAuth("mgr-1", "MANAGER", "team-1", "ic-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOutcomeRequest(UUID.fromString(defObjId), "Test Outcome", "Outcome desc"))))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(outcomeResult.getResponse().getContentAsString()).get("id").asText();
    }
}
