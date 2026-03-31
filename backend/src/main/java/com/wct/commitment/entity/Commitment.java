package com.wct.commitment.entity;

import com.wct.commitment.ActualStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "commitment")
public class Commitment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "weekly_plan_id", nullable = false)
    private UUID weeklyPlanId;

    @Column(name = "outcome_id", nullable = false)
    private UUID outcomeId;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "priority", nullable = false)
    private int priority;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_status")
    private ActualStatus actualStatus;

    @Column(name = "reconciliation_notes", columnDefinition = "TEXT")
    private String reconciliationNotes;

    @Column(name = "carried_forward_from_id")
    private UUID carriedForwardFromId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Commitment() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getWeeklyPlanId() { return weeklyPlanId; }
    public void setWeeklyPlanId(UUID weeklyPlanId) { this.weeklyPlanId = weeklyPlanId; }

    public UUID getOutcomeId() { return outcomeId; }
    public void setOutcomeId(UUID outcomeId) { this.outcomeId = outcomeId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public ActualStatus getActualStatus() { return actualStatus; }
    public void setActualStatus(ActualStatus actualStatus) { this.actualStatus = actualStatus; }

    public String getReconciliationNotes() { return reconciliationNotes; }
    public void setReconciliationNotes(String reconciliationNotes) { this.reconciliationNotes = reconciliationNotes; }

    public UUID getCarriedForwardFromId() { return carriedForwardFromId; }
    public void setCarriedForwardFromId(UUID carriedForwardFromId) { this.carriedForwardFromId = carriedForwardFromId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
