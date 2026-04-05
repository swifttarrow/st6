package com.wct.plan.repository;

import com.wct.plan.entity.WeeklyPlan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {

    Optional<WeeklyPlan> findByUserIdAndWeekStartDate(String userId, LocalDate weekStartDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wp FROM WeeklyPlan wp WHERE wp.id = :id")
    Optional<WeeklyPlan> findByIdForUpdate(@Param("id") UUID id);

    List<WeeklyPlan> findByUserIdInAndWeekStartDate(List<String> userIds, LocalDate weekStartDate);

    List<WeeklyPlan> findByUserIdAndWeekStartDateBetweenOrderByWeekStartDateDesc(
            String userId, LocalDate fromInclusive, LocalDate toInclusive);
}
