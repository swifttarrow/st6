package com.wct.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.ActualStatus;
import com.wct.commitment.dto.CreateCommitmentRequest;
import com.wct.commitment.dto.ReconcileCommitmentRequest;
import com.wct.plan.dto.PlanTransitionRequest;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ManagerDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String rallyCryId1;
    private String rallyCryId2;
    private String outcomeId1;
    private String outcomeId2;

    @BeforeEach
    void setUp() throws Exception {
        // Create RCDO hierarchy: 2 Rally Cries, each with a DO and Outcome
        rallyCryId1 = createRallyCry("Rally Cry Alpha");
        String doId1 = createDefiningObjective(rallyCryId1, "DO Alpha");
        outcomeId1 = createOutcome(doId1, "Outcome Alpha");

        rallyCryId2 = createRallyCry("Rally Cry Beta");
        String doId2 = createDefiningObjective(rallyCryId2, "DO Beta");
        outcomeId2 = createOutcome(doId2, "Outcome Beta");
    }

    @Test
    void managerGetsCorrectTeamOverview() throws Exception {
        // Create plans for 2 users
        String planId1 = createPlan("user-1", "2026-03-30");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");
        createCommitment(planId1, "user-1", outcomeId1, "Task 2");
        transitionPlan(planId1, "user-1", "LOCKED");

        String planId2 = createPlan("user-2", "2026-03-30");
        createCommitment(planId2, "user-2", outcomeId2, "Task 3");

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1", "user-2")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStartDate").value("2026-03-30"))
                .andExpect(jsonPath("$.stats.directReports").value(2))
                .andExpect(jsonPath("$.stats.plansLocked").value(1))
                .andExpect(jsonPath("$.stats.totalCommitments").value(3))
                .andExpect(jsonPath("$.stats.avgCompletionRate").isEmpty())
                .andExpect(jsonPath("$.members", hasSize(2)));
    }

    @Test
    void statsComputation_plansLockedAndAvgCompletionRate() throws Exception {
        // user-1: RECONCILED plan with 2 commitments, 1 COMPLETED
        String planId1 = createPlan("user-1", "2026-03-30");
        String cId1 = createCommitment(planId1, "user-1", outcomeId1, "Task 1");
        String cId2 = createCommitment(planId1, "user-1", outcomeId1, "Task 2");
        transitionPlan(planId1, "user-1", "LOCKED");
        transitionPlan(planId1, "user-1", "RECONCILING");
        reconcileCommitment(planId1, cId1, "user-1", ActualStatus.COMPLETED);
        reconcileCommitment(planId1, cId2, "user-1", ActualStatus.NOT_STARTED);
        transitionPlan(planId1, "user-1", "RECONCILED");

        // user-2: LOCKED plan with 1 commitment
        String planId2 = createPlan("user-2", "2026-03-30");
        createCommitment(planId2, "user-2", outcomeId2, "Task 3");
        transitionPlan(planId2, "user-2", "LOCKED");

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1", "user-2")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.plansLocked").value(2))
                .andExpect(jsonPath("$.stats.totalCommitments").value(3))
                .andExpect(jsonPath("$.stats.avgCompletionRate").value(0.5));
    }

    @Test
    void memberSummaries_haveCorrectFields() throws Exception {
        // user-1: LOCKED plan with 2 commitments linked to RC Alpha
        String planId1 = createPlan("user-1", "2026-03-30");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");
        createCommitment(planId1, "user-1", outcomeId1, "Task 2");
        transitionPlan(planId1, "user-1", "LOCKED");

        // user-2: no plan
        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1", "user-2")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members[0].userId").value("user-1"))
                .andExpect(jsonPath("$.members[0].planStatus").value("LOCKED"))
                .andExpect(jsonPath("$.members[0].commitmentCount").value(2))
                .andExpect(jsonPath("$.members[0].topRallyCry").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.members[1].userId").value("user-2"))
                .andExpect(jsonPath("$.members[1].planId").isEmpty())
                .andExpect(jsonPath("$.members[1].planStatus").isEmpty())
                .andExpect(jsonPath("$.members[1].commitmentCount").value(0));
    }

    @Test
    void rallyCryCoverage_correctCounts() throws Exception {
        // user-1: 2 commitments to RC Alpha
        String planId1 = createPlan("user-1", "2026-03-30");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");
        createCommitment(planId1, "user-1", outcomeId1, "Task 2");

        // user-2: 1 commitment to RC Alpha, 1 to RC Beta
        String planId2 = createPlan("user-2", "2026-03-30");
        createCommitment(planId2, "user-2", outcomeId1, "Task 3");
        createCommitment(planId2, "user-2", outcomeId2, "Task 4");

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1", "user-2")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rallyCryCoverage", hasSize(2)))
                .andExpect(jsonPath("$.rallyCryCoverage[0].rallyCryName").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.rallyCryCoverage[0].commitmentCount").value(3))
                .andExpect(jsonPath("$.rallyCryCoverage[0].memberCount").value(2))
                .andExpect(jsonPath("$.rallyCryCoverage[1].rallyCryName").value("Rally Cry Beta"))
                .andExpect(jsonPath("$.rallyCryCoverage[1].commitmentCount").value(1))
                .andExpect(jsonPath("$.rallyCryCoverage[1].memberCount").value(1));
    }

    @Test
    void consecutiveZeroWeeks_computation() throws Exception {
        // Create commitments for RC Alpha 3 weeks ago, but not for last 2 weeks
        String planId3WeeksAgo = createPlan("user-1", "2026-03-09");
        createCommitment(planId3WeeksAgo, "user-1", outcomeId1, "Old task");

        // No commitments for 2026-03-16, 2026-03-23 for RC Alpha
        // Current week (2026-03-30) - user-1 has no plan for this week

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rallyCryCoverage[0].rallyCryName").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.rallyCryCoverage[0].consecutiveZeroWeeks").value(2));
    }

    @Test
    void icRole_returns403() throws Exception {
        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "user-1")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    @Test
    void emptyTeam_returnsZeroedStats() throws Exception {
        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "nonexistent-user")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.directReports").value(1))
                .andExpect(jsonPath("$.stats.plansLocked").value(0))
                .andExpect(jsonPath("$.stats.totalCommitments").value(0))
                .andExpect(jsonPath("$.stats.avgCompletionRate").isEmpty())
                .andExpect(jsonPath("$.members", hasSize(1)))
                .andExpect(jsonPath("$.members[0].planId").isEmpty());
    }

    // --- Helpers ---

    private String createRallyCry(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/rcdo/rally-cries")
                        .header("X-User-Id", "admin")
                        .header("X-User-Role", "LEADERSHIP")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRallyCryRequest(name, "desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createDefiningObjective(String rallyCryId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/rcdo/defining-objectives")
                        .header("X-User-Id", "admin")
                        .header("X-User-Role", "LEADERSHIP")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateDefiningObjectiveRequest(UUID.fromString(rallyCryId), name, "desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createOutcome(String doId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/rcdo/outcomes")
                        .header("X-User-Id", "admin")
                        .header("X-User-Role", "LEADERSHIP")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOutcomeRequest(UUID.fromString(doId), name, "desc"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

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

    private String createCommitment(String planId, String userId, String outcomeId, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/plans/" + planId + "/commitments")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateCommitmentRequest(description, UUID.fromString(outcomeId), null))))
                .andExpect(status().isCreated())
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

    private void reconcileCommitment(String planId, String commitmentId, String userId, ActualStatus status) throws Exception {
        mockMvc.perform(patch("/api/plans/" + planId + "/commitments/" + commitmentId + "/reconcile")
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReconcileCommitmentRequest(status, null))))
                .andExpect(status().isOk());
    }
}
