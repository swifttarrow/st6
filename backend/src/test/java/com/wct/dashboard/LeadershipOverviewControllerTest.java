package com.wct.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.commitment.dto.CreateCommitmentRequest;
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
class LeadershipOverviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String rallyCryId1;
    private String rallyCryId2;
    private String doId1;
    private String doId2;
    private String outcomeId1;
    private String outcomeId2;

    @BeforeEach
    void setUp() throws Exception {
        rallyCryId1 = createRallyCry("Rally Cry Alpha");
        doId1 = createDefiningObjective(rallyCryId1, "DO Alpha");
        outcomeId1 = createOutcome(doId1, "Outcome Alpha");

        rallyCryId2 = createRallyCry("Rally Cry Beta");
        doId2 = createDefiningObjective(rallyCryId2, "DO Beta");
        outcomeId2 = createOutcome(doId2, "Outcome Beta");
    }

    @Test
    void leadershipGetsFullOverview() throws Exception {
        // Create plans for 2 teams
        String planId1 = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");
        createCommitment(planId1, "user-1", outcomeId1, "Task 2");

        String planId2 = createPlan("user-2", "2026-03-30", "team-B");
        createCommitment(planId2, "user-2", outcomeId2, "Task 3");

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStartDate").value("2026-03-30"))
                .andExpect(jsonPath("$.stats.totalTeams").value(2))
                .andExpect(jsonPath("$.stats.activeRallyCries").value(2))
                .andExpect(jsonPath("$.stats.orgCommitments").value(3))
                .andExpect(jsonPath("$.stats.coverageGaps").value(0))
                .andExpect(jsonPath("$.hierarchy", hasSize(2)))
                .andExpect(jsonPath("$.hierarchy[0].type").value("RALLY_CRY"))
                .andExpect(jsonPath("$.hierarchy[0].name").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].commitmentCount").value(2))
                .andExpect(jsonPath("$.hierarchy[1].type").value("RALLY_CRY"))
                .andExpect(jsonPath("$.hierarchy[1].name").value("Rally Cry Beta"))
                .andExpect(jsonPath("$.hierarchy[1].commitmentCount").value(1));
    }

    @Test
    void coveragePercentagesComputedCorrectly() throws Exception {
        // 2 teams total. RC Alpha has both teams, RC Beta has 1 team
        String planId1 = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");

        String planId2 = createPlan("user-2", "2026-03-30", "team-B");
        createCommitment(planId2, "user-2", outcomeId1, "Task 2");
        createCommitment(planId2, "user-2", outcomeId2, "Task 3");

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hierarchy[0].name").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].teamCount").value(2))
                .andExpect(jsonPath("$.hierarchy[0].totalTeams").value(2))
                .andExpect(jsonPath("$.hierarchy[0].coveragePercent").value(100))
                .andExpect(jsonPath("$.hierarchy[1].name").value("Rally Cry Beta"))
                .andExpect(jsonPath("$.hierarchy[1].teamCount").value(1))
                .andExpect(jsonPath("$.hierarchy[1].totalTeams").value(2))
                .andExpect(jsonPath("$.hierarchy[1].coveragePercent").value(50));
    }

    @Test
    void statusThresholds() throws Exception {
        // 2 teams. RC Alpha = both teams (ON_TRACK), RC Beta = 1 team (ON_TRACK at 50%)
        // We need 3 RCs to test all thresholds. Create a third with 0 coverage.
        String rallyCryId3 = createRallyCry("Rally Cry Gamma");
        String doId3 = createDefiningObjective(rallyCryId3, "DO Gamma");
        createOutcome(doId3, "Outcome Gamma");

        String planId1 = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");

        String planId2 = createPlan("user-2", "2026-03-30", "team-B");
        createCommitment(planId2, "user-2", outcomeId1, "Task 2");
        createCommitment(planId2, "user-2", outcomeId2, "Task 3");

        // 3 teams needed for AT_RISK. Add a 3rd team with no RC Beta commitment.
        String planId3 = createPlan("user-3", "2026-03-30", "team-C");
        createCommitment(planId3, "user-3", outcomeId1, "Task 4");

        // Now: RC Alpha has 3/3 teams = 100% -> ON_TRACK
        // RC Beta has 1/3 teams = 33% -> AT_RISK
        // RC Gamma has 0/3 teams = 0% -> ALERT

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hierarchy[0].name").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].status").value("ON_TRACK"))
                .andExpect(jsonPath("$.hierarchy[1].name").value("Rally Cry Beta"))
                .andExpect(jsonPath("$.hierarchy[1].status").value("AT_RISK"))
                .andExpect(jsonPath("$.hierarchy[2].name").value("Rally Cry Gamma"))
                .andExpect(jsonPath("$.hierarchy[2].status").value("ALERT"));
    }

    @Test
    void consecutiveZeroWeeksCountedCorrectly() throws Exception {
        // Create a commitment for RC Alpha 3 weeks ago, but nothing for last 2 weeks
        String planOld = createPlan("user-1", "2026-03-09", "team-A");
        createCommitment(planOld, "user-1", outcomeId1, "Old task");

        // Current week plan with commitment on RC Beta only (so RC Alpha has 0 this week but that's current week)
        String planCurrent = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planCurrent, "user-1", outcomeId2, "Current task");

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hierarchy[0].name").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].consecutiveZeroWeeks").value(2));
    }

    @Test
    void warningNoteGeneratedForThreeConsecutiveZeroWeeks() throws Exception {
        // Create a commitment for RC Alpha 4 weeks ago, nothing for last 3 weeks
        String planOld = createPlan("user-1", "2026-03-02", "team-A");
        createCommitment(planOld, "user-1", outcomeId1, "Old task");

        // Current week plan with commitment on RC Beta only
        String planCurrent = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planCurrent, "user-1", outcomeId2, "Current task");

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hierarchy[0].name").value("Rally Cry Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].consecutiveZeroWeeks").value(3))
                .andExpect(jsonPath("$.hierarchy[0].warningNote").value("Zero commitments for 3 consecutive weeks."));
    }

    @Test
    void hierarchyHasChildren() throws Exception {
        String planId1 = createPlan("user-1", "2026-03-30", "team-A");
        createCommitment(planId1, "user-1", outcomeId1, "Task 1");

        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hierarchy[0].children", hasSize(1)))
                .andExpect(jsonPath("$.hierarchy[0].children[0].type").value("DEFINING_OBJECTIVE"))
                .andExpect(jsonPath("$.hierarchy[0].children[0].name").value("DO Alpha"))
                .andExpect(jsonPath("$.hierarchy[0].children[0].commitmentCount").value(1))
                .andExpect(jsonPath("$.hierarchy[0].children[0].teamCount").value(1))
                .andExpect(jsonPath("$.hierarchy[0].children[0].consecutiveZeroWeeks").isEmpty())
                .andExpect(jsonPath("$.hierarchy[0].children[0].children").isEmpty());
    }

    @Test
    void managerReturns403() throws Exception {
        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "manager-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void icReturns403() throws Exception {
        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isForbidden());
    }

    @Test
    void emptyOrgReturnsZeroedStats() throws Exception {
        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .header("X-User-Id", "leader-1")
                        .header("X-User-Role", "LEADERSHIP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalTeams").value(0))
                .andExpect(jsonPath("$.stats.activeRallyCries").value(2))
                .andExpect(jsonPath("$.stats.orgCommitments").value(0))
                .andExpect(jsonPath("$.stats.coverageGaps").value(2))
                .andExpect(jsonPath("$.hierarchy", hasSize(2)))
                .andExpect(jsonPath("$.hierarchy[0].coveragePercent").value(0))
                .andExpect(jsonPath("$.hierarchy[0].status").value("ALERT"));
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

    private String createPlan(String userId, String date, String teamId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/plans")
                        .param("date", date)
                        .header("X-User-Id", userId)
                        .header("X-User-Role", "IC")
                        .header("X-Team-Id", teamId))
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
}
