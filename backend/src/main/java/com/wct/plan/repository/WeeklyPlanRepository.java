package com.wct.plan.repository;

import com.wct.plan.entity.WeeklyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {

    Optional<WeeklyPlan> findByUserIdAndWeekStartDate(String userId, LocalDate weekStartDate);

    List<WeeklyPlan> findByUserIdInAndWeekStartDate(List<String> userIds, LocalDate weekStartDate);
}
