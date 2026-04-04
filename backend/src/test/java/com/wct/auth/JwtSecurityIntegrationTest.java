package com.wct.auth;

import com.wct.plan.PlanStatus;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.repository.WeeklyPlanRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static com.wct.support.TestJwtAuth.jwtAuth;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class JwtSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WeeklyPlanRepository weeklyPlanRepository;

    @Test
    void unauthenticatedApiRequest_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/leadership").param("date", "2026-03-30"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void leadershipJwt_canAccessLeadershipOverview() throws Exception {
        mockMvc.perform(get("/api/dashboard/leadership")
                        .param("date", "2026-03-30")
                        .with(jwtAuth("leader-1", "LEADERSHIP", "exec-team")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStartDate").value("2026-03-30"));
    }

    @Test
    void managerJwt_scopeIsEnforcedForDashboardRequests() throws Exception {
        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "alice")
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "alice", "bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.directReports").value(1));

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "eve")
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "alice", "bob")))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerJwt_usesScopedDirectReportsWhenMemberIdsOmitted() throws Exception {
        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "alice", "bob", "carol")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.directReports").value(3));
    }

    @Test
    void managerJwt_cannotReadPlanOutsideScopedDirectReports() throws Exception {
        String planId = createPlan("alice", "team-1", "2026-03-30", PlanStatus.DRAFT);

        mockMvc.perform(get("/api/plans/" + planId)
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "bob")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/plans/" + planId)
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("alice"));
    }

    @Test
    void managerJwt_cannotUnlockPlanOutsideScopedDirectReports() throws Exception {
        String planId = createPlan("alice", "team-1", "2026-03-30", PlanStatus.LOCKED);

        mockMvc.perform(post("/api/plans/" + planId + "/unlock")
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "bob")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/plans/" + planId + "/unlock")
                        .with(jwtAuth("manager-1", "MANAGER", "team-1", "alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    private String createPlan(String userId, String teamId, String weekStartDate, PlanStatus status) {
        WeeklyPlan plan = new WeeklyPlan();
        plan.setUserId(userId);
        plan.setTeamId(teamId);
        plan.setWeekStartDate(LocalDate.parse(weekStartDate));
        plan.setStatus(status);
        return weeklyPlanRepository.save(plan).getId().toString();
    }
}
