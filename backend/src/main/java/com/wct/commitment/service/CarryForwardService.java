package com.wct.commitment.service;

import com.wct.commitment.ActualStatus;
import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.plan.PlanStatus;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.repository.WeeklyPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CarryForwardService {

    private final WeeklyPlanRepository weeklyPlanRepository;
    private final CommitmentRepository commitmentRepository;

    public CarryForwardService(WeeklyPlanRepository weeklyPlanRepository,
                               CommitmentRepository commitmentRepository) {
        this.weeklyPlanRepository = weeklyPlanRepository;
        this.commitmentRepository = commitmentRepository;
    }

    @Transactional
    public List<Commitment> carryForward(WeeklyPlan newPlan) {
        LocalDate priorWeek = newPlan.getWeekStartDate().minusDays(7);

        Optional<WeeklyPlan> priorPlanOpt = weeklyPlanRepository.findByUserIdAndWeekStartDate(
                newPlan.getUserId(), priorWeek);

        if (priorPlanOpt.isEmpty() || priorPlanOpt.get().getStatus() != PlanStatus.RECONCILED) {
            return Collections.emptyList();
        }

        WeeklyPlan priorPlan = priorPlanOpt.get();

        // Find eligible commitments from prior plan
        List<Commitment> priorCommitments = commitmentRepository.findByWeeklyPlanIdOrderByPriority(priorPlan.getId());
        List<Commitment> eligible = priorCommitments.stream()
                .filter(c -> c.getActualStatus() == ActualStatus.PARTIALLY_COMPLETED
                        || c.getActualStatus() == ActualStatus.NOT_STARTED)
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            return Collections.emptyList();
        }

        // Idempotency check: find already-carried IDs in the new plan
        List<Commitment> existingInNewPlan = commitmentRepository.findByWeeklyPlanIdOrderByPriority(newPlan.getId());
        Set<UUID> alreadyCarriedIds = existingInNewPlan.stream()
                .map(Commitment::getCarriedForwardFromId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Filter out already-carried
        eligible = eligible.stream()
                .filter(c -> !alreadyCarriedIds.contains(c.getId()))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            return Collections.emptyList();
        }

        // Determine current max priority in new plan
        int maxPriority = existingInNewPlan.stream()
                .mapToInt(Commitment::getPriority)
                .max()
                .orElse(0);

        List<Commitment> newCommitments = new ArrayList<>();
        for (int i = 0; i < eligible.size(); i++) {
            Commitment source = eligible.get(i);
            Commitment carried = new Commitment();
            carried.setWeeklyPlanId(newPlan.getId());
            carried.setOutcomeId(source.getOutcomeId());
            carried.setDescription(source.getDescription());
            carried.setNotes(source.getNotes());
            carried.setPriority(maxPriority + i + 1);
            carried.setCarriedForwardFromId(source.getId());
            // actualStatus and reconciliationNotes remain null
            newCommitments.add(carried);
        }

        return commitmentRepository.saveAll(newCommitments);
    }
}
