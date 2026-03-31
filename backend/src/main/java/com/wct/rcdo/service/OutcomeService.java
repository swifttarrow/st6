package com.wct.rcdo.service;

import com.wct.commitment.repository.CommitmentRepository;
import com.wct.rcdo.dto.ArchiveConflictResponse;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.OutcomeResponse;
import com.wct.rcdo.dto.UpdateOutcomeRequest;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.exception.ArchiveConflictException;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OutcomeService {

    private final OutcomeRepository repository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final CommitmentRepository commitmentRepository;

    public OutcomeService(OutcomeRepository repository,
                          DefiningObjectiveRepository definingObjectiveRepository,
                          CommitmentRepository commitmentRepository) {
        this.repository = repository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.commitmentRepository = commitmentRepository;
    }

    public OutcomeResponse create(CreateOutcomeRequest request) {
        validateName(request.name());
        if (!definingObjectiveRepository.existsById(request.definingObjectiveId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Defining Objective not found");
        }
        Outcome entity = new Outcome();
        entity.setDefiningObjectiveId(request.definingObjectiveId());
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(0);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public List<OutcomeResponse> findAll(UUID definingObjectiveId, boolean includeArchived) {
        List<Outcome> entities = includeArchived
                ? repository.findByDefiningObjectiveIdOrderBySortOrder(definingObjectiveId)
                : repository.findByDefiningObjectiveIdAndArchivedAtIsNullOrderBySortOrder(definingObjectiveId);
        return entities.stream().map(this::toResponse).toList();
    }

    public OutcomeResponse findById(UUID id) {
        return toResponse(findEntityById(id));
    }

    public OutcomeResponse update(UUID id, UpdateOutcomeRequest request) {
        validateName(request.name());
        Outcome entity = findEntityById(id);
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public OutcomeResponse archive(UUID id) {
        Outcome entity = findEntityById(id);
        checkActiveCommitments(List.of(id));
        entity.setArchivedAt(OffsetDateTime.now());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    void checkActiveCommitments(List<UUID> outcomeIds) {
        if (outcomeIds.isEmpty()) return;
        long count = commitmentRepository.countActiveByOutcomeIds(outcomeIds);
        if (count > 0) {
            List<Object[]> rows = commitmentRepository.findAffectedPlansByOutcomeIds(outcomeIds);
            List<ArchiveConflictResponse.AffectedPlan> affectedPlans = rows.stream()
                    .map(r -> new ArchiveConflictResponse.AffectedPlan(
                            (UUID) r[0], (String) r[1], (LocalDate) r[2]))
                    .toList();
            throw new ArchiveConflictException(new ArchiveConflictResponse(
                    "Cannot archive: " + count + " active commitment(s) reference this entity",
                    (int) count, affectedPlans));
        }
    }

    public OutcomeResponse unarchive(UUID id) {
        Outcome entity = findEntityById(id);
        entity.setArchivedAt(null);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    private Outcome findEntityById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Outcome not found"));
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must not be blank");
        }
    }

    private OutcomeResponse toResponse(Outcome entity) {
        return new OutcomeResponse(
                entity.getId(),
                entity.getDefiningObjectiveId(),
                entity.getName(),
                entity.getDescription(),
                entity.getSortOrder(),
                entity.getArchivedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
