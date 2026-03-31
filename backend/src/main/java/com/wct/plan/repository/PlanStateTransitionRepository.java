package com.wct.plan.repository;

import com.wct.plan.entity.PlanStateTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanStateTransitionRepository extends JpaRepository<PlanStateTransition, UUID> {

    List<PlanStateTransition> findByWeeklyPlanIdOrderByTransitionedAt(UUID weeklyPlanId);
}
