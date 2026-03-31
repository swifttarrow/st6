package com.wct.commitment.repository;

import com.wct.commitment.entity.Commitment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommitmentRepository extends JpaRepository<Commitment, UUID> {

    @Query("SELECT COUNT(c) FROM Commitment c JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
           "WHERE c.outcomeId = :outcomeId AND wp.status IN (com.wct.plan.PlanStatus.DRAFT, com.wct.plan.PlanStatus.LOCKED, com.wct.plan.PlanStatus.RECONCILING)")
    long countActiveByOutcomeId(@Param("outcomeId") UUID outcomeId);

    @Query("SELECT COUNT(c) FROM Commitment c JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
           "WHERE c.outcomeId IN :outcomeIds AND wp.status IN (com.wct.plan.PlanStatus.DRAFT, com.wct.plan.PlanStatus.LOCKED, com.wct.plan.PlanStatus.RECONCILING)")
    long countActiveByOutcomeIds(@Param("outcomeIds") Collection<UUID> outcomeIds);

    @Query("SELECT DISTINCT wp.id, wp.userId, wp.weekStartDate FROM Commitment c JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
           "WHERE c.outcomeId IN :outcomeIds AND wp.status IN (com.wct.plan.PlanStatus.DRAFT, com.wct.plan.PlanStatus.LOCKED, com.wct.plan.PlanStatus.RECONCILING)")
    List<Object[]> findAffectedPlansByOutcomeIds(@Param("outcomeIds") Collection<UUID> outcomeIds);
}
