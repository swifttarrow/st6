package com.wct.rcdo.service;

import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.DefiningObjectiveResponse;
import com.wct.rcdo.dto.UpdateDefiningObjectiveRequest;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DefiningObjectiveService {

    private final DefiningObjectiveRepository repository;
    private final RallyCryRepository rallyCryRepository;
    private final OutcomeRepository outcomeRepository;
    private final OutcomeService outcomeService;

    public DefiningObjectiveService(DefiningObjectiveRepository repository,
                                     RallyCryRepository rallyCryRepository,
                                     OutcomeRepository outcomeRepository,
                                     OutcomeService outcomeService) {
        this.repository = repository;
        this.rallyCryRepository = rallyCryRepository;
        this.outcomeRepository = outcomeRepository;
        this.outcomeService = outcomeService;
    }

    public DefiningObjectiveResponse create(CreateDefiningObjectiveRequest request) {
        if (!rallyCryRepository.existsById(request.rallyCryId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rally Cry not found");
        }
        DefiningObjective entity = new DefiningObjective();
        entity.setRallyCryId(request.rallyCryId());
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(0);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public List<DefiningObjectiveResponse> findAll(UUID rallyCryId, boolean includeArchived) {
        List<DefiningObjective> entities = includeArchived
                ? repository.findByRallyCryIdOrderBySortOrder(rallyCryId)
                : repository.findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(rallyCryId);
        return entities.stream().map(this::toResponse).toList();
    }

    public DefiningObjectiveResponse findById(UUID id) {
        return toResponse(findEntityById(id));
    }

    public DefiningObjectiveResponse update(UUID id, UpdateDefiningObjectiveRequest request) {
        DefiningObjective entity = findEntityById(id);
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public DefiningObjectiveResponse archive(UUID id) {
        DefiningObjective entity = findEntityById(id);
        List<UUID> outcomeIds = outcomeRepository.findByDefiningObjectiveIdOrderBySortOrder(id)
                .stream().map(Outcome::getId).toList();
        outcomeService.checkActiveCommitments(outcomeIds);
        entity.setArchivedAt(OffsetDateTime.now());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public DefiningObjectiveResponse unarchive(UUID id) {
        DefiningObjective entity = findEntityById(id);
        entity.setArchivedAt(null);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    private DefiningObjective findEntityById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Defining Objective not found"));
    }

    private DefiningObjectiveResponse toResponse(DefiningObjective entity) {
        return new DefiningObjectiveResponse(
                entity.getId(),
                entity.getRallyCryId(),
                entity.getName(),
                entity.getDescription(),
                entity.getSortOrder(),
                entity.getArchivedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
