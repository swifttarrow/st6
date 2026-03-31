package com.wct.plan.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan_state_transition")
public class PlanStateTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "weekly_plan_id", nullable = false)
    private UUID weeklyPlanId;

    @Column(name = "from_status", nullable = false)
    private String fromStatus;

    @Column(name = "to_status", nullable = false)
    private String toStatus;

    @Column(name = "triggered_by", nullable = false)
    private String triggeredBy;

    @Column(name = "transitioned_at", nullable = false)
    private OffsetDateTime transitionedAt;

    public PlanStateTransition() {}

    @PrePersist
    public void prePersist() {
        if (transitionedAt == null) {
            transitionedAt = OffsetDateTime.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getWeeklyPlanId() { return weeklyPlanId; }
    public void setWeeklyPlanId(UUID weeklyPlanId) { this.weeklyPlanId = weeklyPlanId; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }

    public OffsetDateTime getTransitionedAt() { return transitionedAt; }
    public void setTransitionedAt(OffsetDateTime transitionedAt) { this.transitionedAt = transitionedAt; }
}
