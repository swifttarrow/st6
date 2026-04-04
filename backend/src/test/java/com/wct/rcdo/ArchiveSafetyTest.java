package com.wct.rcdo;

import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.plan.PlanStatus;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.repository.WeeklyPlanRepository;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static com.wct.support.TestJwtAuth.jwtAuth;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ArchiveSafetyTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private RallyCryRepository rallyCryRepository;
    @Autowired private DefiningObjectiveRepository definingObjectiveRepository;
    @Autowired private OutcomeRepository outcomeRepository;
    @Autowired private WeeklyPlanRepository weeklyPlanRepository;
    @Autowired private CommitmentRepository commitmentRepository;

    private UUID rallyCryId;
    private UUID doId;
    private UUID outcomeId;
    private UUID outcome2Id;

    @BeforeEach
    void setUp() {
        RallyCry rc = new RallyCry();
        rc.setName("Test Rally Cry");
        rc.setSortOrder(0);
        rc = rallyCryRepository.save(rc);
        rallyCryId = rc.getId();

        DefiningObjective dObj = new DefiningObjective();
        dObj.setRallyCryId(rallyCryId);
        dObj.setName("Test DO");
        dObj.setSortOrder(0);
        dObj = definingObjectiveRepository.save(dObj);
        doId = dObj.getId();

        Outcome o = new Outcome();
        o.setDefiningObjectiveId(doId);
        o.setName("Test Outcome");
        o.setSortOrder(0);
        o = outcomeRepository.save(o);
        outcomeId = o.getId();

        Outcome o2 = new Outcome();
        o2.setDefiningObjectiveId(doId);
        o2.setName("Test Outcome 2");
        o2.setSortOrder(1);
        o2 = outcomeRepository.save(o2);
        outcome2Id = o2.getId();
    }

    private WeeklyPlan createPlan(PlanStatus status) {
        WeeklyPlan wp = new WeeklyPlan();
        wp.setUserId("user-1");
        wp.setWeekStartDate(LocalDate.of(2026, 3, 30));
        wp.setStatus(status);
        return weeklyPlanRepository.save(wp);
    }

    private WeeklyPlan createPlan(PlanStatus status, String userId, LocalDate weekStart) {
        WeeklyPlan wp = new WeeklyPlan();
        wp.setUserId(userId);
        wp.setWeekStartDate(weekStart);
        wp.setStatus(status);
        return weeklyPlanRepository.save(wp);
    }

    private Commitment createCommitment(UUID weeklyPlanId, UUID outcomeId) {
        Commitment c = new Commitment();
        c.setWeeklyPlanId(weeklyPlanId);
        c.setOutcomeId(outcomeId);
        c.setDescription("Test commitment");
        c.setPriority(1);
        return commitmentRepository.save(c);
    }

    @Test
    void archiveOutcome_noActiveCommitments_returns200() throws Exception {
        mockMvc.perform(patch("/api/rcdo/outcomes/{id}/archive", outcomeId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());
    }

    @Test
    void archiveOutcome_withActiveCommitmentDraft_returns409() throws Exception {
        WeeklyPlan plan = createPlan(PlanStatus.DRAFT);
        createCommitment(plan.getId(), outcomeId);

        mockMvc.perform(patch("/api/rcdo/outcomes/{id}/archive", outcomeId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.activeCommitmentCount").value(1))
                .andExpect(jsonPath("$.affectedPlans", hasSize(1)))
                .andExpect(jsonPath("$.affectedPlans[0].weeklyPlanId").value(plan.getId().toString()))
                .andExpect(jsonPath("$.affectedPlans[0].userId").value("user-1"));
    }

    @Test
    void archiveDO_withChildOutcomeHavingActiveCommitments_returns409() throws Exception {
        WeeklyPlan plan = createPlan(PlanStatus.LOCKED);
        createCommitment(plan.getId(), outcomeId);

        mockMvc.perform(patch("/api/rcdo/defining-objectives/{id}/archive", doId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.activeCommitmentCount").value(1));
    }

    @Test
    void archiveRC_withGrandchildOutcomeHavingActiveCommitments_returns409() throws Exception {
        WeeklyPlan plan = createPlan(PlanStatus.RECONCILING);
        createCommitment(plan.getId(), outcomeId);

        mockMvc.perform(patch("/api/rcdo/rally-cries/{id}/archive", rallyCryId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.activeCommitmentCount").value(1));
    }

    @Test
    void archiveOutcome_afterAllPlansReconciled_returns200() throws Exception {
        WeeklyPlan plan = createPlan(PlanStatus.RECONCILED);
        createCommitment(plan.getId(), outcomeId);

        mockMvc.perform(patch("/api/rcdo/outcomes/{id}/archive", outcomeId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());
    }

    @Test
    void archiveDO_doesNotCascadeArchiveChildOutcomes() throws Exception {
        // No active commitments, so archive should succeed
        mockMvc.perform(patch("/api/rcdo/defining-objectives/{id}/archive", doId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());

        // Child outcomes should NOT be archived
        mockMvc.perform(get("/api/rcdo/outcomes/{id}", outcomeId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());

        mockMvc.perform(get("/api/rcdo/outcomes/{id}", outcome2Id)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());
    }

    @Test
    void archiveRC_doesNotCascadeArchiveChildren() throws Exception {
        // No active commitments, so archive should succeed
        mockMvc.perform(patch("/api/rcdo/rally-cries/{id}/archive", rallyCryId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());

        // Child DO should NOT be archived
        mockMvc.perform(get("/api/rcdo/defining-objectives/{id}", doId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());

        // Grandchild outcomes should NOT be archived
        mockMvc.perform(get("/api/rcdo/outcomes/{id}", outcomeId)
                        .with(jwtAuth("mgr-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());
    }
}
