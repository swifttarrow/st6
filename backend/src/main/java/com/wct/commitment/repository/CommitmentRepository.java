package com.wct.commitment.repository;

import com.wct.commitment.entity.Commitment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
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

    @Query("""
           SELECT
               c.id AS id,
               c.description AS description,
               c.priority AS priority,
               c.notes AS notes,
               o.id AS outcomeId,
               o.name AS outcomeName,
               d.id AS definingObjectiveId,
               d.name AS definingObjectiveName,
               rc.id AS rallyCryId,
               rc.name AS rallyCryName,
               c.actualStatus AS actualStatus,
               c.reconciliationNotes AS reconciliationNotes,
               c.carriedForwardFromId AS carriedForwardFromId,
               CASE WHEN o.archivedAt IS NOT NULL THEN true ELSE false END AS outcomeArchived,
               c.createdAt AS createdAt,
               c.updatedAt AS updatedAt
           FROM Commitment c
           JOIN Outcome o ON c.outcomeId = o.id
           JOIN DefiningObjective d ON o.definingObjectiveId = d.id
           JOIN RallyCry rc ON d.rallyCryId = rc.id
           WHERE c.weeklyPlanId = :planId
           ORDER BY c.priority
           """)
    List<CommitmentDetailsProjection> findDetailedByWeeklyPlanId(@Param("planId") UUID planId);

    @Query("""
           SELECT
               c.id AS id,
               c.description AS description,
               c.priority AS priority,
               c.notes AS notes,
               o.id AS outcomeId,
               o.name AS outcomeName,
               d.id AS definingObjectiveId,
               d.name AS definingObjectiveName,
               rc.id AS rallyCryId,
               rc.name AS rallyCryName,
               c.actualStatus AS actualStatus,
               c.reconciliationNotes AS reconciliationNotes,
               c.carriedForwardFromId AS carriedForwardFromId,
               CASE WHEN o.archivedAt IS NOT NULL THEN true ELSE false END AS outcomeArchived,
               c.createdAt AS createdAt,
               c.updatedAt AS updatedAt
           FROM Commitment c
           JOIN Outcome o ON c.outcomeId = o.id
           JOIN DefiningObjective d ON o.definingObjectiveId = d.id
           JOIN RallyCry rc ON d.rallyCryId = rc.id
           WHERE c.weeklyPlanId = :planId AND c.id = :commitmentId
           """)
    Optional<CommitmentDetailsProjection> findDetailedByPlanIdAndCommitmentId(@Param("planId") UUID planId,
                                                                              @Param("commitmentId") UUID commitmentId);

    @Query("""
           SELECT c.id
           FROM Commitment c
           JOIN Outcome o ON c.outcomeId = o.id
           WHERE c.weeklyPlanId = :planId AND o.archivedAt IS NOT NULL
           ORDER BY c.priority
           """)
    List<UUID> findArchivedCommitmentIdsByWeeklyPlanId(@Param("planId") UUID planId);

    List<Commitment> findByWeeklyPlanIdOrderByPriority(UUID planId);

    long countByWeeklyPlanId(UUID planId);

    List<Commitment> findByWeeklyPlanIdAndActualStatusIsNull(UUID planId);
}
