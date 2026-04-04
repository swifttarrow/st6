package com.wct.plan.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.plan.dto.PlanTransitionRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class WeeklyPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String BASE_URL = "/api/plans";

    // --- Get-or-create tests ---

    @Test
    void getOrCreate_returnsDraftPlan() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.userId").value("user-1"))
                .andExpect(jsonPath("$.teamId").value("team-1"))
                .andExpect(jsonPath("$.weekStartDate").value("2026-03-30"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void getOrCreate_isIdempotent() throws Exception {
        // First call creates
        MvcResult first = mockMvc.perform(get(BASE_URL)
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andReturn();

        String firstId = objectMapper.readTree(first.getResponse().getContentAsString()).get("id").asText();

        // Second call returns same plan
        MvcResult second = mockMvc.perform(get(BASE_URL)
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andReturn();

        String secondId = objectMapper.readTree(second.getResponse().getContentAsString()).get("id").asText();

        org.junit.jupiter.api.Assertions.assertEquals(firstId, secondId);
    }

    @Test
    void getOrCreate_normalizesWednesdayToMonday() throws Exception {
        // 2026-04-01 is a Wednesday, should normalize to 2026-03-30 (Monday)
        mockMvc.perform(get(BASE_URL)
                        .param("date", "2026-04-01")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStartDate").value("2026-03-30"));
    }

    // --- Transition tests ---

    @Test
    void transition_draftToLocked_succeeds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("LOCKED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCKED"));
    }

    @Test
    void transition_lockedToReconciling_succeeds() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILING"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECONCILING"));
    }

    @Test
    void transition_reconcilingToReconciled_succeeds_noCommitments() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECONCILED"));
    }

    @Test
    void transition_draftToReconciling_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILING"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_TRANSITION"));
    }

    @Test
    void transition_lockedToReconciled_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("RECONCILED"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_TRANSITION"));
    }

    @Test
    void transition_reconciledToAnything_returns409() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");
        transitionPlan(planId, "user-1", "RECONCILING");
        transitionPlan(planId, "user-1", "RECONCILED");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("DRAFT"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_TRANSITION"));
    }

    // --- Auth tests ---

    @Test
    void getPlanById_nonOwnerIC_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get(BASE_URL + "/" + planId)
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPlanById_manager_canAccessDirectReport() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get(BASE_URL + "/" + planId)
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("user-1"));
    }

    @Test
    void getPlanById_leadership_canAccessAnyPlan() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(get(BASE_URL + "/" + planId)
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("user-1"));
    }

    // --- Audit log tests ---

    @Test
    void transitionAuditLog_isRecorded() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");

        mockMvc.perform(get(BASE_URL + "/" + planId + "/transitions")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fromStatus").value("DRAFT"))
                .andExpect(jsonPath("$[0].toStatus").value("LOCKED"))
                .andExpect(jsonPath("$[0].triggeredBy").value("user-1"));
    }

    @Test
    void getTransitions_nonOwnerIC_returns403() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");
        transitionPlan(planId, "user-1", "LOCKED");

        mockMvc.perform(get(BASE_URL + "/" + planId + "/transitions")
                        .header("X-User-Id", "user-2")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    // --- List my plans (no auto-create) ---

    @Test
    void listMyPlans_returnsSummariesInRange() throws Exception {
        createPlan("user-1", "2026-03-30");

        mockMvc.perform(get(BASE_URL + "/me")
                        .param("from", "2026-03-30")
                        .param("to", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].weekStartDate").value("2026-03-30"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"))
                .andExpect(jsonPath("$[0].commitmentCount").value(0));
    }

    @Test
    void listMyPlans_emptyWhenNoPlansInRange() throws Exception {
        mockMvc.perform(get(BASE_URL + "/me")
                        .param("from", "2025-01-06")
                        .param("to", "2025-01-06")
                        .header("X-User-Id", "user-99")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void listMyPlans_rejectsInvertedRange() throws Exception {
        mockMvc.perform(get(BASE_URL + "/me")
                        .param("from", "2026-04-06")
                        .param("to", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isBadRequest());
    }

    // --- Zero commitments lock test ---

    @Test
    void planWithZeroCommitments_canBeLocked() throws Exception {
        String planId = createPlan("user-1", "2026-03-30");

        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest("LOCKED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCKED"));
    }

    // --- Helpers ---

    private String createPlan(String userId, String date) throws Exception {
        MvcResult result = mockMvc.perform(get(BASE_URL)
                        .param("date", date)
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", "team-1"))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private void transitionPlan(String planId, String userId, String targetStatus) throws Exception {
        mockMvc.perform(post(BASE_URL + "/" + planId + "/transition")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlanTransitionRequest(targetStatus))))
                .andExpect(status().isOk());
    }
}
